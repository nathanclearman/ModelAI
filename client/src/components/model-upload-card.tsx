import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileUp, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function ModelUploadCard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState("");
  const [modelDescription, setModelDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    console.log("File selected:", file.name);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = () => {
    if (!selectedFile || !modelName) {
      console.log("Please provide file and model name");
      return;
    }
    
    console.log("Uploading model:", {
      file: selectedFile.name,
      name: modelName,
      description: modelDescription,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Trained Model</CardTitle>
        <CardDescription>
          Import your pre-trained AI model files (.bin, .safetensors, .gguf, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="model-name-upload">Model Name</Label>
          <Input
            id="model-name-upload"
            placeholder="e.g., Custom GPT Finance Model"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            data-testid="input-upload-model-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model-description-upload">Description (Optional)</Label>
          <Textarea
            id="model-description-upload"
            placeholder="Describe your model's purpose and capabilities..."
            value={modelDescription}
            onChange={(e) => setModelDescription(e.target.value)}
            className="resize-none min-h-20"
            data-testid="textarea-upload-description"
          />
        </div>

        <div className="space-y-2">
          <Label>Model File</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            data-testid="dropzone-model-file"
          >
            {selectedFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <FileUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium" data-testid="text-selected-file">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                  data-testid="button-remove-file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-2">
                  Drop your model file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Supported formats: .bin, .safetensors, .gguf, .pt, .pth
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".bin,.safetensors,.gguf,.pt,.pth";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleFileSelect(file);
                    };
                    input.click();
                  }}
                  data-testid="button-browse-file"
                >
                  Browse Files
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Maximum file size: 5GB
          </p>
        </div>

        <div className="space-y-2">
          <Label>Model Format</Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">.bin</Badge>
            <Badge variant="outline">.safetensors</Badge>
            <Badge variant="outline">.gguf</Badge>
            <Badge variant="outline">.pt</Badge>
            <Badge variant="outline">.pth</Badge>
          </div>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !modelName}
          className="w-full"
          size="lg"
          data-testid="button-upload-model"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Model
        </Button>
      </CardContent>
    </Card>
  );
}
