import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Copy, ExternalLink, Zap, Settings, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Integration = {
  id: string;
  userId: string;
  workspaceId: string | null;
  type: string;
  name: string;
  description: string | null;
  webhookUrl: string | null;
  enabled: boolean;
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
  apiKey?: string; // Only shown when creating
};

export default function Integrations() {
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [newIntegration, setNewIntegration] = useState({
    type: "zapier",
    name: "",
    description: "",
    webhookUrl: "",
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: integrations = [], isLoading } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create integration");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      setIsCreateDialogOpen(false);
      setNewIntegration({ type: "zapier", name: "", description: "", webhookUrl: "" });
      toast({
        title: "Integration Created",
        description: "Your API key is shown below. Copy it now - you won't be able to see it again!",
      });
      // Show API key in dialog
      setShowApiKey({ [data.id]: true });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create integration",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/integrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update integration");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Success",
        description: "Integration updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update integration",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/integrations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete integration");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({
        title: "Success",
        description: "Integration deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete integration",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!newIntegration.name) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newIntegration);
  };

  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const getIntegrationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "zapier":
        return <Zap className="h-5 w-5" />;
      case "make":
        return <Settings className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getIntegrationDocs = (type: string) => {
    switch (type.toLowerCase()) {
      case "zapier":
        return "https://zapier.com/apps/modelai/integrations";
      case "make":
        return "https://www.make.com/en/help/app/modelai";
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ModelAI Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Connect ModelAI with Zapier, Make.com, and other automation platforms
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Integration</DialogTitle>
              <DialogDescription>
                Create a new integration to connect ModelAI with automation platforms
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Platform</Label>
                <Select
                  value={newIntegration.type}
                  onValueChange={(value) => setNewIntegration({ ...newIntegration, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zapier">Zapier</SelectItem>
                    <SelectItem value="make">Make.com</SelectItem>
                    <SelectItem value="n8n">n8n</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                  placeholder="My Zapier Integration"
                />
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Textarea
                  value={newIntegration.description}
                  onChange={(e) => setNewIntegration({ ...newIntegration, description: e.target.value })}
                  placeholder="Integration for automating customer support"
                  rows={3}
                />
              </div>
              <div>
                <Label>Webhook URL (Optional)</Label>
                <Input
                  value={newIntegration.webhookUrl}
                  onChange={(e) => setNewIntegration({ ...newIntegration, webhookUrl: e.target.value })}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  type="url"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If provided, events will be sent to this URL automatically
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Getting Started:</strong> Create an integration to get an API key. Use this key in Zapier, Make.com, or any automation platform to connect ModelAI. 
          <a href="/docs/integrations" className="text-primary underline ml-1">View documentation</a>
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="text-center py-12">Loading integrations...</div>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No integrations yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first integration to connect ModelAI with automation platforms
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Integration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getIntegrationIcon(integration.type)}
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{integration.type}</Badge>
                        {integration.enabled ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </div>
                {integration.description && (
                  <p className="text-sm text-muted-foreground mt-2">{integration.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {integration.apiKey && (
                  <div className="space-y-2">
                    <Label>API Key (Copy this now - you won't see it again!)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={integration.apiKey}
                        readOnly
                        type={showApiKey[integration.id] ? "text" : "password"}
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowApiKey({ ...showApiKey, [integration.id]: !showApiKey[integration.id] })}
                      >
                        {showApiKey[integration.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyApiKey(integration.apiKey!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {integration.webhookUrl && (
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input value={integration.webhookUrl} readOnly className="text-xs" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyApiKey(integration.webhookUrl!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {integration.lastUsed && (
                  <div className="text-xs text-muted-foreground">
                    Last used: {new Date(integration.lastUsed).toLocaleString()}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`enable-${integration.id}`} className="text-sm">Enabled</Label>
                    <Switch
                      id={`enable-${integration.id}`}
                      checked={integration.enabled}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({ id: integration.id, data: { enabled: checked } })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    {getIntegrationDocs(integration.type) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getIntegrationDocs(integration.type), "_blank")}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Docs
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(integration.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

