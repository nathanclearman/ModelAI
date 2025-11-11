import { TemplateCard } from "@/components/template-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { templates } from "@/lib/templates";
import { useTemplateCreation } from "@/hooks/use-template-creation";

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState("");
  const createTemplateMutation = useTemplateCreation();

  const filteredTemplates = templates.filter((template) =>
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
