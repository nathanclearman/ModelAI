import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/stats-card";
import { ConversationCard } from "@/components/conversation-card";
import { TemplateCard } from "@/components/template-card";
import { UsageWidget } from "@/components/usage-widget";
import { Layers, MessageSquare, Activity, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type AIModel, type Conversation } from "@shared/schema";
import { deleteConversation } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { templates } from "@/lib/templates";
import { useTemplateCreation } from "@/hooks/use-template-creation";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createTemplateMutation = useTemplateCreation();

  const { data: models = [] } = useQuery<AIModel[]>({
    queryKey: ["/api/models"],
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const recentConversations = conversations.slice(0, 3);

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Success",
        description: "Conversation deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const getModelName = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    return model?.name || "Unknown Model";
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="space-y-16">
      {/* Full-bleed hero */}
      <div className="relative -mx-8 px-8 py-14 rounded-2xl overflow-hidden border border-border/50">
        <div className="absolute inset-0 bg-radial-aurora" />
        <div className="absolute inset-0 bg-grid-faint" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-sm font-medium mb-6">
            <span>Welcome back</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Your ModelAI Control Center</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Build, monitor, and scale your AI assistants with ModelAI's real‑time usage tracking and powerful templates.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Active Models"
          value={models.length}
          description="Currently configured"
          icon={Layers}
        />
        <StatsCard
          title="Total Conversations"
          value={conversations.length}
          description="All time"
          icon={MessageSquare}
        />
        <StatsCard
          title="Recent Activity"
          value={recentConversations.length}
          description="Latest interactions"
          icon={Activity}
        />
      </div>

      <UsageWidget />

      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription> </CardDescription>
          </div>
          <Link href="/history">
            <Button variant="outline" size="sm" className="border-secondary-border" data-testid="button-view-all">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentConversations.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No conversations yet. Create a model and start chatting!
            </p>
          ) : (
            recentConversations.map((conversation) => {
              const messages = (conversation.messages as any[]) || [];
              const preview = messages.find((m) => m.role === "user")?.content || "No messages";
              
              return (
                <ConversationCard
                  key={conversation.id}
                  title={conversation.title}
                  modelName={getModelName(conversation.modelId)}
                  timestamp={formatTimestamp(conversation.updatedAt)}
                  preview={preview.slice(0, 100)}
                  messageCount={messages.length}
                  onClick={() => setLocation(`/chat/${conversation.modelId}/${conversation.id}`)}
                  onDelete={() => handleDeleteConversation(conversation.id)}
                />
              );
            })
          )}
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">AI Model Templates</h2>
            <p className="text-sm text-muted-foreground">
              Quick start with pre-configured models
            </p>
          </div>
          <Link href="/templates">
            <Button variant="outline" className="border-secondary-border" data-testid="button-browse-templates">
              Browse All
            </Button>
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.slice(0, 3).map((template, index) => (
            <TemplateCard
              key={index}
              {...template}
              onUse={() => createTemplateMutation.mutate(template.title)}
            />
          ))}
        </div>
      </div>

      <Card className="glass">
        <CardContent className="p-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-semibold mb-2 tracking-tight">Build a Custom Model</h3>
              <p className="text-base text-muted-foreground max-w-2xl">
                Create an assistant tailored to your needs
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 btn-gradient"
              onClick={() => setLocation("/chat/new")}
              data-testid="button-create-custom"
            >
              <Plus className="h-5 w-5" />
              Create Model
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
