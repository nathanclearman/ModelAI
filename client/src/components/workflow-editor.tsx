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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Save, 
  MessageSquare, 
  Image as ImageIcon, 
  Clock, 
  Webhook,
  Sparkles,
  Settings,
  Play,
  Info
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

type WebhookConfiguration = {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string> | null;
  bodyTemplate: any;
  authType: string | null;
  authConfig: any;
};

export function WorkflowEditor({ workflow, onClose }: { workflow: Workflow | null; onClose: () => void }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"info" | "steps">("info");
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

  const { data: webhooks = [] } = useQuery<WebhookConfiguration[]>({
    queryKey: ["/api/webhooks"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Workflow) => {
      if (workflow?.id) {
        const response = await apiRequest("PATCH", `/api/workflows/${workflow.id}`, data);
        return await response.json();
      } else {
        const response = await apiRequest("POST", "/api/workflows", data);
        return await response.json();
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
    setActiveTab("steps");
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
        return { modelId: models[0]?.id || "", prompt: "" };
      case "ai_image_generation":
        return { 
          prompt: "",
          negativePrompt: "",
          width: 1024,
          height: 1024,
          cfgScale: 7,
          steps: 30,
        };
      case "delay":
        return { seconds: 5 };
      case "webhook":
        return { 
          webhookConfigId: "",
          url: "", 
          method: "POST", 
          headers: {},
          body: {},
          authType: null,
          authConfig: null,
        };
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
        return <MessageSquare className="w-5 h-5" />;
      case "ai_image_generation":
        return <ImageIcon className="w-5 h-5" />;
      case "delay":
        return <Clock className="w-5 h-5" />;
      case "webhook":
        return <Webhook className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
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

  const getStepColor = (type: StepType) => {
    switch (type) {
      case "ai_chat":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "ai_image_generation":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "delay":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "webhook":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {workflow?.id ? "Edit Workflow" : "Create Workflow"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Build powerful automation workflows with AI
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-gradient-to-r from-primary to-primary/80">
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Workflow"}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "info" | "steps")} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="steps" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Steps ({formData.steps.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/0">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Basic Information
                </CardTitle>
                <CardDescription>Configure your workflow's basic settings and metadata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-semibold">Workflow Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Awesome Workflow"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this workflow does and when to use it..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="trigger" className="text-base font-semibold">Trigger Type</Label>
                  <Select
                    value={formData.triggerType}
                    onValueChange={(value: any) => setFormData({ ...formData, triggerType: value })}
                  >
                    <SelectTrigger id="trigger" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          Manual - Run on demand
                        </div>
                      </SelectItem>
                      <SelectItem value="scheduled">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Scheduled - Run automatically
                        </div>
                      </SelectItem>
                      <SelectItem value="webhook">
                        <div className="flex items-center gap-2">
                          <Webhook className="w-4 h-4" />
                          Webhook - Triggered by external events
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div className="space-y-0.5">
                    <Label htmlFor="enabled" className="text-base font-semibold cursor-pointer">Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable this workflow to allow execution
                    </p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="steps" className="space-y-6">
            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Workflow Steps
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Add and configure steps to build your automation workflow
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select onValueChange={(type: StepType) => addStep(type)}>
                      <SelectTrigger className="w-[200px] h-10">
                        <SelectValue placeholder="Add step..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ai_chat">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            AI Chat
                          </div>
                        </SelectItem>
                        <SelectItem value="ai_image_generation">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Image Generation (Stability AI)
                          </div>
                        </SelectItem>
                        <SelectItem value="delay">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Delay
                          </div>
                        </SelectItem>
                        <SelectItem value="webhook">
                          <div className="flex items-center gap-2">
                            <Webhook className="w-4 h-4" />
                            Webhook
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {formData.steps.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No steps yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add your first step to start building your workflow
                    </p>
                    <Button onClick={() => addStep("ai_chat")} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Step
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.steps.map((step, index) => (
                      <Card key={step.id} className={`border-2 ${getStepColor(step.type)}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className={`p-2 rounded-lg ${getStepColor(step.type)}`}>
                                {getStepIcon(step.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <CardTitle className="text-lg">
                                    Step {index + 1}: {getStepTitle(step.type)}
                                  </CardTitle>
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {step.type}
                                  </Badge>
                                </div>
                                {index < formData.steps.length - 1 && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                    <div className="h-px w-8 bg-current" />
                                    <span>Next: Step {index + 2}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => moveStep(index, "up")}
                                disabled={index === 0}
                                className="h-8 w-8"
                              >
                                <MoveUp className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => moveStep(index, "down")}
                                disabled={index === formData.steps.length - 1}
                                className="h-8 w-8"
                              >
                                <MoveDown className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeStep(index)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                          {step.type === "ai_chat" && (
                            <>
                              <div className="space-y-2">
                                <Label>AI Model</Label>
                                <Select
                                  value={step.config.modelId}
                                  onValueChange={(value) => updateStepConfig(index, { modelId: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a model..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {models.map((model) => (
                                      <SelectItem key={model.id} value={model.id}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{model.name}</span>
                                          <Badge variant="secondary" className="ml-2 text-xs">
                                            {model.model}
                                          </Badge>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Prompt</Label>
                                <Textarea
                                  value={step.config.prompt}
                                  onChange={(e) => updateStepConfig(index, { prompt: e.target.value })}
                                  placeholder="Enter your prompt... Use {{variable}} for context from previous steps"
                                  rows={5}
                                  className="font-mono text-sm"
                                />
                                <Alert>
                                  <Info className="w-4 h-4" />
                                  <AlertDescription className="text-xs">
                                    Use <code className="px-1 py-0.5 bg-muted rounded">&#123;&#123;step_1_result.response&#125;&#125;</code> to reference previous step outputs
                                  </AlertDescription>
                                </Alert>
                              </div>
                            </>
                          )}

                          {step.type === "ai_image_generation" && (
                            <div className="space-y-4">
                              <Alert className="bg-purple-500/10 border-purple-500/20">
                                <ImageIcon className="w-4 h-4 text-purple-500" />
                                <AlertDescription className="text-sm">
                                  Using Stability AI's Stable Diffusion XL for high-quality image generation
                                </AlertDescription>
                              </Alert>
                              
                              <div className="space-y-2">
                                <Label>Prompt</Label>
                                <Textarea
                                  value={step.config.prompt}
                                  onChange={(e) => updateStepConfig(index, { prompt: e.target.value })}
                                  placeholder="Describe the image you want to generate in detail..."
                                  rows={4}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Negative Prompt (Optional)</Label>
                                <Textarea
                                  value={step.config.negativePrompt || ""}
                                  onChange={(e) => updateStepConfig(index, { negativePrompt: e.target.value })}
                                  placeholder="What to avoid in the image (e.g., blurry, low quality, distorted)"
                                  rows={3}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Width</Label>
                                  <Select
                                    value={String(step.config.width || 1024)}
                                    onValueChange={(value) => updateStepConfig(index, { width: parseInt(value) })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="512">512px</SelectItem>
                                      <SelectItem value="768">768px</SelectItem>
                                      <SelectItem value="1024">1024px</SelectItem>
                                      <SelectItem value="1280">1280px</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Height</Label>
                                  <Select
                                    value={String(step.config.height || 1024)}
                                    onValueChange={(value) => updateStepConfig(index, { height: parseInt(value) })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="512">512px</SelectItem>
                                      <SelectItem value="768">768px</SelectItem>
                                      <SelectItem value="1024">1024px</SelectItem>
                                      <SelectItem value="1280">1280px</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>CFG Scale: {step.config.cfgScale || 7}</Label>
                                  <Input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={step.config.cfgScale || 7}
                                    onChange={(e) => updateStepConfig(index, { cfgScale: parseInt(e.target.value) })}
                                    className="w-full"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Higher = more adherence to prompt (1-20)
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label>Steps: {step.config.steps || 30}</Label>
                                  <Input
                                    type="range"
                                    min="10"
                                    max="50"
                                    value={step.config.steps || 30}
                                    onChange={(e) => updateStepConfig(index, { steps: parseInt(e.target.value) })}
                                    className="w-full"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    More steps = higher quality (10-50)
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Seed (Optional)</Label>
                                <Input
                                  type="number"
                                  value={step.config.seed || ""}
                                  onChange={(e) => updateStepConfig(index, { seed: e.target.value ? parseInt(e.target.value) : undefined })}
                                  placeholder="Leave empty for random"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Use the same seed to generate similar images
                                </p>
                              </div>
                            </div>
                          )}

                          {step.type === "delay" && (
                            <div className="space-y-2">
                              <Label>Delay Duration (seconds)</Label>
                              <Input
                                type="number"
                                value={step.config.seconds}
                                onChange={(e) => updateStepConfig(index, { seconds: parseInt(e.target.value) || 0 })}
                                min={1}
                                max={3600}
                                className="max-w-xs"
                              />
                              <p className="text-xs text-muted-foreground">
                                Wait time before executing the next step (1-3600 seconds)
                              </p>
                            </div>
                          )}

                          {step.type === "webhook" && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Saved Webhook Configuration (Optional)</Label>
                                <Select
                                  value={step.config.webhookConfigId || ""}
                                  onValueChange={(value) => {
                                    if (value === "custom") {
                                      updateStepConfig(index, { 
                                        webhookConfigId: "",
                                        url: "",
                                        method: "POST",
                                        headers: {},
                                        body: {},
                                        authType: null,
                                        authConfig: null,
                                      });
                                    } else {
                                      const webhook = webhooks.find(w => w.id === value);
                                      if (webhook) {
                                        updateStepConfig(index, { 
                                          webhookConfigId: webhook.id,
                                          url: webhook.url,
                                          method: webhook.method,
                                          headers: webhook.headers || {},
                                          body: webhook.bodyTemplate || {},
                                          authType: webhook.authType,
                                          authConfig: null,
                                        });
                                      }
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select saved webhook or use custom..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="custom">Custom Configuration</SelectItem>
                                    {webhooks.map((webhook) => (
                                      <SelectItem key={webhook.id} value={webhook.id}>
                                        {webhook.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {!step.config.webhookConfigId && (
                                <>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>URL</Label>
                                      <Input
                                        value={step.config.url}
                                        onChange={(e) => updateStepConfig(index, { url: e.target.value })}
                                        placeholder="https://api.example.com/webhook"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>HTTP Method</Label>
                                      <Select
                                        value={step.config.method}
                                        onValueChange={(value) => updateStepConfig(index, { method: value })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="GET">GET</SelectItem>
                                          <SelectItem value="POST">POST</SelectItem>
                                          <SelectItem value="PUT">PUT</SelectItem>
                                          <SelectItem value="PATCH">PATCH</SelectItem>
                                          <SelectItem value="DELETE">DELETE</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Headers (JSON)</Label>
                                    <Textarea
                                      value={typeof step.config.headers === 'string' ? step.config.headers : JSON.stringify(step.config.headers || {}, null, 2)}
                                      onChange={(e) => {
                                        try {
                                          const parsed = JSON.parse(e.target.value);
                                          updateStepConfig(index, { headers: parsed });
                                        } catch {
                                          updateStepConfig(index, { headers: e.target.value });
                                        }
                                      }}
                                      placeholder='{"Content-Type": "application/json"}'
                                      className="font-mono text-sm"
                                      rows={3}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Body Template (JSON)</Label>
                                    <Textarea
                                      value={typeof step.config.body === 'string' ? step.config.body : JSON.stringify(step.config.body || {}, null, 2)}
                                      onChange={(e) => {
                                        try {
                                          const parsed = JSON.parse(e.target.value);
                                          updateStepConfig(index, { body: parsed });
                                        } catch {
                                          updateStepConfig(index, { body: e.target.value });
                                        }
                                      }}
                                      placeholder='{"message": "{{step_1_result.response}}"}'
                                      className="font-mono text-sm"
                                      rows={5}
                                    />
                                    <Alert>
                                      <Info className="w-4 h-4" />
                                      <AlertDescription className="text-xs">
                                        Use <code className="px-1 py-0.5 bg-muted rounded">&#123;&#123;step_X_result&#125;&#125;</code> to reference previous step outputs
                                      </AlertDescription>
                                    </Alert>
                                  </div>
                                </>
                              )}

                              {step.config.webhookConfigId && (
                                <div className="rounded-lg bg-muted/50 p-4 border">
                                  <div className="text-sm font-semibold mb-3">Configuration Preview</div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">Method:</span>
                                      <Badge variant="outline">{step.config.method}</Badge>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">URL:</span>
                                      <code className="ml-2 text-xs bg-background px-2 py-1 rounded border">
                                        {step.config.url}
                                      </code>
                                    </div>
                                    {step.config.authType && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Auth:</span>
                                        <Badge variant="secondary">{step.config.authType}</Badge>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-3">
                                    Using saved webhook configuration. Variables in body template will be replaced at runtime.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
