import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit, Play, Copy, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type WebhookConfiguration = {
  id: string;
  userId: string;
  workspaceId: string | null;
  name: string;
  description: string | null;
  url: string;
  method: string;
  headers: Record<string, string> | null;
  bodyTemplate: any;
  authType: string | null;
  authConfig: any;
  createdAt: string;
  updatedAt: string;
};

export default function Webhooks() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfiguration | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("POST");
  const [headers, setHeaders] = useState("{}");
  const [bodyTemplate, setBodyTemplate] = useState("{}");
  const [authType, setAuthType] = useState<string>("none");
  const [authToken, setAuthToken] = useState("");
  const [authKey, setAuthKey] = useState("");
  const [authValue, setAuthValue] = useState("");
  const [testData, setTestData] = useState("{}");
  const [testResult, setTestResult] = useState<any>(null);

  const { data: webhooks = [], isLoading } = useQuery<WebhookConfiguration[]>({
    queryKey: ["/api/webhooks"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("/api/webhooks", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Success",
        description: "Webhook configuration created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create webhook configuration",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/webhooks/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      setShowEditDialog(false);
      setSelectedWebhook(null);
      resetForm();
      toast({
        title: "Success",
        description: "Webhook configuration updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update webhook configuration",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`/api/webhooks/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({
        title: "Success",
        description: "Webhook configuration deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete webhook configuration",
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: async ({ id, testData }: { id: string; testData: any }) =>
      apiRequest(`/api/webhooks/${id}/test`, "POST", { testData }),
    onSuccess: (data) => {
      setTestResult(data);
      toast({
        title: "Test Complete",
        description: `Status: ${data.status} ${data.statusText}`,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test webhook",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setUrl("");
    setMethod("POST");
    setHeaders("{}");
    setBodyTemplate("{}");
    setAuthType("none");
    setAuthToken("");
    setAuthKey("");
    setAuthValue("");
  };

  const handleCreate = () => {
    try {
      let parsedHeaders = {};
      let parsedBody = null;
      let parsedAuthConfig = null;

      if (headers.trim()) {
        parsedHeaders = JSON.parse(headers);
      }

      if (bodyTemplate.trim() && method !== "GET") {
        parsedBody = JSON.parse(bodyTemplate);
      }

      if (authType === "bearer") {
        parsedAuthConfig = { token: authToken };
      } else if (authType === "api_key") {
        parsedAuthConfig = { key: authKey, value: authValue };
      }

      createMutation.mutate({
        name,
        description: description || null,
        url,
        method,
        headers: parsedHeaders,
        bodyTemplate: parsedBody,
        authType: authType === "none" ? null : authType,
        authConfig: parsedAuthConfig,
      });
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.message || "Invalid JSON in headers or body template",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (webhook: WebhookConfiguration) => {
    setSelectedWebhook(webhook);
    setName(webhook.name);
    setDescription(webhook.description || "");
    setUrl(webhook.url);
    setMethod(webhook.method);
    setHeaders(JSON.stringify(webhook.headers || {}, null, 2));
    setBodyTemplate(JSON.stringify(webhook.bodyTemplate || {}, null, 2));
    setAuthType(webhook.authType || "none");
    
    if (webhook.authType === "bearer" && webhook.authConfig) {
      setAuthToken((webhook.authConfig as any).token || "");
    } else if (webhook.authType === "api_key" && webhook.authConfig) {
      setAuthKey((webhook.authConfig as any).key || "");
      setAuthValue((webhook.authConfig as any).value || "");
    }
    
    setShowEditDialog(true);
  };

  const handleUpdate = () => {
    if (!selectedWebhook) return;

    try {
      let parsedHeaders = {};
      let parsedBody = null;
      let parsedAuthConfig = null;

      if (headers.trim()) {
        parsedHeaders = JSON.parse(headers);
      }

      if (bodyTemplate.trim() && method !== "GET") {
        parsedBody = JSON.parse(bodyTemplate);
      }

      if (authType === "bearer") {
        parsedAuthConfig = { token: authToken };
      } else if (authType === "api_key") {
        parsedAuthConfig = { key: authKey, value: authValue };
      }

      updateMutation.mutate({
        id: selectedWebhook.id,
        data: {
          name,
          description: description || null,
          url,
          method,
          headers: parsedHeaders,
          bodyTemplate: parsedBody,
          authType: authType === "none" ? null : authType,
          authConfig: parsedAuthConfig,
        },
      });
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.message || "Invalid JSON in headers or body template",
        variant: "destructive",
      });
    }
  };

  const handleTest = (webhook: WebhookConfiguration) => {
    setSelectedWebhook(webhook);
    setTestData(JSON.stringify(webhook.bodyTemplate || {}, null, 2));
    setTestResult(null);
    setShowTestDialog(true);
  };

  const runTest = () => {
    if (!selectedWebhook) return;

    try {
      const parsedTestData = testData.trim() ? JSON.parse(testData) : null;
      testMutation.mutate({
        id: selectedWebhook.id,
        testData: parsedTestData,
      });
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: "Invalid JSON in test data",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Webhook Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure, test, and reuse webhooks for integrating with external services
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-webhook">
              <Plus className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create Webhook Configuration</DialogTitle>
              <DialogDescription>
                Configure a reusable webhook endpoint for external integrations
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Discord Notification"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="input-name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Send notifications to Discord channel"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    data-testid="input-description"
                  />
                </div>

                <div>
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    data-testid="input-url"
                  />
                </div>

                <div>
                  <Label htmlFor="method">HTTP Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger id="method" data-testid="select-method">
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

                <div>
                  <Label htmlFor="authType">Authentication</Label>
                  <Select value={authType} onValueChange={setAuthType}>
                    <SelectTrigger id="authType" data-testid="select-auth-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="bearer">Bearer Token</SelectItem>
                      <SelectItem value="api_key">API Key (Header)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {authType === "bearer" && (
                  <div>
                    <Label htmlFor="authToken">Bearer Token</Label>
                    <Input
                      id="authToken"
                      type="password"
                      placeholder="Enter bearer token"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      data-testid="input-auth-token"
                    />
                  </div>
                )}

                {authType === "api_key" && (
                  <>
                    <div>
                      <Label htmlFor="authKey">Header Name</Label>
                      <Input
                        id="authKey"
                        placeholder="X-API-Key"
                        value={authKey}
                        onChange={(e) => setAuthKey(e.target.value)}
                        data-testid="input-auth-key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="authValue">Header Value</Label>
                      <Input
                        id="authValue"
                        type="password"
                        placeholder="Enter API key"
                        value={authValue}
                        onChange={(e) => setAuthValue(e.target.value)}
                        data-testid="input-auth-value"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="headers">Custom Headers (JSON)</Label>
                  <Textarea
                    id="headers"
                    placeholder='{"Content-Type": "application/json"}'
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    className="font-mono text-sm"
                    rows={4}
                    data-testid="textarea-headers"
                  />
                </div>

                {method !== "GET" && (
                  <div>
                    <Label htmlFor="bodyTemplate">Body Template (JSON)</Label>
                    <Textarea
                      id="bodyTemplate"
                      placeholder='{"content": "{{message}}", "username": "Bot"}'
                      value={bodyTemplate}
                      onChange={(e) => setBodyTemplate(e.target.value)}
                      className="font-mono text-sm"
                      rows={6}
                      data-testid="textarea-body"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use variables like {`{{variable_name}}`} that can be replaced at runtime
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={createMutation.isPending || !name || !url}
                    data-testid="button-submit-create"
                  >
                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ExternalLink className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Webhooks Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Create your first webhook configuration to start integrating with external services
            </p>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first">
              <Plus className="h-4 w-4 mr-2" />
              Create First Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} data-testid={`card-webhook-${webhook.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {webhook.name}
                      <Badge variant="outline">{webhook.method}</Badge>
                    </CardTitle>
                    {webhook.description && (
                      <CardDescription className="mt-1">{webhook.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleTest(webhook)}
                      data-testid={`button-test-${webhook.id}`}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(webhook)}
                      data-testid={`button-edit-${webhook.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this webhook configuration?")) {
                          deleteMutation.mutate(webhook.id);
                        }
                      }}
                      data-testid={`button-delete-${webhook.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">URL:</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">{webhook.url}</code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(webhook.url, "URL")}
                      data-testid={`button-copy-url-${webhook.id}`}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {webhook.authType && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Auth:</span>
                      <Badge variant="secondary">{webhook.authType}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Created {new Date(webhook.createdAt).toLocaleDateString()}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Webhook Configuration</DialogTitle>
            <DialogDescription>
              Update webhook endpoint configuration
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-4">
              {/* Same form fields as create - omitted for brevity, uses same state variables */}
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-edit-name"
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-edit-description"
                />
              </div>

              <div>
                <Label htmlFor="edit-url">URL *</Label>
                <Input
                  id="edit-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  data-testid="input-edit-url"
                />
              </div>

              <div>
                <Label htmlFor="edit-method">HTTP Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="edit-method" data-testid="select-edit-method">
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

              <div>
                <Label htmlFor="edit-authType">Authentication</Label>
                <Select value={authType} onValueChange={setAuthType}>
                  <SelectTrigger id="edit-authType" data-testid="select-edit-auth-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="api_key">API Key (Header)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {authType === "bearer" && (
                <div>
                  <Label htmlFor="edit-authToken">Bearer Token</Label>
                  <Input
                    id="edit-authToken"
                    type="password"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    data-testid="input-edit-auth-token"
                  />
                </div>
              )}

              {authType === "api_key" && (
                <>
                  <div>
                    <Label htmlFor="edit-authKey">Header Name</Label>
                    <Input
                      id="edit-authKey"
                      value={authKey}
                      onChange={(e) => setAuthKey(e.target.value)}
                      data-testid="input-edit-auth-key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-authValue">Header Value</Label>
                    <Input
                      id="edit-authValue"
                      type="password"
                      value={authValue}
                      onChange={(e) => setAuthValue(e.target.value)}
                      data-testid="input-edit-auth-value"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="edit-headers">Custom Headers (JSON)</Label>
                <Textarea
                  id="edit-headers"
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  className="font-mono text-sm"
                  rows={4}
                  data-testid="textarea-edit-headers"
                />
              </div>

              {method !== "GET" && (
                <div>
                  <Label htmlFor="edit-bodyTemplate">Body Template (JSON)</Label>
                  <Textarea
                    id="edit-bodyTemplate"
                    value={bodyTemplate}
                    onChange={(e) => setBodyTemplate(e.target.value)}
                    className="font-mono text-sm"
                    rows={6}
                    data-testid="textarea-edit-body"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedWebhook(null);
                    resetForm();
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending || !name || !url}
                  data-testid="button-submit-edit"
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Test Webhook: {selectedWebhook?.name}</DialogTitle>
            <DialogDescription>
              Send a test request to verify webhook configuration
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="request" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="request" data-testid="tab-request">Request</TabsTrigger>
              <TabsTrigger value="response" data-testid="tab-response">Response</TabsTrigger>
            </TabsList>
            <TabsContent value="request" className="space-y-4">
              <div>
                <Label htmlFor="testData">Test Data (JSON)</Label>
                <Textarea
                  id="testData"
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                  className="font-mono text-sm"
                  rows={12}
                  data-testid="textarea-test-data"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowTestDialog(false)}
                  data-testid="button-cancel-test"
                >
                  Close
                </Button>
                <Button
                  onClick={runTest}
                  disabled={testMutation.isPending}
                  data-testid="button-run-test"
                >
                  {testMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Play className="h-4 w-4 mr-2" />
                  Run Test
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="response" className="space-y-4">
              {testResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={testResult.success ? "default" : "destructive"}>
                      {testResult.status} {testResult.statusText}
                    </Badge>
                  </div>
                  <div>
                    <Label>Response Body</Label>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96 mt-2">
                      {JSON.stringify(testResult.body, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <Label>Response Headers</Label>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-48 mt-2">
                      {JSON.stringify(testResult.headers, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Play className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No test results yet. Run a test to see the response.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
