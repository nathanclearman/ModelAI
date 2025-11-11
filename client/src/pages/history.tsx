import { ConversationCard } from "@/components/conversation-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, FileDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type AIModel, type Conversation } from "@shared/schema";
import { deleteConversation } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { exportConversations } from "@/lib/export";

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModel, setFilterModel] = useState("all");
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    const validIds = new Set(conversations.map((c) => c.id));
    const newSelection = new Set(
      Array.from(selectedConversations).filter((id) => validIds.has(id))
    );
    if (newSelection.size !== selectedConversations.size) {
      setSelectedConversations(newSelection);
    }
  }, [conversations]);

  const handleToggleSelection = (conversationId: string) => {
    const newSelection = new Set(selectedConversations);
    if (newSelection.has(conversationId)) {
      newSelection.delete(conversationId);
    } else {
      newSelection.add(conversationId);
    }
    setSelectedConversations(newSelection);
  };

  const handleToggleAll = () => {
    if (selectedConversations.size === filteredConversations.length) {
      setSelectedConversations(new Set());
    } else {
      setSelectedConversations(new Set(filteredConversations.map((c) => c.id)));
    }
  };

  const handleExportSelected = () => {
    const conversationsToExport = conversations.filter((c) =>
      selectedConversations.has(c.id)
    );
    
    if (conversationsToExport.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select conversations to export",
        variant: "destructive",
      });
      return;
    }

    exportConversations(conversationsToExport, models);
    setSelectedConversations(new Set());
    toast({
      title: "Success",
      description: `Exported ${conversationsToExport.length} conversation${conversationsToExport.length > 1 ? "s" : ""}`,
    });
  };

  const handleExportSingle = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      exportConversations([conversation], models);
      toast({
        title: "Success",
        description: "Conversation exported",
      });
    }
  };

  return (
    <div className="space-y-16">
      <div className="py-12">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">Conversation History</h1>
        <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
          View and manage your past AI conversations
        </p>
      </div>

      <div className="space-y-4">
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

        {filteredConversations.length > 0 && (
          <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedConversations.size === filteredConversations.length && filteredConversations.length > 0}
                onCheckedChange={handleToggleAll}
                data-testid="checkbox-select-all"
              />
              <span className="text-sm text-muted-foreground">
                {selectedConversations.size === 0
                  ? "Select conversations to export"
                  : `${selectedConversations.size} conversation${selectedConversations.size > 1 ? "s" : ""} selected`}
              </span>
            </div>
            {selectedConversations.size > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={handleExportSelected}
                className="gap-2"
                data-testid="button-export-selected"
              >
                <Download className="h-4 w-4" />
                Export Selected
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredConversations.map((conversation) => {
          const messages = (conversation.messages as any[]) || [];
          const preview = messages.find((m) => m.role === "user")?.content || "No messages";
          const isSelected = selectedConversations.has(conversation.id);
          
          return (
            <div key={conversation.id} className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggleSelection(conversation.id)}
                data-testid={`checkbox-conversation-${conversation.id}`}
              />
              <div className="flex-1">
                <ConversationCard
                  title={conversation.title}
                  modelName={getModelName(conversation.modelId)}
                  timestamp={formatTimestamp(conversation.updatedAt)}
                  preview={preview.slice(0, 100)}
                  messageCount={messages.length}
                  onClick={() => setLocation(`/chat/${conversation.modelId}/${conversation.id}`)}
                  onDelete={() => handleDeleteConversation(conversation.id)}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleExportSingle(conversation.id)}
                data-testid={`button-export-${conversation.id}`}
                title="Export this conversation"
              >
                <FileDown className="h-5 w-5" />
              </Button>
            </div>
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
