import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  onTranscriptionComplete?: (text: string, audioUrl: string) => void;
  conversationId?: string;
  language?: string;
}

export function VoiceRecorder({ onTranscriptionComplete, conversationId, language }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      // Cleanup: stop recording if component unmounts
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert to base64 and send for transcription
        setIsProcessing(true);
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(",")[1];
            
            const response = await fetch("/api/audio/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                audioData: base64Audio,
                language: language || "en",
                conversationId,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Transcription failed");
            }

            const result = await response.json();
            
            if (onTranscriptionComplete) {
              onTranscriptionComplete(result.text, result.audioUrl);
            }

            setIsProcessing(false);
            toast({
              title: "Transcription Complete",
              description: "Your voice message has been transcribed",
            });
          };
          reader.readAsDataURL(audioBlob);
        } catch (error: any) {
          console.error("Transcription error:", error);
          setIsProcessing(false);
          toast({
            title: "Transcription Failed",
            description: error.message || "Failed to transcribe audio",
            variant: "destructive",
          });
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording Failed",
        description: error.message || "Failed to access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording && !isProcessing && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startRecording}
          className="gap-2"
        >
          <Mic className="h-4 w-4" />
          Record
        </Button>
      )}
      
      {isRecording && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={stopRecording}
          className="gap-2"
        >
          <Square className="h-4 w-4" />
          Stop
        </Button>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Transcribing...
        </div>
      )}

      {audioUrl && !isProcessing && (
        <audio src={audioUrl} controls className="h-8" />
      )}
    </div>
  );
}

interface TextToSpeechPlayerProps {
  text: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  conversationId?: string;
}

export function TextToSpeechPlayer({ text, voice = "alloy", conversationId }: TextToSpeechPlayerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const generateSpeech = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "No text to convert to speech",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/audio/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text,
          voice,
          conversationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Speech generation failed");
      }

      const result = await response.json();
      setAudioUrl(result.audioUrl);
    } catch (error: any) {
      console.error("Speech generation error:", error);
      toast({
        title: "Speech Generation Failed",
        description: error.message || "Failed to generate speech",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={generateSpeech}
        disabled={isGenerating || !text.trim()}
        className="gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4" />
            Speak
          </>
        )}
      </Button>
      
      {audioUrl && (
        <audio src={audioUrl} controls className="h-8" autoPlay />
      )}
    </div>
  );
}

