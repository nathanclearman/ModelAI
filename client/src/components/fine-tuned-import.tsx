import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { Info, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { createModel } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function FineTunedImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    modelId: "",
    name: "",
    description: "",
    systemPrompt: "",
  });
  const [validationError, setValidationError] = useState("");

  const validateModelId = (modelId: string): boolean => {
    if (!modelId.trim()) {
      setValidationError("Model ID is required");
      return false;
    }

    // Check for fine-tuned model format: ft:<base-model>:<organization>:<suffix>:<job-id>
    // More permissive pattern to allow underscores, dots, and other common characters
    const fineTunedPattern = /^ft:[^:]+:[^:]+:([^:]*:)?[^:]+$/;
    
    if (!fineTunedPattern.test(modelId)) {
      setValidationError(
        "Invalid fine-tuned model ID format. Expected format: ft:base-model:organization:suffix:job-id (or ft:base-model:organization::job-id)"
      );
      return false;
    }

    setValidationError("");
    return true;
  };

  const importModelMutation = useMutation({
    mutationFn: async () => {
      if (!validateModelId(formData.modelId)) {
        throw new Error("Invalid model ID");
      }

      return createModel({
        name: formData.name || `Fine-tuned: ${formData.modelId.split(":")[1]}`,
        description: formData.description || "Imported fine-tuned OpenAI model",
        systemPrompt: formData.systemPrompt || "You are a helpful AI assistant.",
        model: formData.modelId,
        temperature: 70,
        maxTokens: 1000,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({
        title: "Success",
        description: "Fine-tuned model imported successfully",
      });
      setFormData({
        modelId: "",
        name: "",
        description: "",
        systemPrompt: "",
      });
      setLocation(`/chat/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import fine-tuned model",
        variant: "destructive",
      });
    },
  });

  const handleModelIdChange = (value: string) => {
    setFormData({ ...formData, modelId: value });
    if (validationError) {
      validateModelId(value);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Import Fine-Tuned Model</CardTitle>
          </div>
          <CardDescription>
            Import your OpenAI fine-tuned model using its model ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-id">Fine-Tuned Model ID *</Label>
            <Input
              id="model-id"
              placeholder="ft:gpt-3.5-turbo-0125:personal::abc123xyz"
              value={formData.modelId}
              onChange={(e) => handleModelIdChange(e.target.value)}
              data-testid="input-model-id"
              className={validationError ? "border-destructive" : ""}
            />
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter the complete model ID from your OpenAI fine-tuning job
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="import-name">Model Name (Optional)</Label>
            <Input
              id="import-name"
              placeholder="My Custom Model"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              data-testid="input-import-name"
            />
            <p className="text-xs text-muted-foreground">
              Give your model a friendly name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="import-description">Description (Optional)</Label>
            <Textarea
              id="import-description"
              placeholder="Describe what this model does..."
              className="min-h-20 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              data-testid="textarea-import-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="import-prompt">System Prompt (Optional)</Label>
            <Textarea
              id="import-prompt"
              placeholder="You are a helpful AI assistant..."
              className="min-h-24 resize-none"
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              data-testid="textarea-import-prompt"
            />
            <p className="text-xs text-muted-foreground">
              Define how the model should behave
            </p>
          </div>

          <Button
            onClick={() => importModelMutation.mutate()}
            disabled={!formData.modelId || importModelMutation.isPending}
            className="w-full"
            data-testid="button-import-model"
          >
            {importModelMutation.isPending ? "Importing..." : "Import Model"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Guide</CardTitle>
          <CardDescription>
            How to find and use your fine-tuned model ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Fine-tuned models must be created in your OpenAI account before importing them here.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Model ID Format</h4>
              <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
                ft:base-model:organization:suffix:job-id
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Example: <code className="bg-muted px-1 py-0.5 rounded">ft:gpt-3.5-turbo-0125:personal::abc123xyz</code>
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Finding Your Model ID</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to OpenAI's fine-tuning dashboard</li>
                <li>Select your completed fine-tuning job</li>
                <li>Copy the "Fine-tuned model" ID</li>
                <li>Paste it in the field above</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Supported Base Models</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• GPT-4o and GPT-4o Mini</li>
                <li>• GPT-3.5 Turbo variants</li>
                <li>• GPT-4 (all versions)</li>
                <li>• Davinci and Babbage models</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">After Import</h4>
              <p className="text-sm text-muted-foreground">
                Once imported, you can use your fine-tuned model just like any other model in the platform. 
                Configure its system prompt and parameters, then start chatting!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
