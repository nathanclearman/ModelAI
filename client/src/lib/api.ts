import { type AIModel, type Conversation, type Message } from "@shared/schema";

export async function createModel(data: {
  name: string;
  description?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  template?: string;
}): Promise<AIModel> {
  const response = await fetch("/api/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create model");
  return response.json();
}

export async function updateModel(id: string, data: Partial<AIModel>): Promise<AIModel> {
  const response = await fetch(`/api/models/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update model");
  return response.json();
}

export async function deleteModel(id: string): Promise<void> {
  const response = await fetch(`/api/models/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete model");
}

export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`/api/conversations/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete conversation");
}

export async function* streamChat(
  modelId: string,
  message: string,
  conversationId?: string
): AsyncGenerator<{ content?: string; done?: boolean; conversationId?: string; error?: string }> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelId, message, conversationId }),
  });

  if (!response.ok) throw new Error("Failed to start chat");
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = JSON.parse(line.slice(6));
        yield data;
      }
    }
  }
}
