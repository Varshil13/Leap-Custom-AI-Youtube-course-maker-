import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse } from "@/services/gemini";
import { getServerSession } from "next-auth/next";
import { db } from "@/services/db";
import { CourseEmbeddings } from "@/services/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(); const userId = session?.user?.email;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, courseName, courseDescription, level, chapterTitle, subtopicName, language } = await req.json();

    let transcriptContext = "";
    if (courseId) {
      try {
        const chunks = await db
          .select({ chunkText: CourseEmbeddings.chunkText })
          .from(CourseEmbeddings)
          .where(
            and(
              eq(CourseEmbeddings.courseId, courseId),
              eq(CourseEmbeddings.chapterTitle, chapterTitle),
              eq(CourseEmbeddings.subtopicName, subtopicName)
            )
          );
        if (chunks && chunks.length > 0) {
          transcriptContext = chunks.map((c: any) => c.chunkText).join("\n");
        }
      } catch (err) {
        console.error("Error fetching transcript context:", err);
      }
    }

    // Create a focused prompt for a single subtopic
    const prompt = `You are an expert technical writer and educator. Generate beautiful, structured lesson notes for the following subtopic.

Course Details:
- Course: ${courseName}
- Description: ${courseDescription}  
- Level: ${level}
- Chapter: ${chapterTitle}
- Subtopic: ${subtopicName}
- Programming Language: ${language || 'general'}

${transcriptContext ? `Here is the actual transcript from the video lesson for this subtopic:\n"""\n${transcriptContext.substring(0, 8000)}\n"""\n\nCRITICAL INSTRUCTION: You MUST base your notes on the specific concepts, explanations, and examples used in the transcript above. Act as a technical writer transforming this messy transcript into clean, professional lesson notes.` : 'No video transcript available. Use your general knowledge to create the notes.'}

Return ONLY the Markdown content directly without any JSON wrapper. Format it exactly as:

# ${subtopicName}

Brief explanation of the concept in one paragraph (sync with the video if transcript provided).

## Key Points
- First important point from the lesson
- Second important point with details
- Third key aspect to understand

## Code Example
\`\`\`${language === 'general' ? 'javascript' : language}
// Provide a complete, working code block that perfectly matches or completes what was described in the lesson
${language === 'python' ? 'def example():\n    print("Hello World")' : language === 'cpp' ? 'int main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}' : language === 'java' ? 'public class Example {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}' : 'function example() {\n    console.log("Hello World");\n}'}
\`\`\`

## Summary
Concise summary of the key takeaways from this topic.

CRITICAL FORMATTING RULES:
- Return ONLY Markdown content, NO JSON wrapper, NO LaTeX
- Use standard Markdown headers (# and ##)
- Use standard Markdown bullet points (-)
- Code goes in standard Markdown code blocks (\`\`\`language ... \`\`\`)
- Keep content focused and educational
- Use **bold**, *italic*, and \`inline code\` where appropriate
- Focus only on the specific subtopic: ${subtopicName}
- Do NOT wrap the response in a JSON block or code block wrapper (like \`\`\`markdown ... \`\`\`) - return raw text only`;

    // Call the Gemini service
    const result = await generateAIResponse(prompt);
    
    // Automatically vectorize and embed the generated content so it's searchable in Global Chat
    try {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_EMBEDDING_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
      
      // Split content into meaningful chunks (e.g., by double newline/paragraphs)
      const chunks = result.text.split('\n\n').filter((p: string) => p.trim().length > 20);
      
      for (const chunkText of chunks) {
        const embedResult = await embeddingModel.embedContent({
          content: { role: 'user', parts: [{ text: chunkText }] },
          outputDimensionality: 768
        });
        const embeddingValues = embedResult.embedding.values;
        
        await db.insert(CourseEmbeddings).values({
          courseId: courseId,
          chapterTitle: chapterTitle,
          subtopicName: subtopicName,
          chunkText: `[LESSON NOTES] ${chunkText}`, // Tag it so we know it's generated notes
          embedding: embeddingValues
        });
      }
    } catch (embError) {
      console.error("Error embedding generated content:", embError);
    }
    
    return NextResponse.json({
      success: true,
      text: result.text
    });

  } catch (error) {
    console.error("Error generating subtopic content:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to generate content" 
      },
      { status: 500 }
    );
  }
}

