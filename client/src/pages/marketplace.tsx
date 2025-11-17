import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, Copy, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type AIModel } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type MarketplaceModel = AIModel & { creatorName: string };

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: models = [] } = useQuery<MarketplaceModel[]>({
    queryKey: ["/api/marketplace/models"],
  });

  const cloneModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      const response = await fetch(`/api/marketplace/models/${modelId}/clone`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to clone model");
      }
      return await response.json();
    },
    onSuccess: (data: AIModel) => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({
        title: "Success",
        description: "Model cloned to your collection",
      });
      setLocation(`/chat/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clone model",
        variant: "destructive",
      });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ modelId, isLiked }: { modelId: string; isLiked: boolean }) => {
      const method = isLiked ? "DELETE" : "POST";
      const response = await fetch(`/api/marketplace/models/${modelId}/like`, {
        method,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/models"] });
    },
  });

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (model.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by likes and usage
  const sortedModels = [...filteredModels].sort((a, b) => {
    const scoreA = (a.likesCount || 0) * 2 + (a.usageCount || 0);
    const scoreB = (b.likesCount || 0) * 2 + (b.usageCount || 0);
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-12">
      <div className="py-12">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">
          ModelAI Marketplace
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Discover and clone ModelAI models shared by the community
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-marketplace"
          />
        </div>
      </div>

      {sortedModels.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {models.length === 0 ? "No public models yet" : "No models found"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {models.length === 0
              ? "Be the first to share a model with the community"
              : "Try adjusting your search query"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedModels.map((model) => (
            <Card key={model.id} className="hover-elevate transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <h4 className="font-semibold text-lg truncate" data-testid={`text-model-name-${model.id}`}>
                        {model.name}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      by {model.creatorName}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {model.description || "No description"}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <Badge variant="secondary" className="text-xs">
                        {model.model}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Temp: {model.temperature / 100}
                      </Badge>
                      {model.category && (
                        <Badge variant="outline" className="text-xs">
                          {model.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        <span>{model.likesCount || 0} likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{model.usageCount || 0} uses</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => cloneModelMutation.mutate(model.id)}
                    disabled={cloneModelMutation.isPending}
                    data-testid={`button-clone-${model.id}`}
                  >
                    <Copy className="h-4 w-4" />
                    Clone Model
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleLikeMutation.mutate({ 
                      modelId: model.id, 
                      isLiked: false // We'll implement proper like state tracking later
                    })}
                    data-testid={`button-like-${model.id}`}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
