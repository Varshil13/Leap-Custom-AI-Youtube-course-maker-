import { db } from "@/services/db";
import { CourseEmbeddings, CourseContent, CourseDetails } from "@/services/schema";
import { eq, sql } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateAIResponse } from "@/services/gemini";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_EMBEDDING_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { courseId, question } = await req.json();
    if (!courseId || !question) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    // 1. Convert user's question into a Vector Embedding
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
    const result = await embeddingModel.embedContent({
      content: { role: 'user', parts: [{ text: question }] },
      outputDimensionality: 768
    });
    const queryEmbedding = result.embedding.values;

    // 2. Vector Search (Cosine Similarity) via Drizzle ORM
    const vectorString = `[${queryEmbedding.join(',')}]`;

    const nearestChunks = await db
      .select({
        chunkText: CourseEmbeddings.chunkText,
        chapterTitle: CourseEmbeddings.chapterTitle,
        subtopicName: CourseEmbeddings.subtopicName,
      })
      .from(CourseEmbeddings)
      .where(eq(CourseEmbeddings.courseId, courseId))
      .orderBy(sql`${CourseEmbeddings.embedding} <=> ${vectorString}`)
      .limit(3);

    // 3. Fetch any generated textual Course Content
    const generatedContent = await db
      .select({
        chapterTitle: CourseContent.chapterTitle,
        subtopicName: CourseContent.subtopicName,
        contentData: CourseContent.contentData,
      })
      .from(CourseContent)
      .where(eq(CourseContent.courseId, courseId));

    // 4. Fetch Course Details (for Roadmap/Outline)
    const courseInfo = await db
      .select({ name: CourseDetails.name, roadmap: CourseDetails.roadmap })
      .from(CourseDetails)
      .where(eq(CourseDetails.courseId, courseId))
      .limit(1);

    if (nearestChunks.length === 0 && generatedContent.length === 0 && courseInfo.length === 0) {
      return NextResponse.json({ text: "I couldn't find any information about this course in the database." });
    }

    let contextParts = [];

    // Add Course Roadmap if available
    if (courseInfo.length > 0) {
       contextParts.push(`--- COURSE OVERVIEW ---\nCourse Name: ${courseInfo[0].name}\nRoadmap/Outline: ${typeof courseInfo[0].roadmap === 'string' ? courseInfo[0].roadmap : JSON.stringify(courseInfo[0].roadmap)}`);
    }

    // Add Video Transcript Chunks
    if (nearestChunks.length > 0) {
      const chunkStr = nearestChunks.map((chunk, idx) => 
        `--- VIDEO EXCERPT ${idx + 1} (From ${chunk.chapterTitle}: ${chunk.subtopicName}) ---\n${chunk.chunkText}`
      ).join("\n\n");
      contextParts.push(chunkStr);
    }

    // Add Generated Text Content (truncated to avoid exceeding context, though Gemini can handle large contexts)
    if (generatedContent.length > 0) {
      // Pick up to 5 most relevant or just all of them if few
      const textContents = generatedContent.slice(0, 10).map((c, idx) => 
        `--- TEXT LESSON (From ${c.chapterTitle}: ${c.subtopicName}) ---\n${c.contentData?.content ? String(c.contentData.content).substring(0, 2000) : ''}`
      ).join("\n\n");
      contextParts.push(textContents);
    }

    const finalContext = contextParts.join("\n\n");

    const prompt = `
You are the Global Course AI Tutor. A student has asked a question about their course.
Use the following course information (which may include the syllabus/roadmap, video transcripts, and generated lesson notes) to answer the student's question.

${finalContext}

Student Question: "${question}"

Answer the question accurately. If the specific details haven't been generated in the course yet, use the Roadmap context to tell them where it will be covered, and then use your general knowledge to give them a brief, helpful answer anyway! Format nicely in Markdown.
`;

    // 5. Generate final answer
    const aiResponse = await generateAIResponse(prompt);
    
    // Aggregate sources
    const sources = new Set();
    nearestChunks.forEach(c => sources.add(`${c.chapterTitle}: ${c.subtopicName} (Video)`));
    generatedContent.forEach(c => sources.add(`${c.chapterTitle}: ${c.subtopicName} (Notes)`));

    return NextResponse.json({ 
      text: aiResponse.text,
      sources: Array.from(sources).slice(0, 5)
    });
  } catch (error) {
    console.error("Global chat error:", error);
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}
