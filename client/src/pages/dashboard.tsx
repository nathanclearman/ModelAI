import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/stats-card";
import { ConversationCard } from "@/components/conversation-card";
import { TemplateCard } from "@/components/template-card";
import { Sparkles, MessageSquare, TrendingUp, Plus, Headphones, FileText, Code, BarChart3, Users, Briefcase } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type AIModel, type Conversation } from "@shared/schema";
import { deleteConversation } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const templates = [
  {
    title: "Customer Support",
    description: "AI assistant trained to handle customer inquiries with empathy and professionalism",
    icon: Headphones,
  },
  {
    title: "Content Generator",
    description: "Create engaging marketing copy, blog posts, and social media content",
    icon: FileText,
  },
  {
    title: "Code Assistant",
    description: "Debug code, explain concepts, and provide development guidance",
    icon: Code,
  },
  {
    title: "Data Analyst",
    description: "Analyze data, generate insights, and create comprehensive reports",
    icon: BarChart3,
  },
  {
    title: "Sales Assistant",
    description: "Help with sales outreach, proposal writing, and customer engagement",
    icon: Briefcase,
  },
  {
    title: "HR Assistant",
    description: "Streamline recruitment, onboarding, and employee communications",
    icon: Users,
  },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
      <div className="py-12">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">Dashboard</h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Manage your AI models and monitor their performance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Active Models"
          value={models.length}
          description="Currently configured"
          icon={Sparkles}
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
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>Your latest AI interactions</CardDescription>
          </div>
          <Link href="/history">
            <Button variant="outline" size="sm" data-testid="button-view-all">
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
            <Button variant="outline" data-testid="button-browse-templates">
              Browse All
            </Button>
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.slice(0, 3).map((template, index) => (
            <TemplateCard
              key={index}
              {...template}
              onUse={() => console.log("Use template:", template.title)}
            />
          ))}
        </div>
      </div>

      <Card className="bg-gradient-to-br from-foreground/5 via-foreground/3 to-background border-none shadow-lg">
        <CardContent className="p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h3 className="text-3xl font-semibold mb-4 tracking-tight">Create Your Custom Model</h3>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Build a custom AI assistant tailored to your specific business needs with advanced configuration options
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2 text-base px-8 py-6 rounded-xl"
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
