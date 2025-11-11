import { type Conversation, type AIModel } from "@shared/schema";

export interface ExportedConversation {
  id: string;
  title: string;
  modelName: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
  exportDate: string;
  messages: {
    role: string;
    content: string;
    timestamp: string;
  }[];
}

export function exportConversations(
  conversations: Conversation[],
  models: AIModel[]
): void {
  const getModelName = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    return model?.name || "Unknown Model";
  };

  const exportDate = new Date().toISOString();

  // Convert each conversation to JSONL format (one JSON object per line)
  const jsonlLines = conversations.map((conv) => {
    const exportedConv: ExportedConversation = {
      id: conv.id,
      title: conv.title,
      modelName: getModelName(conv.modelId),
      modelId: conv.modelId,
      createdAt: new Date(conv.createdAt).toISOString(),
      updatedAt: new Date(conv.updatedAt).toISOString(),
      exportDate,
      messages: ((conv.messages as any[]) || []).map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).toISOString(),
      })),
    };
    return JSON.stringify(exportedConv);
  });

  const jsonlContent = jsonlLines.join("\n");
  const blob = new Blob([jsonlContent], { type: "application/x-ndjson" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  const filename =
    conversations.length === 1
      ? `conversation-${conversations[0].title.slice(0, 30).replace(/[^a-z0-9]/gi, "-")}-${new Date().toISOString().split("T")[0]}.jsonl`
      : `conversations-export-${new Date().toISOString().split("T")[0]}.jsonl`;
  
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
