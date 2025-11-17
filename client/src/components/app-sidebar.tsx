import { Home, Layers, History, Settings, Plus, Upload, BookTemplate, Zap, Store, Key, Users, Brain, Webhook, Plug, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "My Models",
    url: "/models",
    icon: Layers,
  },
  {
    title: "Marketplace",
    url: "/marketplace",
    icon: Store,
  },
  {
    title: "Workspaces",
    url: "/workspaces",
    icon: Users,
  },
  {
    title: "Workflows",
    url: "/workflows",
    icon: Zap,
  },
  {
    title: "Webhooks",
    url: "/webhooks",
    icon: Webhook,
  },
  {
    title: "Integrations",
    url: "/integrations",
    icon: Plug,
  },
  {
    title: "Fine-Tuning",
    url: "/fine-tuning",
    icon: Brain,
  },
  {
    title: "API Keys",
    url: "/api-keys",
    icon: Key,
  },
  {
    title: "Upload Model",
    url: "/upload",
    icon: Upload,
  },
  {
    title: "Templates",
    url: "/templates",
    icon: BookTemplate,
  },
  {
    title: "History",
    url: "/history",
    icon: History,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Documentation",
    url: "/documentation",
    icon: BookOpen,
  },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-5 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 rounded-md bg-gradient-to-br from-violet-500/20 to-cyan-500/20 blur-sm"></div>
            <div className="relative rounded-md bg-gradient-to-br from-violet-600 to-cyan-600 p-1.5">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} fill="currentColor" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">ModelAI</span>
            <span className="text-[10px] text-muted-foreground/60 font-mono tracking-wider">[DEV MODE]</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono text-muted-foreground/50 tracking-widest uppercase mb-3">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} className="py-2.5 px-3 rounded-md hover:bg-sidebar-accent/50 transition-all group">
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={2} />
                      <span className="text-sm font-medium">{item.title}</span>
                      {location === item.url && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator className="my-4" />
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono text-muted-foreground/50 tracking-widest uppercase mb-3">Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <Button 
              variant="default"
              className="w-full justify-start gap-2.5 py-3 text-sm rounded-md bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 border-0 shadow-lg shadow-violet-500/20" 
              onClick={() => setLocation("/chat/new")}
              data-testid="button-create-model"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span className="font-semibold">New Model</span>
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-5 border-t border-border/30">
        <div className="text-[10px] font-mono text-muted-foreground/40 tracking-wider">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500/60 animate-pulse" />
            <span>SYSTEM ONLINE</span>
          </div>
          <div className="text-[9px] mt-1">© 2025 ModelAI</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
