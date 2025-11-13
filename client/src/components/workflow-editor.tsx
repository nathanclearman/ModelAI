import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, MoveUp, MoveDown, Save } from "lucide-react";

type StepType = "ai_chat" | "ai_image_generation" | "delay" | "webhook";

type WorkflowStep = {
  id: string;
  type: StepType;
  config: Record<string, any>;
};

type Workflow = {
  id?: string;
  name: string;
  description: string;
  triggerType: "manual" | "scheduled" | "webhook";
  triggerSchedule: string | null;
  enabled: boolean;
  steps: WorkflowStep[];
};

type AIModel = {
  id: string;
  name: string;
  model: string;
};

export function WorkflowEditor({ workflow, onClose }: { workflow: Workflow | null; onClose: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Workflow>({
    name: workflow?.name || "",
    description: workflow?.description || "",
    triggerType: workflow?.triggerType || "manual",
    triggerSchedule: workflow?.triggerSchedule || null,
    enabled: workflow?.enabled ?? true,
    steps: workflow?.steps || [],
  });

  const { data: models = [] } = useQuery<AIModel[]>({
    queryKey: ["/api/models"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Workflow) => {
      if (workflow?.id) {
        return await apiRequest("PATCH", `/api/workflows/${workflow.id}`, data);
      } else {
        return await apiRequest("POST", "/api/workflows", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: workflow?.id ? "Workflow updated" : "Workflow created",
        description: "Your workflow has been saved successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save workflow",
        variant: "destructive",
      });
    },
  });

  const addStep = (type: StepType) => {
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      type,
      config: getDefaultConfig(type),
    };
    setFormData({ ...formData, steps: [...formData.steps, newStep] });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newSteps = [...formData.steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newSteps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      setFormData({ ...formData, steps: newSteps });
    }
  };

  const updateStepConfig = (index: number, config: Record<string, any>) => {
    const newSteps = [...formData.steps];
    newSteps[index].config = { ...newSteps[index].config, ...config };
    setFormData({ ...formData, steps: newSteps });
  };

  const getDefaultConfig = (type: StepType): Record<string, any> => {
    switch (type) {
      case "ai_chat":
        return { modelId: "", prompt: "" };
      case "ai_image_generation":
        return { prompt: "" };
      case "delay":
        return { seconds: 5 };
      case "webhook":
        return { url: "", method: "POST", body: {} };
      default:
        return {};
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation error",
        description: "Please provide a workflow name",
        variant: "destructive",
      });
      return;
    }

    if (formData.steps.length === 0) {
      toast({
        title: "Validation error",
        description: "Please add at least one step",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  const getStepIcon = (type: StepType) => {
    switch (type) {
      case "ai_chat":
        return "💬";
      case "ai_image_generation":
        return "🎨";
      case "delay":
        return "⏱️";
      case "webhook":
        return "🔗";
      default:
        return "📝";
    }
  };

  const getStepTitle = (type: StepType) => {
    switch (type) {
      case "ai_chat":
        return "AI Chat";
      case "ai_image_generation":
        return "Image Generation";
      case "delay":
        return "Delay";
      case "webhook":
        return "Webhook";
      default:
        return type;
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose} data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            {workflow?.id ? "Edit Workflow" : "Create Workflow"}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Configure your workflow's basic settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Awesome Workflow"
                data-testid="input-workflow-name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this workflow does..."
                rows={3}
                data-testid="input-workflow-description"
              />
            </div>

            <div>
              <Label htmlFor="trigger">Trigger Type</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(value: any) => setFormData({ ...formData, triggerType: value })}
              >
                <SelectTrigger id="trigger" data-testid="select-trigger-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled">Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this workflow
                </p>
              </div>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                data-testid="switch-enabled"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Workflow Steps</CardTitle>
                <CardDescription>Add and configure the steps in your workflow</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select onValueChange={(type: StepType) => addStep(type)}>
                  <SelectTrigger className="w-[180px]" data-testid="select-add-step">
                    <SelectValue placeholder="Add step..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai_chat">AI Chat</SelectItem>
                    <SelectItem value="ai_image_generation">Image Generation</SelectItem>
                    <SelectItem value="delay">Delay</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.steps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No steps added yet. Click "Add step..." to get started.
              </div>
            ) : (
              formData.steps.map((step, index) => (
                <Card key={step.id} data-testid={`card-step-${index}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getStepIcon(step.type)}</span>
                        <div>
                          <CardTitle className="text-lg">
                            Step {index + 1}: {getStepTitle(step.type)}
                          </CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {step.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => moveStep(index, "up")}
                          disabled={index === 0}
                          data-testid={`button-move-up-${index}`}
                        >
                          <MoveUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => moveStep(index, "down")}
                          disabled={index === formData.steps.length - 1}
                          data-testid={`button-move-down-${index}`}
                        >
                          <MoveDown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeStep(index)}
                          data-testid={`button-remove-step-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {step.type === "ai_chat" && (
                      <>
                        <div>
                          <Label>AI Model</Label>
                          <Select
                            value={step.config.modelId}
                            onValueChange={(value) => updateStepConfig(index, { modelId: value })}
                          >
                            <SelectTrigger data-testid={`select-model-${index}`}>
                              <SelectValue placeholder="Select a model..." />
                            </SelectTrigger>
                            <SelectContent>
                              {models.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Prompt</Label>
                          <Textarea
                            value={step.config.prompt}
                            onChange={(e) => updateStepConfig(index, { prompt: e.target.value })}
                            placeholder="Enter your prompt... Use {{variable}} for context"
                            rows={4}
                            data-testid={`input-prompt-${index}`}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Use &#123;&#123;step_1_result.response&#125;&#125; to reference previous steps
                          </p>
                        </div>
                      </>
                    )}

                    {step.type === "ai_image_generation" && (
                      <div>
                        <Label>Prompt</Label>
                        <Textarea
                          value={step.config.prompt}
                          onChange={(e) => updateStepConfig(index, { prompt: e.target.value })}
                          placeholder="Describe the image to generate..."
                          rows={3}
                          data-testid={`input-prompt-${index}`}
                        />
                      </div>
                    )}

                    {step.type === "delay" && (
                      <div>
                        <Label>Delay (seconds)</Label>
                        <Input
                          type="number"
                          value={step.config.seconds}
                          onChange={(e) => updateStepConfig(index, { seconds: parseInt(e.target.value) || 0 })}
                          min={1}
                          data-testid={`input-delay-${index}`}
                        />
                      </div>
                    )}

                    {step.type === "webhook" && (
                      <>
                        <div>
                          <Label>URL</Label>
                          <Input
                            value={step.config.url}
                            onChange={(e) => updateStepConfig(index, { url: e.target.value })}
                            placeholder="https://api.example.com/webhook"
                            data-testid={`input-url-${index}`}
                          />
                        </div>
                        <div>
                          <Label>Method</Label>
                          <Select
                            value={step.config.method}
                            onValueChange={(value) => updateStepConfig(index, { method: value })}
                          >
                            <SelectTrigger data-testid={`select-method-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GET">GET</SelectItem>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="PATCH">PATCH</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save">
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Workflow"}
          </Button>
        </div>
      </div>
    </div>
  );
}
