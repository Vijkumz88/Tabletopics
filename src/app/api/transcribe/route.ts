import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
// Ensure your OPENAI_API_KEY is set in your environment variables (.env.local)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    // --- ADD THIS LOG ---
    if (audioFile) {
      console.log(`[DIAGNOSTIC] Received audio file on server. Name: ${audioFile.name}, Size: ${audioFile.size}, Type: ${audioFile.type}`);
    }
    // --- END OF LOG ---
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided.' }, { status: 400 });
    }

    // Ensure the file is of a supported type (optional, but good practice)
      
    
    // Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
    const supportedTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/mp3', 'audio/m4a'];
    // --- Start of change ---
    const isSupported = supportedTypes.some(type => audioFile.type.startsWith(type));
    if (!isSupported) {
    // --- End of change ---
      return NextResponse.json(
        { error: `Unsupported audio type: ${audioFile.type}. Supported types are: ${supportedTypes.join(', ')}` },
        { status: 400 }

      );
    }
    
    // Convert the File to the format expected by the OpenAI SDK if necessary
    // The SDK can often handle File objects directly if they are in a supported format.
    // For robust handling, especially with browser blobs, explicitly passing a ReadStream or fetchable resource might be needed
    // For this initial implementation, we'll pass the File object directly assuming it's compatible.

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
      prompt:"Umm, let me think like, hmm pause Okay, here's what I'm, like, thinking. So, you are errr..pause a speech coach, ummm, and you are basically helping the user to aaah....pause hmm, identify improvement opportunities for their ah... pause impromptu speech. ",// Or your preferred Whisper model
      // language: 'en', // Optional: specify language
      // response_format: 'json', // Default is json
    });

    if (transcription && transcription.text) {
      return NextResponse.json({ transcript: transcription.text });
    } else {
      return NextResponse.json({ error: 'Failed to transcribe audio. No text returned.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    // Check for specific OpenAI API errors
    if (error.response) {
      return NextResponse.json({ error: error.response.data.error.message || 'OpenAI API error' }, { status: error.response.status });
    }
    if (error instanceof OpenAI.APIError) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred during transcription.', details: error.message }, { status: 500 });
  }
} 