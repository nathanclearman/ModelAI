import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChatInterface } from "@/components/chat-interface";
import { ModelConfigPanel, type ModelConfig } from "@/components/model-config-panel";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { streamChat, createModel, updateModel } from "@/lib/api";
import { type AIModel, type Message } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Chat() {
  const [, params] = useRoute("/chat/:modelId/:conversationId?");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const modelId = params?.modelId;
  const urlConversationId = params?.conversationId;
  const [conversationId, setConversationId] = useState<string | undefined>(urlConversationId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const { data: model, isLoading } = useQuery<AIModel>({
    queryKey: ["/api/models", modelId],
    enabled: !!modelId && modelId !== "new",
  });

  const { data: conversation } = useQuery<{
    id: string;
    modelId: string;
    title: string;
    messages: any;
    createdAt: Date;
    updatedAt: Date;
  }>({
    queryKey: ["/api/conversations", conversationId],
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (urlConversationId && urlConversationId !== conversationId) {
      setConversationId(urlConversationId);
    }
  }, [urlConversationId]);

  useEffect(() => {
    if (conversation?.messages) {
      setMessages(conversation.messages as Message[]);
    }
  }, [conversation]);

  const handleSendMessage = async (message: string) => {
    if (!modelId || !message.trim() || isStreaming) return;

    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    let assistantContent = "";
    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      for await (const chunk of streamChat(modelId, message, conversationId)) {
        if (chunk.error) {
          toast({
            title: "Error",
            description: chunk.error,
            variant: "destructive",
          });
          setMessages((prev) => prev.slice(0, -1));
          break;
        }

        if (chunk.content) {
          assistantContent += chunk.content;
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...assistantMessage,
              content: assistantContent,
            };
            return newMessages;
          });
        }

        if (chunk.done && chunk.conversationId) {
          setConversationId(chunk.conversationId);
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  };

  const saveModelMutation = useMutation({
    mutationFn: async (config: ModelConfig) => {
      if (modelId && modelId !== "new") {
        return updateModel(modelId, {
          name: config.name,
          systemPrompt: config.systemPrompt,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        });
      } else {
        return createModel({
          name: config.name,
          description: "",
          systemPrompt: config.systemPrompt,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      toast({
        title: "Success",
        description: "Model configuration saved",
      });
      if (modelId === "new") {
        setLocation(`/chat/${data.id}`);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save model configuration",
        variant: "destructive",
      });
    },
  });

  if (isLoading && modelId !== "new") {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            {model?.name || "New Model"}
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            {model?.description || "Configure your AI assistant"}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-[600px]">
          <ChatInterface
            modelName={model?.name || "AI Assistant"}
            initialMessages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isStreaming}
          />
        </div>
        <ModelConfigPanel
          initialConfig={
            model
              ? {
                  name: model.name,
                  model: model.model,
                  temperature: model.temperature,
                  maxTokens: model.maxTokens,
                  systemPrompt: model.systemPrompt,
                }
              : {
                  name: "",
                  model: "gpt-4o",
                  temperature: 70,
                  maxTokens: 1000,
                  systemPrompt: "",
                }
          }
          onSave={(config) => saveModelMutation.mutate(config)}
        />
      </div>
    </div>
  );
}
