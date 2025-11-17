import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import VerifyEmail from "@/pages/verify-email";
import Dashboard from "@/pages/dashboard";
import Models from "@/pages/models";
import Chat from "@/pages/chat";
import UploadModel from "@/pages/upload-model";
import Templates from "@/pages/templates";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";
import Marketplace from "@/pages/marketplace";
import ApiKeys from "@/pages/api-keys";
import Workspaces from "@/pages/workspaces";
import Workflows from "@/pages/workflows";
import FineTuning from "@/pages/fine-tuning";
import Webhooks from "@/pages/webhooks";
import Integrations from "@/pages/integrations";
import Documentation from "@/pages/documentation";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Public routes (no authentication required)
  return (
    <Switch>
      <Route path="/verify-email" component={VerifyEmail} />
      {!isAuthenticated && <Route path="/" component={Landing} />}
      {isAuthenticated && <Route path="/" component={Dashboard} />}
      {isAuthenticated && <Route path="/models" component={Models} />}
      {isAuthenticated && <Route path="/chat/:modelId/:conversationId?" component={Chat} />}
      {isAuthenticated && <Route path="/upload" component={UploadModel} />}
      {isAuthenticated && <Route path="/marketplace" component={Marketplace} />}
      {isAuthenticated && <Route path="/templates" component={Templates} />}
      {isAuthenticated && <Route path="/history" component={History} />}
      {isAuthenticated && <Route path="/settings" component={Settings} />}
      {isAuthenticated && <Route path="/api-keys" component={ApiKeys} />}
      {isAuthenticated && <Route path="/workspaces" component={Workspaces} />}
      {isAuthenticated && <Route path="/workflows" component={Workflows} />}
      {isAuthenticated && <Route path="/webhooks" component={Webhooks} />}
      {isAuthenticated && <Route path="/integrations" component={Integrations} />}
      {isAuthenticated && <Route path="/fine-tuning" component={FineTuning} />}
      {isAuthenticated && <Route path="/documentation" component={Documentation} />}
      {isAuthenticated && <Route path="/admin" component={Admin} />}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthenticatedLayout style={style}>
            <Router />
          </AuthenticatedLayout>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AuthenticatedLayout({ style, children }: { style: any; children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-background/80 sticky top-0 z-50 border-b border-border/30">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="text-muted-foreground hover:text-foreground" />
              <div className="h-4 w-px bg-border/50" />
              <span className="text-xs font-mono text-muted-foreground/60 tracking-wider">v2.0.1</span>
            </div>
            <div className="flex items-center gap-3">
              <UserMenu />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <div className="container max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 py-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default App;
