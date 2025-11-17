import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Workflow, Plus, Play, Trash2 } from "lucide-react";
import { runWorkflow } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { AIModel } from "@shared/schema";

interface WorkflowBuilderProps {
  models?: AIModel[];
}

export function WorkflowBuilder({ models = [] }: WorkflowBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [workflowName, setWorkflowName] = useState("");
  const { toast } = useToast();

  const addStep = (type: string) => {
    const newStep = {
      id: crypto.randomUUID(),
      type,
      modelId: type === "ai_chat" ? models[0]?.id : undefined,
      prompt: "",
      nextStepId: null,
    };
    setWorkflowSteps([...workflowSteps, newStep]);
  };

  const removeStep = (stepId: string) => {
    setWorkflowSteps(workflowSteps.filter(s => s.id !== stepId));
  };

  const updateStep = (stepId: string, updates: any) => {
    setWorkflowSteps(workflowSteps.map(s => s.id === stepId ? { ...s, ...updates } : s));
  };

  const handleRunWorkflow = async () => {
    if (workflowSteps.length === 0) {
      toast({
        title: "Error",
        description: "Add at least one step to the workflow",
        variant: "destructive",
      });
      return;
    }

    try {
      // For now, just show a message - full workflow execution would need backend integration
      toast({
        title: "Workflow Builder",
        description: "Workflow execution requires backend workflow creation. This is a UI preview.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to run workflow",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
          <Workflow className="h-3 w-3 mr-1" />
          Workflows
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Multi-Model Workflow Builder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Workflow Name</Label>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="My Workflow"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Workflow Steps</Label>
              <div className="flex gap-2">
                <Select onValueChange={addStep}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Add Step" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai_chat">AI Chat</SelectItem>
                    <SelectItem value="condition">Condition</SelectItem>
                    <SelectItem value="parallel">Parallel</SelectItem>
                    <SelectItem value="delay">Delay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {workflowSteps.map((step, index) => (
                <Card key={step.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        Step {index + 1}: {step.type}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(step.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {step.type === "ai_chat" && (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Model</Label>
                        <Select
                          value={step.modelId || ""}
                          onValueChange={(value) => updateStep(step.id, { modelId: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
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
                        <Label className="text-xs">Prompt</Label>
                        <Input
                          value={step.prompt || ""}
                          onChange={(e) => updateStep(step.id, { prompt: e.target.value })}
                          placeholder="Enter prompt..."
                          className="h-8"
                        />
                      </div>
                    </div>
                  )}

                  {step.type === "delay" && (
                    <div>
                      <Label className="text-xs">Delay (ms)</Label>
                      <Input
                        type="number"
                        value={step.delayMs || 1000}
                        onChange={(e) => updateStep(step.id, { delayMs: parseInt(e.target.value) })}
                        className="h-8"
                      />
                    </div>
                  )}
                </Card>
              ))}

              {workflowSteps.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Add steps to build your multi-model workflow
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleRunWorkflow} disabled={workflowSteps.length === 0}>
              <Play className="h-4 w-4 mr-2" />
              Run Workflow
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

