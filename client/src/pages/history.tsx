import { ConversationCard } from "@/components/conversation-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type AIModel, type Conversation } from "@shared/schema";
import { deleteConversation } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModel, setFilterModel] = useState("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: models = [] } = useQuery<AIModel[]>({
    queryKey: ["/api/models"],
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

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

  const filteredConversations = conversations.filter((conv) => {
    const messages = (conv.messages as any[]) || [];
    const preview = messages.find((m) => m.role === "user")?.content || "";
    
    const matchesSearch =
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preview.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesModel = filterModel === "all" || conv.modelId === filterModel;
    return matchesSearch && matchesModel;
  });

  return (
    <div className="space-y-16">
      <div className="py-12">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">Conversation History</h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          View and manage your past AI conversations
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-conversations"
          />
        </div>
        <Select value={filterModel} onValueChange={setFilterModel}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-filter-model">
            <SelectValue placeholder="Filter by model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredConversations.map((conversation) => {
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
        })}
      </div>

      {filteredConversations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {conversations.length === 0 
              ? "No conversations yet. Create a model and start chatting!"
              : "No conversations found matching your criteria"}
          </p>
        </div>
      )}
    </div>
  );
}
