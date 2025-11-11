import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/stats-card";
import { ConversationCard } from "@/components/conversation-card";
import { TemplateCard } from "@/components/template-card";
import { Sparkles, MessageSquare, TrendingUp, Plus, Headphones, FileText, Code, BarChart3, Users, Briefcase } from "lucide-react";
import { Link } from "wouter";

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

const recentConversations = [
  {
    title: "Product inquiry discussion",
    modelName: "GPT-4o",
    timestamp: "2 hours ago",
    preview: "Customer asking about product specifications and pricing...",
    messageCount: 12,
  },
  {
    title: "Technical support case",
    modelName: "GPT-4.1",
    timestamp: "5 hours ago",
    preview: "Troubleshooting API integration issues with customer...",
    messageCount: 8,
  },
  {
    title: "Content review session",
    modelName: "GPT-5",
    timestamp: "Yesterday",
    preview: "Reviewing and refining marketing copy for new campaign...",
    messageCount: 15,
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your AI models and monitor their performance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Active Models"
          value={12}
          description="Currently deployed"
          icon={Sparkles}
          trend={{ value: 20, isPositive: true }}
        />
        <StatsCard
          title="Total Conversations"
          value="1,247"
          description="This month"
          icon={MessageSquare}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="API Usage"
          value="98.2%"
          description="Uptime this month"
          icon={TrendingUp}
          trend={{ value: 2, isPositive: true }}
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
          {recentConversations.map((conversation, index) => (
            <ConversationCard
              key={index}
              {...conversation}
              onClick={() => console.log("Open conversation:", conversation.title)}
              onDelete={() => console.log("Delete conversation:", conversation.title)}
            />
          ))}
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

      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Create Your Custom Model</h3>
              <p className="text-sm text-muted-foreground max-w-xl">
                Build a custom AI assistant tailored to your specific business needs with advanced configuration options
              </p>
            </div>
            <Button size="lg" className="gap-2" data-testid="button-create-custom">
              <Plus className="h-5 w-5" />
              Create Model
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
