import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, Video, FileVideo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface VideoAnalyzerProps {
  onAnalysisComplete?: (analysis: VideoAnalysisResult) => void;
  conversationId?: string;
}

interface VideoAnalysisResult {
  description: string;
  transcription?: string;
  keyFrames?: Array<{
    timestamp: number;
    description: string;
  }>;
  metadata?: {
    duration?: number;
    resolution?: string;
    format?: string;
  };
  videoUrl: string;
}

export function VideoAnalyzer({ onAnalysisComplete, conversationId }: VideoAnalyzerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VideoAnalysisResult | null>(null);
  const [prompt, setPrompt] = useState("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("video", file);
      if (prompt) {
        formData.append("prompt", prompt);
      }
      if (conversationId) {
        formData.append("conversationId", conversationId);
      }

      const response = await fetch("/api/video/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Video upload failed");
      }

      const result = await response.json();
      setAnalysis(result);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

      toast({
        title: "Video Analyzed",
        description: "Your video has been analyzed successfully",
      });
    } catch (error: any) {
      console.error("Video analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const handleBase64Upload = async (base64Data: string) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/video/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          videoData: base64Data,
          prompt: prompt || undefined,
          conversationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Video analysis failed");
      }

      const result = await response.json();
      setAnalysis(result);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

      toast({
        title: "Video Analyzed",
        description: "Your video has been analyzed successfully",
      });
    } catch (error: any) {
      console.error("Video analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze video",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Analysis
          </CardTitle>
          <CardDescription>
            Upload a video to analyze its content using AI vision models
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="video-file">Video File</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={isUploading || isAnalyzing}
              />
              <Button
                onClick={handleUpload}
                disabled={!fileInputRef.current?.files?.[0] || isUploading || isAnalyzing}
                className="gap-2"
              >
                {isUploading || isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isUploading ? "Uploading..." : "Analyzing..."}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload & Analyze
                  </>
                )}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="analysis-prompt">Analysis Prompt (Optional)</Label>
            <Textarea
              id="analysis-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to know about the video..."
              rows={3}
              disabled={isAnalyzing}
            />
          </div>

          {videoPreview && (
            <div>
              <Label>Preview</Label>
              <video
                src={videoPreview}
                controls
                className="w-full max-w-md rounded-md mt-2"
              />
            </div>
          )}

          {analysis && (
            <div className="space-y-2 pt-4 border-t">
              <div>
                <Label className="text-sm font-semibold">Analysis</Label>
                <p className="text-sm text-muted-foreground mt-1">{analysis.description}</p>
              </div>

              {analysis.transcription && (
                <div>
                  <Label className="text-sm font-semibold">Transcription</Label>
                  <p className="text-sm text-muted-foreground mt-1">{analysis.transcription}</p>
                </div>
              )}

              {analysis.metadata && (
                <div>
                  <Label className="text-sm font-semibold">Metadata</Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {analysis.metadata.duration && <p>Duration: {analysis.metadata.duration}s</p>}
                    {analysis.metadata.resolution && <p>Resolution: {analysis.metadata.resolution}</p>}
                    {analysis.metadata.format && <p>Format: {analysis.metadata.format}</p>}
                  </div>
                </div>
              )}

              {analysis.videoUrl && (
                <div>
                  <Label className="text-sm font-semibold">Video</Label>
                  <video
                    src={analysis.videoUrl}
                    controls
                    className="w-full max-w-md rounded-md mt-2"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

