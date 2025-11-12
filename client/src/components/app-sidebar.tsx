import { Home, Sparkles, History, Settings, Plus, Upload } from "lucide-react";
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
    icon: Sparkles,
  },
  {
    title: "Upload Model",
    url: "/upload",
    icon: Upload,
  },
  {
    title: "Templates",
    url: "/templates",
    icon: Sparkles,
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-xl shadow-lg">
            AI
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">ModelAI</span>
            <span className="text-sm text-muted-foreground">Powered by AI</span>
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
              className="w-full justify-start gap-2 py-6 text-base rounded-xl bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20 transition-all duration-300" 
              onClick={() => setLocation("/chat/new")}
              data-testid="button-create-model"
            >
              <Plus className="h-5 w-5" />
              Create New Model
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-6">
        <div className="text-sm text-muted-foreground">
          © 2025 ModelAI. All rights reserved.
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
