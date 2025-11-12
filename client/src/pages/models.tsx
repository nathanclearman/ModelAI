import { ModelCard } from "@/components/model-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type AIModel, type Conversation } from "@shared/schema";
import { deleteModel } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Models() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: models = [] } = useQuery<AIModel[]>({
    queryKey: ["/api/models"],
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const getConversationCount = (modelId: string) => {
    return conversations.filter((c) => c.modelId === modelId).length;
  };

  const handleDeleteModel = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will not delete associated conversations.`)) {
      return;
    }

    try {
      await deleteModel(id);
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({
        title: "Success",
        description: "Model deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete model",
        variant: "destructive",
      });
    }
  };

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (model.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="relative py-16 px-8 -mx-8 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-40"></div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <span>{models.length} Model{models.length !== 1 ? "s" : ""}</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">My AI Models</h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Manage your custom AI assistants and start new conversations
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
            data-testid="input-search-models"
          />
        </div>
        <Button
          size="lg"
          className="gap-2 rounded-xl"
          onClick={() => setLocation("/chat/new")}
          data-testid="button-create-new-model"
        >
          <Plus className="h-5 w-5" />
          Create New Model
        </Button>
      </div>

      {filteredModels.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {models.length === 0 ? "No models yet" : "No models found"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {models.length === 0
              ? "Create your first AI model to get started"
              : "Try adjusting your search query"}
          </p>
          {models.length === 0 && (
            <Button
              size="lg"
              className="gap-2 rounded-xl"
              onClick={() => setLocation("/chat/new")}
              data-testid="button-create-first-model"
            >
              <Plus className="h-5 w-5" />
              Create Your First Model
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredModels.map((model) => (
            <ModelCard
              key={model.id}
              name={model.name}
              description={model.description || "No description"}
              model={model.model}
              temperature={model.temperature}
              conversationCount={getConversationCount(model.id)}
              onStartChat={() => setLocation(`/chat/${model.id}`)}
              onEdit={() => setLocation(`/chat/${model.id}`)}
              onDelete={() => handleDeleteModel(model.id, model.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
