import { generateAIResponse } from '@/services/gemini';
import { NextResponse } from 'next/server';
import { db } from "@/services/db";
import { CourseEmbeddings, CourseContent } from "@/services/schema";
import { eq, sql, and } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_EMBEDDING_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { question, courseId, chapterTitle, subtopicName, hasVideo } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }
    
    let transcriptContext = 'No relevant context found.';
    let generatedContentText = '';
    
    if (courseId) {
      // Fetch generated lesson content (useful for text-only courses or as supplementary info)
      try {
        const contentRows = await db
          .select({ contentData: CourseContent.contentData })
          .from(CourseContent)
          .where(and(
            eq(CourseContent.courseId, courseId),
            eq(CourseContent.chapterTitle, chapterTitle),
            eq(CourseContent.subtopicName, subtopicName)
          ))
          .limit(1);
          
        if (contentRows.length > 0 && contentRows[0].contentData?.content) {
          generatedContentText = contentRows[0].contentData.content;
        }
      } catch (err) {
        console.error('Content fetch error:', err);
      }

      try {
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
        const result = await embeddingModel.embedContent({
          content: { role: 'user', parts: [{ text: question }] },
          outputDimensionality: 768
        });
        const embeddingValues = result.embedding.values;

        // Perform vector search
        const similarity = sql`1 - (${CourseEmbeddings.embedding} <=> ${JSON.stringify(embeddingValues)}::vector)`;
        const relevantChunks = await db
          .select({
            chunkText: CourseEmbeddings.chunkText,
            similarity: similarity
          })
          .from(CourseEmbeddings)
          .where(and(
            eq(CourseEmbeddings.courseId, courseId),
            eq(CourseEmbeddings.chapterTitle, chapterTitle),
            eq(CourseEmbeddings.subtopicName, subtopicName)
          ))
          .orderBy(sql`${CourseEmbeddings.embedding} <=> ${JSON.stringify(embeddingValues)}::vector`)
          .limit(5);

        if (relevantChunks.length > 0) {
          transcriptContext = relevantChunks.map(c => c.chunkText).join('\n\n...');
          if (generatedContentText) {
             transcriptContext = `[LESSON CONTENT]\n${generatedContentText.substring(0, 4000)}\n\n[VIDEO TRANSCRIPT MATCHES]\n${transcriptContext}`;
          }
        } else if (generatedContentText) {
          transcriptContext = `[LESSON CONTENT]\n${generatedContentText}`;
        }

      } catch (embError) {
        console.error('Embedding search error:', embError);
        // Fallback or ignore if embedding search fails
      }
    }

    const lessonType = hasVideo ? "video lesson" : "written lesson";
    const contextType = hasVideo ? "video transcript" : "lesson content";

    const prompt = `
You are an expert, friendly AI tutor helping a student learn about "${chapterTitle}: ${subtopicName}".

The student is currently going through a ${lessonType}. Here is relevant context from the ${contextType} based on their question:
"${transcriptContext}"
(Note: Context may be truncated or missing)

The student asked the following question:
"${question}"

Provide a highly contextual, accurate, and concise answer based primarily on the provided ${contextType} context. If the context lacks the answer, use your general knowledge but mention that it wasn't explicitly covered in the lesson material. Format your answer nicely in Markdown.
`;

    const responseResult = await generateAIResponse(prompt);
    
    return NextResponse.json({ text: responseResult.text });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to generate answer' }, { status: 500 });
  }
}
