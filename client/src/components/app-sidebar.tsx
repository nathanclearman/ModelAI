import { Home, Layers, History, Settings, Plus, Upload, BookTemplate, Zap } from "lucide-react";
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
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-primary/20 rotate-6"></div>
            <div className="relative rounded-lg bg-primary p-1.5">
              <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight">ModelHub</span>
            <span className="text-xs text-muted-foreground">AI Platform</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} className="py-3">
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <item.icon className="h-5 w-5" />
                      <span className="text-base">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator className="my-6" />
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm">Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <Button 
              variant="default"
              className="w-full justify-start gap-2 py-6 text-base rounded-lg" 
              onClick={() => setLocation("/chat/new")}
              data-testid="button-create-model"
            >
              <Plus className="h-5 w-5" />
              New Model
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6">
        <div className="text-xs text-muted-foreground/60">
          © 2025 ModelHub
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
