import 'dotenv/config';

type AIFile = {
  filename: string;
  mimeType: string;
  dataBase64: string; // keep as base64 so it’s easy to return via JSON
};

export async function generateAIResponse(prompt: string): Promise<{
  text: string;
  files: AIFile[];
}> {
  const apiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY (or GROK_API_KEY) environment variable.');
  }

  const model = 'openai/gpt-oss-20b';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Groq API error: ${response.status} ${errorText}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const text =
    typeof content === 'string'
      ? content
      : Array.isArray(content)
      ? content
          .map((part: { text?: string }) => part?.text || '')
          .join('')
      : '';

  // Kept for compatibility with existing route handlers.
  const files: AIFile[] = [];

  return { text, files };
}