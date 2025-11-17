import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Plus, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  History, 
  Calendar, 
  AlertCircle,
  Sparkles,
  TrendingUp,
  Activity,
  MoreVertical,
  Image as ImageIcon
} from "lucide-react";
import { useState } from "react";
import { WorkflowEditor } from "@/components/workflow-editor";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Workflow = {
  id: string;
  name: string;
  description: string;
  triggerType: "manual" | "scheduled" | "webhook";
  triggerSchedule: string | null;
  enabled: boolean;
  steps: any[];
  createdAt: string;
  updatedAt: string;
};

type WorkflowRun = {
  id: string;
  workflowId: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  input?: any;
  output?: any;
};

export default function WorkflowsPage() {
  const { toast } = useToast();
  const [showEditor, setShowEditor] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null);
  const [viewRunsWorkflowId, setViewRunsWorkflowId] = useState<string | null>(null);

  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const { data: workflowRuns = [], isLoading: isLoadingRuns } = useQuery<WorkflowRun[]>({
    queryKey: viewRunsWorkflowId ? ["/api/workflows", viewRunsWorkflowId, "runs"] : ["/api/workflows", "runs"],
    enabled: !!viewRunsWorkflowId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow deleted",
        description: "The workflow has been deleted successfully.",
      });
      setDeleteWorkflowId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete workflow",
        variant: "destructive",
      });
    },
  });

  const executeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/workflows/${id}/execute`, { input: {} });
      return await response.json();
    },
    onSuccess: (data: any) => {
      if (data.status === "failed") {
        toast({
          title: "Workflow execution failed",
          description: data.error || `Run ID: ${data.id} - Status: ${data.status}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Workflow executed",
          description: `Run ID: ${data.id} - Status: ${data.status}`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      if (viewRunsWorkflowId === data.workflowId) {
        queryClient.invalidateQueries({ queryKey: ["/api/workflows", data.workflowId, "runs"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Execution failed",
        description: error.message || "Failed to execute workflow",
        variant: "destructive",
      });
    },
  });

  const handleCreateWorkflow = () => {
    setEditingWorkflow(null);
    setShowEditor(true);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingWorkflow(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "running":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "manual":
        return <Play className="w-4 h-4" />;
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      case "webhook":
        return <Zap className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const enabledWorkflows = workflows.filter(w => w.enabled).length;
  const totalRuns = workflowRuns.length;
  const successfulRuns = workflowRuns.filter(r => r.status === "completed").length;

  if (showEditor) {
    return <WorkflowEditor workflow={editingWorkflow} onClose={handleCloseEditor} />;
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/60">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Workflow Automation
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Chain AI tasks together to automate complex workflows with Stability AI image generation
            </p>
          </div>
          <Button 
            onClick={handleCreateWorkflow} 
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-11 px-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Workflow
          </Button>
        </div>

        {/* Stats */}
        {workflows.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardDescription>Total Workflows</CardDescription>
                <CardTitle className="text-3xl">{workflows.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="w-4 h-4" />
                  <span>{enabledWorkflows} enabled</span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardDescription>Total Steps</CardDescription>
                <CardTitle className="text-3xl">
                  {workflows.reduce((sum, w) => sum + (w.steps?.length || 0), 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  <span>Across all workflows</span>
                </div>
              </CardContent>
            </Card>
            {viewRunsWorkflowId && (
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardDescription>Success Rate</CardDescription>
                  <CardTitle className="text-3xl">
                    {totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0}%
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>{successfulRuns} of {totalRuns} runs</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Workflows List */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-2">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-16">
              <div className="p-4 rounded-full bg-primary/10 mb-6">
                <Zap className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No workflows yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Create your first workflow to automate AI tasks and chain them together for powerful automation
              </p>
              <Button 
                onClick={handleCreateWorkflow} 
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <Card 
                key={workflow.id} 
                className={`border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${
                  workflow.enabled ? "border-primary/20" : "border-muted"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{workflow.name}</CardTitle>
                        <Badge
                          variant={workflow.enabled ? "default" : "secondary"}
                          className={workflow.enabled ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                        >
                          {workflow.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {workflow.description || "No description"}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditWorkflow(workflow)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewRunsWorkflowId(workflow.id)}>
                          <History className="w-4 h-4 mr-2" />
                          View Runs
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteWorkflowId(workflow.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {getTriggerIcon(workflow.triggerType)}
                      <span className="capitalize">{workflow.triggerType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="w-4 h-4" />
                      <span>{workflow.steps?.length || 0} steps</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => executeMutation.mutate(workflow.id)}
                      disabled={!workflow.enabled || executeMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Run Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewRunsWorkflowId(workflow.id)}
                    >
                      <History className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteWorkflowId} onOpenChange={() => setDeleteWorkflowId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone and will also delete all associated run history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWorkflowId && deleteMutation.mutate(deleteWorkflowId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Run History Dialog */}
      <Dialog open={!!viewRunsWorkflowId} onOpenChange={() => setViewRunsWorkflowId(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Workflow Run History
            </DialogTitle>
            <DialogDescription>
              View past executions and their results for this workflow
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="runs" className="w-full">
            <TabsList>
              <TabsTrigger value="runs">Runs</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>
            <TabsContent value="runs" className="mt-4">
              <ScrollArea className="h-[60vh] pr-4">
                {isLoadingRuns ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : workflowRuns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <History className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No runs yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Execute this workflow to see run history
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workflowRuns.map((run) => (
                      <Card key={run.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge
                                  variant="outline"
                                  className={getStatusColor(run.status)}
                                >
                                  {run.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                                  {run.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                                  {run.status === "running" && <Clock className="w-3 h-3 mr-1 animate-spin" />}
                                  {run.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground font-mono">
                                  {run.id.slice(0, 8)}...
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(run.startedAt).toLocaleString()}
                                </div>
                                {run.completedAt && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {Math.round(
                                      (new Date(run.completedAt).getTime() -
                                        new Date(run.startedAt).getTime()) /
                                        1000
                                    )}s
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Accordion type="single" collapsible className="w-full">
                            {run.error && (
                              <AccordionItem value="error">
                                <AccordionTrigger className="text-destructive hover:text-destructive">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Error Details
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="bg-destructive/10 p-4 rounded-md text-sm border border-destructive/20">
                                    <pre className="whitespace-pre-wrap">{run.error}</pre>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )}
                            {run.output && Object.keys(run.output).length > 0 && (
                              <AccordionItem value="output">
                                <AccordionTrigger>Output & Results</AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-4">
                                    {Object.entries(run.output).map(([key, value]: [string, any]) => {
                                      // Debug: Log image data
                                      if (value?.imageUrl || value?.imageGenerated) {
                                        console.log(`[Workflow] Image data for ${key}:`, {
                                          imageUrl: value?.imageUrl,
                                          imageGenerated: value?.imageGenerated,
                                          prompt: value?.prompt,
                                        });
                                      }
                                      return (
                                      <div key={key} className="space-y-2">
                                        <h4 className="text-sm font-semibold text-muted-foreground capitalize">
                                          {key.replace(/_/g, ' ')}
                                        </h4>
                                        
                                        {value?.response && typeof value.response === 'string' && (
                                          <div className="bg-muted/50 p-4 rounded-lg border">
                                            <p className="text-sm whitespace-pre-wrap">{value.response}</p>
                                            {value.tokens && (
                                              <p className="text-xs text-muted-foreground mt-2">
                                                Tokens used: {value.tokens}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                        
                                        {(value?.imageGenerated || value?.imageUrl) && (
                                          <div className="space-y-3">
                                            {value?.imageUrl ? (
                                              <div className="relative group">
                                                <img 
                                                  src={value.imageUrl} 
                                                  alt={value.prompt || 'Generated image'}
                                                  className="max-w-full h-auto rounded-lg border-2 shadow-lg bg-muted/20"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    console.error("[Workflow] Image load error:", {
                                                      src: target.src,
                                                      imageUrl: value.imageUrl,
                                                      error: e,
                                                    });
                                                    target.style.display = 'none';
                                                    const errorDiv = target.nextElementSibling as HTMLElement;
                                                    if (errorDiv) {
                                                      errorDiv.style.display = 'block';
                                                    }
                                                  }}
                                                  onLoad={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    console.log("[Workflow] Image loaded successfully:", target.src);
                                                    target.style.display = 'block';
                                                    const errorDiv = target.nextElementSibling as HTMLElement;
                                                    if (errorDiv) {
                                                      errorDiv.style.display = 'none';
                                                    }
                                                  }}
                                                />
                                                <div 
                                                  className="hidden bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive"
                                                >
                                                  <p className="font-semibold mb-1">Failed to load image</p>
                                                  <p className="text-xs break-all">{value.imageUrl}</p>
                                                </div>
                                                <a
                                                  href={value.imageUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-2 rounded-lg border shadow-sm hover:bg-background"
                                                  title="Open image in new tab"
                                                >
                                                  <ImageIcon className="w-4 h-4" />
                                                </a>
                                              </div>
                                            ) : (
                                              <div className="bg-muted/50 border-2 border-dashed rounded-lg p-8 text-center">
                                                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                                                <p className="text-sm text-muted-foreground">Image generated but URL not available</p>
                                              </div>
                                            )}
                                            {value.prompt && (
                                              <div className="bg-muted/50 p-3 rounded-lg border">
                                                <p className="text-xs font-semibold text-muted-foreground mb-1">Prompt:</p>
                                                <p className="text-sm">{value.prompt}</p>
                                                {value.negativePrompt && (
                                                  <>
                                                    <p className="text-xs font-semibold text-muted-foreground mt-2 mb-1">Negative Prompt:</p>
                                                    <p className="text-sm text-muted-foreground">{value.negativePrompt}</p>
                                                  </>
                                                )}
                                                {(value.width && value.height) && (
                                                  <p className="text-xs text-muted-foreground mt-2">
                                                    Size: {value.width}×{value.height}px
                                                  </p>
                                                )}
                                                {value.imageUrl && (
                                                  <a
                                                    href={value.imageUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline mt-2 inline-block"
                                                  >
                                                    Open image URL →
                                                  </a>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        {value?.imageGenerated === false && value?.error && (
                                          <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                                            <p className="text-sm text-destructive font-semibold mb-1">
                                              Image generation failed
                                            </p>
                                            <p className="text-sm">{value.error}</p>
                                          </div>
                                        )}
                                        
                                        {value?.delayed !== undefined && (
                                          <div className="bg-muted/50 p-3 rounded-lg">
                                            <p className="text-sm">
                                              ⏱️ Delayed for {value.delayed} seconds
                                            </p>
                                          </div>
                                        )}
                                        
                                        {value?.status !== undefined && value?.body && (
                                          <div className="bg-muted/50 p-3 rounded-lg border">
                                            <p className="text-xs text-muted-foreground mb-1">
                                              Status: {value.status}
                                            </p>
                                            <pre className="text-xs overflow-auto">
                                              {typeof value.body === 'string' ? value.body : JSON.stringify(value.body, null, 2)}
                                            </pre>
                                          </div>
                                        )}
                                        
                                        {!value?.response && 
                                         value?.imageGenerated === undefined && 
                                         value?.delayed === undefined && 
                                         value?.status === undefined && (
                                          <pre className="bg-muted/50 p-3 rounded-md text-xs overflow-auto border">
                                            {JSON.stringify(value, null, 2)}
                                          </pre>
                                        )}
                                      </div>
                                    );
                                    })}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )}
                          </Accordion>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="stats" className="mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardDescription>Total Runs</CardDescription>
                    <CardTitle className="text-2xl">{totalRuns}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Successful</CardDescription>
                    <CardTitle className="text-2xl text-green-500">{successfulRuns}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Failed</CardDescription>
                    <CardTitle className="text-2xl text-red-500">
                      {totalRuns - successfulRuns}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
