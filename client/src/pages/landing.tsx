import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, MessageSquare, Zap, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="relative py-20 px-8 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-background overflow-hidden mb-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-40"></div>
          <div className="relative text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Business Platform</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6">
              Manage Your AI Models
            </h1>
            <p className="text-2xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
              Deploy, customize, and chat with trained AI models. Build intelligent assistants tailored to your business needs.
            </p>
            <Button
              size="lg"
              className="gap-2 text-lg px-10 py-7 rounded-xl"
              onClick={handleLogin}
              data-testid="button-sign-in"
            >
              Sign In to Get Started
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-16">
          <Card className="hover-elevate transition-all duration-200">
            <CardContent className="p-8">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Chat</h3>
              <p className="text-muted-foreground leading-relaxed">
                Interact with your AI models through an intuitive chat interface with streaming responses.
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate transition-all duration-200">
            <CardContent className="p-8">
              <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Pre-built Templates</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get started quickly with templates for customer support, content generation, and more.
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate transition-all duration-200">
            <CardContent className="p-8">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your data and conversations are securely stored with account-based access control.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Sign in with Google, GitHub, or email
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={handleLogin}
            className="rounded-xl"
            data-testid="button-sign-in-footer"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
