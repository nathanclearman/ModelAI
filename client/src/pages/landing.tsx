import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, LogIn } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">
            AI Model Management
          </CardTitle>
          <CardDescription className="text-base">
            Sign in to manage your AI models, chat with assistants, and view conversation history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            size="lg"
            className="w-full gap-2 text-base py-6 rounded-xl"
            onClick={handleLogin}
            data-testid="button-sign-in"
          >
            <LogIn className="h-5 w-5" />
            Sign In with Replit
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Use your Replit account to access the platform
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
