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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
            AI
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold">AI Platform</span>
            <span className="text-sm text-muted-foreground">Business Edition</span>
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
              className="w-full justify-start gap-2 py-6 text-base rounded-xl" 
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
          © 2024 AI Platform
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
