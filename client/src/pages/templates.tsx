import { TemplateCard } from "@/components/template-card";
import { Input } from "@/components/ui/input";
import { Search, Headphones, FileText, Code, BarChart3, Users, Briefcase } from "lucide-react";
import { useState } from "react";

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

  const filteredTemplates = allTemplates.filter((template) =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">AI Model Templates</h1>
        <p className="text-muted-foreground">
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
            onUse={() => console.log("Use template:", template.title)}
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
