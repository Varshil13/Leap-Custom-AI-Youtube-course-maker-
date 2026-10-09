import { YoutubeTranscript } from 'youtube-transcript';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const fullText = transcript.map(t => t.text).join(' ');
    return NextResponse.json({ transcript: fullText });
  } catch (error) {
    console.error('Transcript error:', error);
    return NextResponse.json({ error: 'Failed to fetch transcript. Video might not have closed captions.' }, { status: 500 });
  }
}
