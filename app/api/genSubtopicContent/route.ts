import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse } from "@/services/gemini";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseName, courseDescription, level, chapterTitle, subtopicName, language } = await req.json();

    // Create a focused prompt for a single subtopic
    const prompt = `You are an expert educator. Generate concise educational content for a specific subtopic in markdown format.

Course Details:
- Course: ${courseName}
- Description: ${courseDescription}  
- Level: ${level}
- Chapter: ${chapterTitle}
- Subtopic: ${subtopicName}
- Programming Language: ${language || 'general'}

Generate focused content for this specific subtopic only. 

Return ONLY the LaTeX content directly without any JSON wrapper. Format it exactly as:

\\section{${subtopicName}}

Brief explanation of the concept in one paragraph.

\\subsection{Key Points}
\\begin{itemize}
\\item First important point about the topic
\\item Second important point with details
\\item Third key aspect to understand
\\end{itemize}

\\subsection{Code Example}
\\begin{lstlisting}
import ${language === 'python' ? 'pandas as pd' : language === 'cpp' ? '<iostream>' : language === 'java' ? 'java.util.*' : 'React from "react"'}

// Complete, working code example that demonstrates the concept
${language === 'python' ? 'def example():' : language === 'cpp' ? 'int main() {' : language === 'java' ? 'public class Example {' : 'function example() {'}
${language === 'python' ? '    print("Hello World")' : language === 'cpp' ? '    std::cout << "Hello World" << std::endl;' : language === 'java' ? '    System.out.println("Hello World");' : '    console.log("Hello World");'}
${language === 'python' ? '' : language === 'cpp' ? '    return 0;' : language === 'java' ? '}' : '}'}
${language === 'python' ? 'example()' : language === 'cpp' ? '}' : ''}
\\end{lstlisting}

\\subsection{Summary}
Concise summary of the key takeaways from this topic.

CRITICAL FORMATTING RULES:
- Return ONLY LaTeX content, NO JSON wrapper
- Use \\section{} for main title, \\subsection{} for subheadings
- Use \\begin{itemize} \\item ... \\end{itemize} for bullet points
- Code goes in \\begin{lstlisting}[language=...] ... \\end{lstlisting}
- Keep content focused and educational
- Use \\textbf{} for bold, \\textit{} for italic, \\texttt{} for inline code
- Focus only on the specific subtopic: ${subtopicName}
- Do NOT wrap the response in JSON - return raw LaTeX only`;

    // Call the Gemini service
    const result = await generateAIResponse(prompt);
    
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
