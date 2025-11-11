import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Key, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = sessionStorage.getItem("openai_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsApiKeySet(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an API key",
      });
      return;
    }

    if (!apiKey.startsWith("sk-")) {
      toast({
        variant: "destructive",
        title: "Invalid API Key",
        description: "OpenAI API keys should start with 'sk-'",
      });
      return;
    }

    sessionStorage.setItem("openai_api_key", apiKey);
    setIsApiKeySet(true);
    toast({
      title: "API Key Saved",
      description: "Your OpenAI API key has been saved for this session",
    });
  };

  const handleClearApiKey = () => {
    sessionStorage.removeItem("openai_api_key");
    setApiKey("");
    setIsApiKeySet(false);
    toast({
      title: "API Key Removed",
      description: "Your API key has been cleared",
    });
  };

  return (
    <div className="space-y-16">
      <div className="py-12">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">Settings</h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Manage your account and application preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              defaultValue="John Doe"
              data-testid="input-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              defaultValue="john@example.com"
              data-testid="input-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="Acme Corp"
              defaultValue="Acme Corp"
              data-testid="input-company"
            />
          </div>
          <Button data-testid="button-save-account">Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about your models and conversations
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              data-testid="switch-email-notifications"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-save">Auto-save Conversations</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save your conversations
              </p>
            </div>
            <Switch
              id="auto-save"
              checked={autoSave}
              onCheckedChange={setAutoSave}
              data-testid="switch-auto-save"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenAI API Configuration
          </CardTitle>
          <CardDescription>
            Enter your OpenAI API key to use fine-tuned models and access your custom models
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your API key is stored securely in your browser session and is never sent to our servers. 
              It will be cleared when you close your browser.
            </AlertDescription>
          </Alert>

          {isApiKeySet && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                API key is configured. You can now use your fine-tuned models.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="openai-api-key">OpenAI API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="openai-api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-proj-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  data-testid="input-openai-api-key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowApiKey(!showApiKey)}
                  data-testid="button-toggle-api-key-visibility"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button 
                onClick={handleSaveApiKey}
                data-testid="button-save-api-key"
              >
                Save Key
              </Button>
              {isApiKeySet && (
                <Button
                  variant="outline"
                  onClick={handleClearApiKey}
                  data-testid="button-clear-api-key"
                >
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                platform.openai.com/api-keys
              </a>
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Why do I need this?</Label>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Access your personal fine-tuned OpenAI models</li>
              <li>Use models trained specifically for your use case</li>
              <li>API costs are billed directly to your OpenAI account</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" data-testid="button-delete-account">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
