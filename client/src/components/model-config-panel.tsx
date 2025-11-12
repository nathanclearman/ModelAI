import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";

interface ModelConfigPanelProps {
  onSave?: (config: ModelConfig) => void;
  initialConfig?: Partial<ModelConfig>;
}

export interface ModelConfig {
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  isPublic?: number;
  category?: string;
  tags?: string[];
}

const modelOptions = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "gpt-5", label: "GPT-5" },
];

export function ModelConfigPanel({ onSave, initialConfig }: ModelConfigPanelProps) {
  const [config, setConfig] = useState<ModelConfig>({
    name: initialConfig?.name || "",
    model: initialConfig?.model || "gpt-4o",
    temperature: initialConfig?.temperature || 70,
    maxTokens: initialConfig?.maxTokens || 1000,
    systemPrompt: initialConfig?.systemPrompt || "",
    isPublic: initialConfig?.isPublic || 0,
    category: initialConfig?.category || "",
    tags: initialConfig?.tags || [],
  });
  const [tagInput, setTagInput] = useState("");

  const handleSave = () => {
    console.log("Saving config:", config);
    onSave?.(config);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Configuration</CardTitle>
        <CardDescription>
          Customize your AI model parameters and behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="model-name">Model Name</Label>
          <Input
            id="model-name"
            placeholder="e.g., Customer Support Assistant"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            data-testid="input-model-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model-select">AI Model</Label>
          {config.model.startsWith("ft:") ? (
            <div className="space-y-2">
              <Input
                id="model-select"
                value={config.model}
                disabled
                className="font-mono text-xs bg-muted"
                data-testid="input-custom-model"
              />
              <p className="text-xs text-muted-foreground">
                Fine-tuned model (custom model ID)
              </p>
            </div>
          ) : (
            <Select
              value={config.model}
              onValueChange={(value) => setConfig({ ...config, model: value })}
            >
              <SelectTrigger id="model-select" data-testid="select-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="temperature">Temperature</Label>
            <span className="text-sm text-muted-foreground">{config.temperature / 100}</span>
          </div>
          <Slider
            id="temperature"
            min={0}
            max={100}
            step={1}
            value={[config.temperature]}
            onValueChange={([value]) => setConfig({ ...config, temperature: value })}
            data-testid="slider-temperature"
          />
          <p className="text-xs text-muted-foreground">
            Higher values make output more creative, lower values more focused
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="max-tokens">Max Tokens</Label>
            <span className="text-sm text-muted-foreground">{config.maxTokens}</span>
          </div>
          <Slider
            id="max-tokens"
            min={100}
            max={4000}
            step={100}
            value={[config.maxTokens]}
            onValueChange={([value]) => setConfig({ ...config, maxTokens: value })}
            data-testid="slider-max-tokens"
          />
          <p className="text-xs text-muted-foreground">
            Maximum length of the response
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="system-prompt">System Prompt</Label>
          <Textarea
            id="system-prompt"
            placeholder="Define the AI's role and behavior..."
            className="min-h-32 resize-none"
            value={config.systemPrompt}
            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
            data-testid="textarea-system-prompt"
          />
          <p className="text-xs text-muted-foreground">
            Instructions that guide how the AI responds
          </p>
        </div>

        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-4">Marketplace Sharing</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="public-toggle">Share to Marketplace</Label>
                <p className="text-xs text-muted-foreground">
                  Make this model discoverable by others
                </p>
              </div>
              <Switch
                id="public-toggle"
                checked={config.isPublic === 1}
                onCheckedChange={(checked) => setConfig({ ...config, isPublic: checked ? 1 : 0 })}
                data-testid="switch-public"
              />
            </div>

            {config.isPublic === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={config.category || ""}
                    onValueChange={(value) => setConfig({ ...config, category: value })}
                  >
                    <SelectTrigger id="category" data-testid="select-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Customer Support">Customer Support</SelectItem>
                      <SelectItem value="Content Creation">Content Creation</SelectItem>
                      <SelectItem value="Data Analysis">Data Analysis</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && tagInput.trim()) {
                          e.preventDefault();
                          if (!config.tags?.includes(tagInput.trim())) {
                            setConfig({ 
                              ...config, 
                              tags: [...(config.tags || []), tagInput.trim()] 
                            });
                          }
                          setTagInput("");
                        }
                      }}
                      data-testid="input-tags"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (tagInput.trim() && !config.tags?.includes(tagInput.trim())) {
                          setConfig({ 
                            ...config, 
                            tags: [...(config.tags || []), tagInput.trim()] 
                          });
                          setTagInput("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {config.tags && config.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {config.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              setConfig({ 
                                ...config, 
                                tags: config.tags?.filter((_, i) => i !== index) 
                              });
                            }}
                            className="ml-1 hover-elevate"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Press Enter or click Add to add tags
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1" data-testid="button-save-config">
            Save Configuration
          </Button>
          <Button
            variant="outline"
            onClick={() => console.log("Reset config")}
            data-testid="button-reset-config"
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
