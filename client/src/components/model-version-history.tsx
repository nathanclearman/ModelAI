import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { History, RotateCcw, Clock, User, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface ModelVersionHistoryProps {
  modelId: string;
}

interface ModelVersion {
  id: string;
  modelId: string;
  versionNumber: number;
  name: string;
  description: string | null;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  template: string | null;
  category: string | null;
  tags: string[] | null;
  changeDescription: string | null;
  createdBy: string;
  createdAt: string;
}

export function ModelVersionHistory({ modelId }: ModelVersionHistoryProps) {
  const { toast } = useToast();
  const [selectedVersion, setSelectedVersion] = useState<ModelVersion | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch version history
  const { data: versions, isLoading } = useQuery<ModelVersion[]>({
    queryKey: ["/api/models", modelId, "versions"],
    enabled: !!modelId,
  });

  // Restore version mutation
  const restoreMutation = useMutation({
    mutationFn: async (versionNumber: number) => {
      return await apiRequest("POST", `/api/models/${modelId}/versions/${versionNumber}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/models", modelId, "versions"] });
      toast({
        title: "Version Restored",
        description: "The model has been restored to the selected version.",
      });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Restore Failed",
        description: error.message || "Failed to restore version.",
        variant: "destructive",
      });
    },
  });

  const handleViewVersion = (version: ModelVersion) => {
    setSelectedVersion(version);
    setIsDialogOpen(true);
  };

  const handleRestoreVersion = (versionNumber: number) => {
    if (window.confirm(`Are you sure you want to restore to version ${versionNumber}? This will create a new version with the previous configuration.`)) {
      restoreMutation.mutate(versionNumber);
    }
  };

  if (isLoading) {
    return (
      <Card data-testid="card-version-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>Loading version history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <Card data-testid="card-version-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>No version history yet. Make changes to create your first version.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card data-testid="card-version-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>
            View and restore previous versions of this model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3 hover-elevate"
                  data-testid={`version-item-${version.versionNumber}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={index === 0 ? "default" : "secondary"} data-testid={`badge-version-${version.versionNumber}`}>
                        v{version.versionNumber}
                      </Badge>
                      {index === 0 && (
                        <Badge variant="outline" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mb-1" data-testid={`text-version-name-${version.versionNumber}`}>
                      {version.name}
                    </p>
                    {version.changeDescription && (
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`text-change-description-${version.versionNumber}`}>
                        {version.changeDescription}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {version.model}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewVersion(version)}
                      data-testid={`button-view-version-${version.versionNumber}`}
                    >
                      View
                    </Button>
                    {index !== 0 && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleRestoreVersion(version.versionNumber)}
                        disabled={restoreMutation.isPending}
                        data-testid={`button-restore-version-${version.versionNumber}`}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Version Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-version-details">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Version {selectedVersion?.versionNumber} Details
              <Badge variant="outline">{selectedVersion?.model}</Badge>
            </DialogTitle>
            <DialogDescription>
              Created {selectedVersion && formatDistanceToNow(new Date(selectedVersion.createdAt), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>
          {selectedVersion && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Model Name</h4>
                <p className="text-sm text-muted-foreground" data-testid="text-dialog-model-name">{selectedVersion.name}</p>
              </div>

              {selectedVersion.description && (
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground" data-testid="text-dialog-description">{selectedVersion.description}</p>
                </div>
              )}

              {selectedVersion.changeDescription && (
                <div>
                  <h4 className="font-medium mb-1">Change Description</h4>
                  <p className="text-sm text-muted-foreground" data-testid="text-dialog-change-description">{selectedVersion.changeDescription}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">AI Model</h4>
                  <p className="text-sm text-muted-foreground" data-testid="text-dialog-model">{selectedVersion.model}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Temperature</h4>
                  <p className="text-sm text-muted-foreground" data-testid="text-dialog-temperature">{selectedVersion.temperature / 100}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Max Tokens</h4>
                  <p className="text-sm text-muted-foreground" data-testid="text-dialog-max-tokens">{selectedVersion.maxTokens}</p>
                </div>
                {selectedVersion.category && (
                  <div>
                    <h4 className="font-medium mb-1">Category</h4>
                    <p className="text-sm text-muted-foreground" data-testid="text-dialog-category">{selectedVersion.category}</p>
                  </div>
                )}
              </div>

              {selectedVersion.tags && selectedVersion.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVersion.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" data-testid={`badge-tag-${i}`}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="font-medium mb-2">System Prompt</h4>
                <div className="rounded-md border p-3 bg-muted/50">
                  <pre className="text-sm whitespace-pre-wrap font-mono" data-testid="text-dialog-system-prompt">
                    {selectedVersion.systemPrompt}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
