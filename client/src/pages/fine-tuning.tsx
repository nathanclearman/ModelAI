import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Upload, Plus, RefreshCw, X, FileText, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type FineTuningFile = {
  id: string;
  fileName: string;
  fileSize: number;
  exampleCount: number | null;
  status: string;
  createdAt: string;
};

type FineTuningJob = {
  id: string;
  baseModel: string;
  fineTunedModel: string | null;
  suffix: string | null;
  status: string;
  trainedTokens: number | null;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
  hyperparameters: any;
};

const BASE_MODELS = [
  { value: "gpt-4o-mini-2024-07-18", label: "GPT-4o Mini" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
];

const EXAMPLE_JSONL = `{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What is Python?"}, {"role": "assistant", "content": "Python is a high-level programming language."}]}
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What is JavaScript?"}, {"role": "assistant", "content": "JavaScript is a scripting language for web development."}]}`;

export default function FineTuningPage() {
  const { toast } = useToast();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCreateJobDialog, setShowCreateJobDialog] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<"file" | "text">("file");
  const [fileName, setFileName] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [selectedTrainingFile, setSelectedTrainingFile] = useState("");
  const [selectedBaseModel, setSelectedBaseModel] = useState("");
  const [modelSuffix, setModelSuffix] = useState("");
  const [nEpochs, setNEpochs] = useState("3");

  const { data: files = [], isLoading: isLoadingFiles } = useQuery<FineTuningFile[]>({
    queryKey: ["/api/fine-tuning/files"],
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery<FineTuningJob[]>({
    queryKey: ["/api/fine-tuning/jobs"],
    refetchInterval: 10000, // Auto-refresh every 10 seconds for real-time monitoring
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (data: { fileName: string; fileContent: string }) => {
      const response = await apiRequest("POST", "/api/fine-tuning/files", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fine-tuning/files"] });
      toast({
        title: "File uploaded",
        description: "Training file uploaded successfully.",
      });
      setShowUploadDialog(false);
      setFileName("");
      setFileContent("");
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: {
      trainingFileId: string;
      baseModel: string;
      suffix?: string;
      hyperparameters?: any;
    }) => {
      const response = await apiRequest("POST", "/api/fine-tuning/jobs", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fine-tuning/jobs"] });
      toast({
        title: "Job created",
        description: "Fine-tuning job started successfully.",
      });
      setShowCreateJobDialog(false);
      setSelectedTrainingFile("");
      setSelectedBaseModel("");
      setModelSuffix("");
      setNEpochs("3");
    },
    onError: (error: any) => {
      toast({
        title: "Job creation failed",
        description: error.message || "Failed to create fine-tuning job",
        variant: "destructive",
      });
    },
  });

  const syncJobMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/fine-tuning/jobs/${id}/sync`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fine-tuning/jobs"] });
      toast({
        title: "Status updated",
        description: "Job status synced from OpenAI.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync status",
        variant: "destructive",
      });
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/fine-tuning/jobs/${id}/cancel`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fine-tuning/jobs"] });
      toast({
        title: "Job cancelled",
        description: "Fine-tuning job cancelled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation failed",
        description: error.message || "Failed to cancel job",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Auto-set filename from selected file
    setFileName(file.name);

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.onerror = () => {
      toast({
        title: "File read error",
        description: "Failed to read the file. Please try again.",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const handleUploadFile = () => {
    if (!fileName || !fileContent) {
      toast({
        title: "Validation error",
        description: "Please provide both file name and content.",
        variant: "destructive",
      });
      return;
    }

    uploadFileMutation.mutate({ fileName, fileContent });
  };

  const handleCreateJob = () => {
    if (!selectedTrainingFile || !selectedBaseModel) {
      toast({
        title: "Validation error",
        description: "Please select a training file and base model.",
        variant: "destructive",
      });
      return;
    }

    const hyperparameters: any = {};
    if (nEpochs && nEpochs !== "auto") {
      hyperparameters.n_epochs = parseInt(nEpochs);
    }

    createJobMutation.mutate({
      trainingFileId: selectedTrainingFile,
      baseModel: selectedBaseModel,
      suffix: modelSuffix || undefined,
      hyperparameters: Object.keys(hyperparameters).length > 0 ? hyperparameters : undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pending", variant: "secondary" },
      running: { label: "Running", variant: "default" },
      succeeded: { label: "Succeeded", variant: "outline" },
      failed: { label: "Failed", variant: "destructive" },
      cancelled: { label: "Cancelled", variant: "secondary" },
      uploaded: { label: "Uploaded", variant: "outline" },
    };

    const config = statusConfig[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Fine-Tuning
          </h1>
          <p className="text-muted-foreground mt-1">
            Train custom AI models on your own data
          </p>
        </div>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList data-testid="tabs-fine-tuning">
          <TabsTrigger value="jobs" data-testid="tab-jobs">Fine-Tuning Jobs</TabsTrigger>
          <TabsTrigger value="files" data-testid="tab-files">Training Files</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Upload JSONL files with training examples
            </p>
            <Button onClick={() => setShowUploadDialog(true)} data-testid="button-upload-file">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>

          {isLoadingFiles ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No training files yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Upload JSONL files to start fine-tuning
                </p>
                <Button onClick={() => setShowUploadDialog(true)} data-testid="button-upload-first">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First File
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {files.map((file) => (
                <Card key={file.id} data-testid={`card-file-${file.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      {file.fileName}
                    </CardTitle>
                    <CardDescription>
                      {getStatusBadge(file.status)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span>{(file.fileSize / 1024).toFixed(2)} KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Examples:</span>
                        <span>{file.exampleCount || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uploaded:</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Monitor and manage your fine-tuning jobs
            </p>
            <Button 
              onClick={() => setShowCreateJobDialog(true)} 
              disabled={files.length === 0}
              data-testid="button-create-job"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Job
            </Button>
          </div>

          {isLoadingJobs ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No fine-tuning jobs yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first fine-tuning job to train a custom model
                </p>
                <Button 
                  onClick={() => setShowCreateJobDialog(true)}
                  disabled={files.length === 0}
                  data-testid="button-create-first-job"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id} data-testid={`card-job-${job.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <div>
                          <CardTitle className="text-base">
                            {job.fineTunedModel || `Fine-tuning ${job.baseModel}`}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Base: {job.baseModel}
                            {job.suffix && ` • Suffix: ${job.suffix}`}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(job.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tokens Trained:</span>
                          <div className="font-medium">{job.trainedTokens?.toLocaleString() || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <div className="font-medium">{new Date(job.createdAt).toLocaleString()}</div>
                        </div>
                        {job.finishedAt && (
                          <div>
                            <span className="text-muted-foreground">Finished:</span>
                            <div className="font-medium">{new Date(job.finishedAt).toLocaleString()}</div>
                          </div>
                        )}
                        {job.error && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Error:</span>
                            <div className="text-red-600 text-sm">{job.error}</div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncJobMutation.mutate(job.id)}
                          disabled={syncJobMutation.isPending}
                          data-testid={`button-sync-${job.id}`}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${syncJobMutation.isPending ? 'animate-spin' : ''}`} />
                          Sync Status
                        </Button>
                        {job.status === "running" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => cancelJobMutation.mutate(job.id)}
                            disabled={cancelJobMutation.isPending}
                            data-testid={`button-cancel-${job.id}`}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload File Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upload Training File</DialogTitle>
            <DialogDescription>
              Upload a JSONL file with training examples. Each line should be a JSON object with a "messages" array.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "file" | "text")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" data-testid="tab-upload-file">
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="text" data-testid="tab-paste-text">
                  Paste Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select JSONL File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".jsonl,.json"
                    onChange={handleFileSelect}
                    data-testid="input-file-upload"
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a .jsonl file from your computer
                  </p>
                </div>
                {fileContent && (
                  <div>
                    <Label>Preview</Label>
                    <ScrollArea className="h-48 rounded-md border p-3">
                      <pre className="text-xs font-mono">{fileContent}</pre>
                    </ScrollArea>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <div>
                  <Label htmlFor="fileName">File Name</Label>
                  <Input
                    id="fileName"
                    placeholder="training-data.jsonl"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    data-testid="input-file-name"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="fileContent">File Content (JSONL)</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFileContent(EXAMPLE_JSONL)}
                      data-testid="button-use-example"
                    >
                      Use Example
                    </Button>
                  </div>
                  <Textarea
                    id="fileContent"
                    placeholder={EXAMPLE_JSONL}
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="font-mono text-xs"
                    rows={12}
                    data-testid="textarea-file-content"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Each line must be valid JSON with a "messages" array containing role and content fields.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)} data-testid="button-cancel-upload">
                Cancel
              </Button>
              <Button 
                onClick={handleUploadFile} 
                disabled={uploadFileMutation.isPending || !fileName || !fileContent}
                data-testid="button-submit-upload"
              >
                {uploadFileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Job Dialog */}
      <Dialog open={showCreateJobDialog} onOpenChange={setShowCreateJobDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Fine-Tuning Job</DialogTitle>
            <DialogDescription>
              Configure and start a new fine-tuning job
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="trainingFile">Training File</Label>
              <Select value={selectedTrainingFile} onValueChange={setSelectedTrainingFile}>
                <SelectTrigger id="trainingFile" data-testid="select-training-file">
                  <SelectValue placeholder="Select a training file" />
                </SelectTrigger>
                <SelectContent>
                  {files.map((file) => (
                    <SelectItem key={file.id} value={file.id}>
                      {file.fileName} ({file.exampleCount} examples)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="baseModel">Base Model</Label>
              <Select value={selectedBaseModel} onValueChange={setSelectedBaseModel}>
                <SelectTrigger id="baseModel" data-testid="select-base-model">
                  <SelectValue placeholder="Select a base model" />
                </SelectTrigger>
                <SelectContent>
                  {BASE_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="suffix">Model Suffix (Optional)</Label>
              <Input
                id="suffix"
                placeholder="my-custom-model"
                value={modelSuffix}
                onChange={(e) => setModelSuffix(e.target.value)}
                maxLength={40}
                data-testid="input-suffix"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max 40 characters. Will be appended to the model name.
              </p>
            </div>
            <div>
              <Label htmlFor="nEpochs">Training Epochs</Label>
              <Input
                id="nEpochs"
                type="number"
                placeholder="3"
                value={nEpochs}
                onChange={(e) => setNEpochs(e.target.value)}
                min="1"
                max="50"
                data-testid="input-epochs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of training epochs (1-50). Leave empty for auto.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateJobDialog(false)} data-testid="button-cancel-job">
                Cancel
              </Button>
              <Button 
                onClick={handleCreateJob} 
                disabled={createJobMutation.isPending}
                data-testid="button-submit-job"
              >
                {createJobMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Job
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
