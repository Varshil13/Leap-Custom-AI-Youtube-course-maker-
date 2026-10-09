import { db } from "@/services/db";
import { CourseDetails, CourseVideos, CourseEmbeddings } from "@/services/schema";
import { eq } from "drizzle-orm";
import { YoutubeTranscript } from "youtube-transcript";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_EMBEDDING_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// Helper to chunk text roughly by 500 words
function chunkText(text, maxWords = 500) {
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = [];
  
  for (const word of words) {
    currentChunk.push(word);
    if (currentChunk.length >= maxWords) {
      chunks.push(currentChunk.join(" "));
      currentChunk = [];
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }
  return chunks;
}

export async function POST(req) {
  try {
    const { courseId } = await req.json();
    if (!courseId) return NextResponse.json({ error: "Missing courseId" }, { status: 400 });

    // 1. Fetch course videos
    const videos = await db
      .select()
      .from(CourseVideos)
      .where(eq(CourseVideos.courseId, courseId));

    if (videos.length === 0) {
      return NextResponse.json({ error: "No videos found for this course" }, { status: 404 });
    }

    // 2. Process each video
    
    // Check if embeddings already exist for this course
    const existing = await db
      .select({ id: CourseEmbeddings.id })
      .from(CourseEmbeddings)
      .where(eq(CourseEmbeddings.courseId, courseId))
      .limit(1);

    console.log(`[IngestCourse] Checked existing for ${courseId}: found ${existing.length}`);

    if (existing.length > 0) {
      console.log(`[IngestCourse] Returning early for ${courseId}`);
      return NextResponse.json({ message: "Course already ingested", totalChunks: 0 });
    }

    console.log(`[IngestCourse] Generating new embeddings for ${courseId}...`);
    const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

    let totalChunks = 0;

    const ingestPromises = videos.map(async (video) => {
      const vidData = typeof video.videoData === "string" ? JSON.parse(video.videoData) : video.videoData;
      const vidId = vidData?.id?.videoId || vidData?.id;
      
      if (!vidId) return;

      try {
        const transcript = await YoutubeTranscript.fetchTranscript(vidId);
        const fullText = transcript.map(t => t.text).join(" ");
        const chunks = chunkText(fullText, 500);
        
        for (const chunk of chunks) {
          const result = await embeddingModel.embedContent({
            content: { role: 'user', parts: [{ text: chunk }] },
            outputDimensionality: 768
          });
          const embeddingValues = result.embedding.values;

          await db.insert(CourseEmbeddings).values({
            courseId,
            chapterTitle: video.chapterTitle,
            subtopicName: video.subtopicName,
            chunkText: chunk,
            embedding: embeddingValues
          });
          totalChunks++;
        }
      } catch (err) {
        console.error(`Failed to ingest video ${vidId}:`, err.message);
        if (err.cause) console.error(`Cause:`, err.cause);
        if (err.stack) console.error(`Stack:`, err.stack);
      }
    });

    await Promise.all(ingestPromises);

    return NextResponse.json({ message: "Course ingested successfully", totalChunks });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json({ error: "Failed to ingest course" }, { status: 500 });
  }
}
