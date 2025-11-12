import { ModelCard } from "@/components/model-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Download } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type AIModel, type Conversation } from "@shared/schema";
import { deleteModel } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { exportModels } from "@/lib/export";

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

  const handleExportModel = (model: AIModel) => {
    exportModels([model]);
    toast({
      title: "Success",
      description: `Exported "${model.name}"`,
    });
  };

  const handleExportAllModels = () => {
    if (models.length === 0) {
      toast({
        title: "No Models",
        description: "Create models to export them",
        variant: "destructive",
      });
      return;
    }

    exportModels(models);
    toast({
      title: "Success",
      description: `Exported ${models.length} model${models.length > 1 ? "s" : ""}`,
    });
  };

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (model.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="relative py-12 px-8 -mx-8 rounded-2xl bg-muted/30 overflow-hidden border border-border/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium mb-5">
            <span>{models.length} Model{models.length !== 1 ? "s" : ""}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">My Models</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Manage your custom AI assistants and start conversations
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
            className="pl-10"
            data-testid="input-search-models"
          />
        </div>
        <div className="flex gap-2">
          {models.length > 0 && (
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={handleExportAllModels}
              data-testid="button-export-all-models"
            >
              <Download className="h-5 w-5" />
              Export All
            </Button>
          )}
          <Button
            size="lg"
            className="gap-2"
            onClick={() => setLocation("/chat/new")}
            data-testid="button-create-new-model"
          >
            <Plus className="h-5 w-5" />
            New Model
          </Button>
        </div>
      </div>

      {filteredModels.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Plus className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {models.length === 0 ? "No models yet" : "No models found"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {models.length === 0
              ? "Create your first model to get started"
              : "Try adjusting your search query"}
          </p>
          {models.length === 0 && (
            <Button
              size="lg"
              className="gap-2"
              onClick={() => setLocation("/chat/new")}
              data-testid="button-create-first-model"
            >
              <Plus className="h-5 w-5" />
              Create First Model
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
              onExport={() => handleExportModel(model)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
