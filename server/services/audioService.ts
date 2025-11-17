import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface TranscriptionResult {
  text: string;
  language: string;
  duration?: number;
}

export interface TextToSpeechResult {
  audioData: Buffer;
  mimeType: string;
}

/**
 * Transcribe audio using OpenAI Whisper
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  language?: string
): Promise<TranscriptionResult> {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    // Create a File-like object from the buffer
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(audioBuffer);
    const blob = new Blob([uint8Array], { type: "audio/webm" });
    const file = new File([blob], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file: file as any,
      model: "whisper-1",
      language: language || undefined,
      response_format: "verbose_json",
    });

    return {
      text: transcription.text,
      language: (transcription as any).language || "en",
      duration: (transcription as any).duration,
    };
  } catch (error: any) {
    console.error("Transcription error:", error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Convert text to speech using OpenAI TTS
 */
export async function textToSpeech(
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
  model: "tts-1" | "tts-1-hd" = "tts-1"
): Promise<TextToSpeechResult> {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const response = await openai.audio.speech.create({
      model,
      voice,
      input: text,
    });

    // Convert response to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      audioData: buffer,
      mimeType: "audio/mpeg",
    };
  } catch (error: any) {
    console.error("Text-to-speech error:", error);
    throw new Error(`Text-to-speech failed: ${error.message}`);
  }
}

/**
 * Real-time transcription using streaming (for future WebSocket support)
 */
export async function* transcribeAudioStream(
  audioChunks: AsyncIterable<Buffer>,
  language?: string
): AsyncGenerator<string, void, unknown> {
  // This would require WebSocket support for real-time streaming
  // For now, we'll collect chunks and transcribe at the end
  const chunks: Buffer[] = [];
  
  for await (const chunk of audioChunks) {
    chunks.push(chunk);
  }

  const fullAudio = Buffer.concat(chunks);
  const result = await transcribeAudio(fullAudio, language);
  
  yield result.text;
}

