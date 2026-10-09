import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/services/gemini';
import { getServerSession } from "next-auth/next";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(); const userId = session?.user?.email;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userInputPrompt } = await request.json();
    if (!userInputPrompt) {
      return NextResponse.json({ error: 'Missing prompt in request body.' }, { status: 400 });
    }
    const result = await generateAIResponse(userInputPrompt);
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate AI response.' }, { status: 500 });
  }
}
