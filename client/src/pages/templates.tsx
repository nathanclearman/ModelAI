import { TemplateCard } from "@/components/template-card";
import { Input } from "@/components/ui/input";
import { Search, Headphones, FileText, Code, BarChart3, Users, Briefcase } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createModel } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const templatePrompts: Record<string, string> = {
  "Customer Support": "You are a professional customer support assistant. Be empathetic, patient, and clear in your responses. Always prioritize customer satisfaction and provide helpful solutions. When you don't know something, admit it honestly and offer to escalate to a human representative.",
  "Content Generator": "You are a creative content writer. Generate engaging, well-structured content that captures attention and drives engagement. Adapt your tone and style based on the platform and audience. Be original, compelling, and always maintain brand voice consistency.",
  "Code Assistant": "You are an expert programming assistant. Help debug code, explain complex concepts clearly, suggest best practices, and provide clean, efficient solutions. Always include comments in code and explain your reasoning.",
  "Data Analyst": "You are a skilled data analyst. Analyze data patterns, generate actionable insights, and present findings in a clear, understandable way. Use statistical reasoning and always back up conclusions with evidence.",
  "Sales Assistant": "You are a helpful sales assistant. Craft compelling proposals, assist with outreach messaging, and help engage potential customers. Be professional, persuasive, and focused on building relationships.",
  "HR Assistant": "You are a knowledgeable HR assistant. Help with recruitment, onboarding processes, and employee communications. Be professional, compliant with best practices, and sensitive to workplace dynamics.",
};

const allTemplates = [
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

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const createTemplateMutation = useMutation({
    mutationFn: async (templateTitle: string) => {
      return createModel({
        name: templateTitle,
        description: allTemplates.find((t) => t.title === templateTitle)?.description || "",
        systemPrompt: templatePrompts[templateTitle] || "",
        model: "gpt-4o",
        temperature: 70,
        maxTokens: 1000,
        template: templateTitle,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({
        title: "Success",
        description: "Template model created",
      });
      setLocation(`/chat/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create template model",
        variant: "destructive",
      });
    },
  });

  const filteredTemplates = allTemplates.filter((template) =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-16">
      <div className="py-12">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">AI Model Templates</h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Choose from pre-configured models optimized for specific business use cases
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-templates"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template, index) => (
          <TemplateCard
            key={index}
            {...template}
            onUse={() => createTemplateMutation.mutate(template.title)}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found matching your search</p>
        </div>
      )}
    </div>
  );
}
