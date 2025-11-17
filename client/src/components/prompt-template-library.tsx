import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Sparkles, Star, Plus, Search } from "lucide-react";
import { getPromptTemplates, getPublicPromptTemplates, createPromptTemplate, usePromptTemplate } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PromptTemplateLibraryProps {
  onSelectTemplate?: (template: { prompt: string; variables?: any }) => void;
}

export function PromptTemplateLibrary({ onSelectTemplate }: PromptTemplateLibraryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userTemplates = [] } = useQuery({
    queryKey: ["/api/prompt-templates"],
    enabled: isOpen,
  });

  const { data: publicTemplates = [] } = useQuery({
    queryKey: ["/api/prompt-templates/public", selectedCategory],
    enabled: isOpen,
    queryFn: () => getPublicPromptTemplates(selectedCategory === "all" ? undefined : selectedCategory),
  });

  const createMutation = useMutation({
    mutationFn: createPromptTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates"] });
      toast({
        title: "Success",
        description: "Template created successfully",
      });
      setShowCreateForm(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const useTemplateMutation = useMutation({
    mutationFn: usePromptTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompt-templates/public"] });
    },
  });

  const handleSelectTemplate = async (template: any) => {
    await useTemplateMutation.mutateAsync(template.id);
    onSelectTemplate?.(template);
    setIsOpen(false);
  };

  const allTemplates = Array.isArray(userTemplates) ? userTemplates : [];
  const allPublicTemplates = Array.isArray(publicTemplates) ? publicTemplates : [];
  const filteredTemplates = [...allTemplates, ...allPublicTemplates].filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ["all", "coding", "writing", "analysis", "creative", "business"];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Prompt Template Library</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateForm(!showCreateForm)} variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {showCreateForm && (
            <CreateTemplateForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        {template.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">
                              {template.rating} ({template.ratingCount})
                            </span>
                          </div>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2">{template.prompt}</p>
                      {template.category && (
                        <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                          {template.category}
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="ml-2">
                      Use
                    </Button>
                  </div>
                </Card>
              ))}
              {filteredTemplates.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No templates found. Create one to get started!
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateTemplateForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    prompt: "",
    isPublic: false,
  });

  const handleSubmit = () => {
    // Convert boolean to integer for database
    const submitData = {
      ...formData,
      isPublic: formData.isPublic ? 1 : 0,
      isFavorite: 0, // Default to not favorite
    };
    onSubmit(submitData);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label>Template Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Code Review Assistant"
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description..."
        />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="coding">Coding</SelectItem>
            <SelectItem value="writing">Writing</SelectItem>
            <SelectItem value="analysis">Analysis</SelectItem>
            <SelectItem value="creative">Creative</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Prompt Template</Label>
        <Textarea
          value={formData.prompt}
          onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
          placeholder="Enter your prompt template. Use {{variable}} for variables."
          rows={4}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={formData.isPublic}
          onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
          className="h-4 w-4"
        />
        <Label htmlFor="isPublic" className="text-sm cursor-pointer">
          Make this template public
        </Label>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={!formData.name || !formData.prompt}>
          Create
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

