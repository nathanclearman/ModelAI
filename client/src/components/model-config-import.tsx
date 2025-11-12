import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { Info, Upload, FileJson, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { createModel } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { ExportedModel } from "@/lib/export";

export function ModelConfigImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedModels, setParsedModels] = useState<ExportedModel[]>([]);
  const [parseError, setParseError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setParseError("");
    setParsedModels([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Handle both single model and array of models
        const models = Array.isArray(parsed) ? parsed : [parsed];
        
        // Validate structure
        for (const model of models) {
          if (!model.name || !model.systemPrompt || !model.model) {
            throw new Error("Invalid model configuration format");
          }
        }
        
        setParsedModels(models);
      } catch (error) {
        setParseError(error instanceof Error ? error.message : "Failed to parse JSON file");
        setParsedModels([]);
      }
    };
    reader.readAsText(file);
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

  const importModelsMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const model of parsedModels) {
        const result = await createModel({
          name: model.name,
          description: model.description || "",
          systemPrompt: model.systemPrompt,
          model: model.model,
          temperature: model.temperature,
          maxTokens: model.maxTokens,
          template: model.template || undefined,
        });
        results.push(result);
      }
      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({
        title: "Success",
        description: `Imported ${data.length} model${data.length > 1 ? "s" : ""} successfully`,
      });
      setSelectedFile(null);
      setParsedModels([]);
      
      if (data.length === 1) {
        setLocation(`/chat/${data[0].id}`);
      } else {
        setLocation("/models");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import models",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            <CardTitle>Import Model Configuration</CardTitle>
          </div>
          <CardDescription>
            Import model configurations from JSON export files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Configuration File</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              data-testid="dropzone-config-file"
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <FileJson className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium" data-testid="text-selected-file">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedFile(null);
                        setParsedModels([]);
                        setParseError("");
                      }}
                      data-testid="button-remove-file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {parseError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{parseError}</AlertDescription>
                    </Alert>
                  ) : parsedModels.length > 0 ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Found {parsedModels.length} model{parsedModels.length > 1 ? "s" : ""} to import
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-2">
                    Drop your JSON file here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Supports exported model configuration files (.json)
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                    id="json-file-input"
                    data-testid="input-file"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("json-file-input")?.click()}
                    data-testid="button-browse"
                  >
                    Browse Files
                  </Button>
                </div>
              )}
            </div>
          </div>

          {parsedModels.length > 0 && (
            <div className="space-y-2">
              <Label>Models to Import</Label>
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {parsedModels.map((model, index) => (
                  <div key={index} className="p-3">
                    <p className="font-medium text-sm" data-testid={`text-model-name-${index}`}>
                      {model.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {model.model} • Temp: {model.temperature / 100}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => importModelsMutation.mutate()}
            disabled={parsedModels.length === 0 || importModelsMutation.isPending}
            className="w-full"
            data-testid="button-import-models"
          >
            {importModelsMutation.isPending 
              ? "Importing..." 
              : `Import ${parsedModels.length} Model${parsedModels.length > 1 ? "s" : ""}`
            }
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Guide</CardTitle>
          <CardDescription>
            How to import model configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Only import JSON files exported from this platform using the model export feature.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Supported Files</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Single model exports (model-name-date.json)</li>
                <li>• Bulk model exports (models-export-date.json)</li>
                <li>• Files must be in JSON format</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">What Gets Imported</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Model name and description</li>
                <li>• System prompt and instructions</li>
                <li>• Model type (e.g., gpt-4o)</li>
                <li>• Temperature and token settings</li>
                <li>• Template information (if applicable)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Important Notes</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Original model IDs will not be preserved</li>
                <li>• New models will be created with unique IDs</li>
                <li>• Conversation history is not included</li>
                <li>• Fine-tuned model IDs must still be valid in your OpenAI account</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">After Import</h4>
              <p className="text-sm text-muted-foreground">
                Imported models will appear in your Models page and can be used immediately. 
                If importing a single model, you'll be taken directly to the chat interface.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
