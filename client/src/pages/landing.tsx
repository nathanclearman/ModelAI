import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Sparkles, Shield, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/login" : "/api/register";
      const body = isLogin
        ? { email, password }
        : { email, password, firstName, lastName };

      const response = await apiRequest("POST", endpoint, body);
      const data = await response.json();

      // Handle registration - show success message
      if (!isLogin) {
        toast({
          title: "Registration Successful!",
          description: data.message || "Please check your email to verify your account.",
          duration: 8000,
        });
        // Clear form and switch to login mode
        setEmail("");
        setPassword("");
        setFirstName("");
        setLastName("");
        setIsLogin(true);
        return;
      }

      // Handle login - invalidate and redirect
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-radial-aurora" />
      <div className="absolute inset-0 bg-grid-faint" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-12">
        {/* Hero */}
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-secondary/60 border border-secondary-border rounded-full px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Next‑gen AI workspace
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Welcome to <span className="bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">ModelAI</span>
              </h1>
              <p className="text-2xl sm:text-3xl font-bold text-muted-foreground">
                Build, deploy, and scale your AI experiences
              </p>
            </div>
            <p className="text-muted-foreground text-lg">
              Orchestrate chat, workflows, images, and data with a polished, fast, and secure interface designed for teams.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#auth" className="inline-flex">
                <Button size="lg" className="btn-gradient shadow-md">
                  Get started
                </Button>
              </a>
              <a href="/templates">
                <Button size="lg" variant="secondary" className="border-secondary-border">
                  Browse templates
                </Button>
              </a>
            </div>
            <div className="flex gap-6 pt-2 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2"><Shield className="h-4 w-4" /> Encrypted sessions</div>
              <div className="inline-flex items-center gap-2"><Rocket className="h-4 w-4" /> 1‑click deploy</div>
            </div>
          </div>

          {/* Auth Card */}
          <Card id="auth" className="glass relative w-full max-w-lg ml-auto">
            <CardHeader className="text-center space-y-2 pb-4">
              <div className="mx-auto relative">
                <div className="absolute inset-0 rounded-xl bg-primary/20 rotate-3 blur-md"></div>
                <div className="relative h-14 w-14 rounded-xl bg-primary flex items-center justify-center shadow">
                  <Zap className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">
                  {isLogin ? "Welcome back to ModelAI" : "Create your ModelAI account"}
                </CardTitle>
                <CardDescription>
                  {isLogin ? "Sign in to continue to ModelAI" : "Start your ModelAI journey"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    data-testid="input-email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    data-testid="input-password"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full btn-gradient"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-toggle-mode"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
