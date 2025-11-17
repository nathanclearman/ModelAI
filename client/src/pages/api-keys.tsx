import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Copy, Trash2, Key, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  modelId?: string;
  lastUsed?: string;
  expiresAt?: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState<string>("never");
  const [newKeyModelId, setNewKeyModelId] = useState<string | undefined>();
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/keys"],
  });

  const { data: models = [] } = useQuery<any[]>({
    queryKey: ["/api/models"],
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      let expiresAt = undefined;
      if (newKeyExpiry !== "never") {
        const days = parseInt(newKeyExpiry);
        const date = new Date();
        date.setDate(date.getDate() + days);
        expiresAt = date.toISOString();
      }

      const res = await apiRequest("POST", "/api/keys", {
        name: newKeyName,
        modelId: newKeyModelId || null,
        expiresAt,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedKey(data.key);
      setNewKeyName("");
      setNewKeyExpiry("never");
      setNewKeyModelId(undefined);
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({
        title: "API key created",
        description: "Save this key now - it won't be shown again!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({
        title: "Success",
        description: "API key deleted",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a key name",
        variant: "destructive",
      });
      return;
    }
    createKeyMutation.mutate();
  };

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">ModelAI API Keys</h1>
            <p className="text-muted-foreground mt-2">
              Manage API keys to access your ModelAI models programmatically
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-api-key">
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Key className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
              <p className="text-muted-foreground mb-4">Create your first API key to get started</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-key">
                Create API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((key) => (
              <Card key={key.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg" data-testid={`text-key-name-${key.id}`}>{key.name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-4 text-sm">
                          <span data-testid={`text-key-value-${key.id}`}>Key: {key.key}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(key.key)}
                            data-testid={`button-copy-${key.id}`}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteKeyMutation.mutate(key.id)}
                      disabled={deleteKeyMutation.isPending}
                      data-testid={`button-delete-${key.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    {key.lastUsed && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Last used: {format(new Date(key.lastUsed), "MMM d, yyyy")}
                      </div>
                    )}
                    {key.expiresAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Expires: {format(new Date(key.expiresAt), "MMM d, yyyy")}
                      </div>
                    )}
                    <div>Created: {format(new Date(key.createdAt), "MMM d, yyyy")}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create API Key Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-key">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key to access your models programmatically
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                placeholder="My API Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                data-testid="input-key-name"
              />
            </div>

            <div>
              <Label htmlFor="model-scope">Model Scope (Optional)</Label>
              <Select value={newKeyModelId} onValueChange={setNewKeyModelId}>
                <SelectTrigger data-testid="select-model-scope">
                  <SelectValue placeholder="All models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All models</SelectItem>
                  {models.map((model: any) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expiry">Expires In</Label>
              <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                <SelectTrigger data-testid="select-expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateKey}
              disabled={createKeyMutation.isPending}
              data-testid="button-confirm-create"
            >
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Key Display Dialog */}
      <Dialog open={!!generatedKey} onOpenChange={() => setGeneratedKey(null)}>
        <DialogContent data-testid="dialog-generated-key">
          <DialogHeader>
            <DialogTitle>API Key Created!</DialogTitle>
            <DialogDescription>
              Save this key now - you won't be able to see it again
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-md">
              <code className="text-sm break-all" data-testid="text-generated-key">{generatedKey}</code>
            </div>
            <Button
              onClick={() => generatedKey && copyToClipboard(generatedKey)}
              className="w-full"
              data-testid="button-copy-generated"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => setGeneratedKey(null)} data-testid="button-close-generated">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
