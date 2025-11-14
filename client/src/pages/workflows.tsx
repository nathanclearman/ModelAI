import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Plus, Play, Clock, CheckCircle, XCircle, Edit, Trash2, History, Calendar, AlertCircle } from "lucide-react";
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
    queryKey: ["/api/workflows", viewRunsWorkflowId, "runs"],
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
      toast({
        title: "Workflow executed",
        description: `Run ID: ${data.id} - Status: ${data.status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
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

  if (showEditor) {
    return <WorkflowEditor workflow={editingWorkflow} onClose={handleCloseEditor} />;
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="w-8 h-8 text-primary" />
              Workflow Automation
            </h1>
            <p className="text-muted-foreground mt-1">
              Chain AI tasks together to automate complex workflows
            </p>
          </div>
          <Button onClick={handleCreateWorkflow} data-testid="button-create-workflow">
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <Zap className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No workflows yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first workflow to automate AI tasks
              </p>
              <Button onClick={handleCreateWorkflow} data-testid="button-create-first-workflow">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <Card key={workflow.id} data-testid={`card-workflow-${workflow.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {workflow.name}
                        <Badge
                          variant={workflow.enabled ? "default" : "secondary"}
                          data-testid={`badge-status-${workflow.id}`}
                        >
                          {workflow.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {workflow.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="capitalize">{workflow.triggerType} trigger</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {workflow.steps?.length || 0} steps
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => executeMutation.mutate(workflow.id)}
                        disabled={!workflow.enabled || executeMutation.isPending}
                        data-testid={`button-execute-${workflow.id}`}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewRunsWorkflowId(workflow.id)}
                        data-testid={`button-view-runs-${workflow.id}`}
                      >
                        <History className="w-3 h-3 mr-1" />
                        Runs
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditWorkflow(workflow)}
                        data-testid={`button-edit-${workflow.id}`}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteWorkflowId(workflow.id)}
                        data-testid={`button-delete-${workflow.id}`}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteWorkflowId} onOpenChange={() => setDeleteWorkflowId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWorkflowId && deleteMutation.mutate(deleteWorkflowId)}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewRunsWorkflowId} onOpenChange={() => setViewRunsWorkflowId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Workflow Run History</DialogTitle>
            <DialogDescription>
              View past executions and their results
            </DialogDescription>
          </DialogHeader>
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
              </div>
            ) : (
              <div className="space-y-4">
                {workflowRuns.map((run) => (
                  <Card key={run.id} data-testid={`card-run-${run.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                run.status === "completed"
                                  ? "default"
                                  : run.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                              data-testid={`badge-run-status-${run.id}`}
                            >
                              {run.status === "completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                              {run.status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
                              {run.status === "running" && <Clock className="w-3 h-3 mr-1" />}
                              {run.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Run ID: {run.id.slice(0, 8)}...
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(run.startedAt).toLocaleString()}
                            </div>
                            {run.completedAt && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Duration:{" "}
                                {Math.round(
                                  (new Date(run.completedAt).getTime() -
                                    new Date(run.startedAt).getTime()) /
                                    1000
                                )}
                                s
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible>
                        {run.error && (
                          <AccordionItem value="error">
                            <AccordionTrigger className="text-destructive">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Error Details
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="bg-destructive/10 p-3 rounded-md text-sm">
                                {run.error}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                        {run.input && Object.keys(run.input).length > 0 && (
                          <AccordionItem value="input">
                            <AccordionTrigger>Input</AccordionTrigger>
                            <AccordionContent>
                              <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                                {JSON.stringify(run.input, null, 2)}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                        {run.output && Object.keys(run.output).length > 0 && (
                          <AccordionItem value="output">
                            <AccordionTrigger>Output & Results</AccordionTrigger>
                            <AccordionContent>
                              <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-64">
                                {JSON.stringify(run.output, null, 2)}
                              </pre>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
