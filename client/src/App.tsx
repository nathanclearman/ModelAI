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

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/models" component={Models} />
      <Route path="/chat/:modelId/:conversationId?" component={Chat} />
      <Route path="/upload" component={UploadModel} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/templates" component={Templates} />
      <Route path="/history" component={History} />
      <Route path="/settings" component={Settings} />
      <Route path="/api-keys" component={ApiKeys} />
      <Route path="/workspaces" component={Workspaces} />
      <Route path="/admin" component={Admin} />
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
          <header className="flex items-center justify-between px-8 py-6 backdrop-blur-xl bg-background/95 sticky top-0 z-50 border-b border-border/40 shadow-sm">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <UserMenu />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-background/95">
            <div className="container max-w-7xl mx-auto px-8 md:px-12 lg:px-16 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default App;
