import { type Conversation, type AIModel } from "@shared/schema";

export interface ExportData {
  exportDate: string;
  conversations: {
    id: string;
    title: string;
    modelName: string;
    modelId: string;
    createdAt: string;
    updatedAt: string;
    messages: {
      role: string;
      content: string;
      timestamp: string;
    }[];
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

  const exportData: ExportData = {
    exportDate: new Date().toISOString(),
    conversations: conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      modelName: getModelName(conv.modelId),
      modelId: conv.modelId,
      createdAt: new Date(conv.createdAt).toISOString(),
      updatedAt: new Date(conv.updatedAt).toISOString(),
      messages: ((conv.messages as any[]) || []).map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).toISOString(),
      })),
    })),
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  const filename =
    conversations.length === 1
      ? `conversation-${conversations[0].title.slice(0, 30).replace(/[^a-z0-9]/gi, "-")}-${new Date().toISOString().split("T")[0]}.json`
      : `conversations-export-${new Date().toISOString().split("T")[0]}.json`;
  
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
