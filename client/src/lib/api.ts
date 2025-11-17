import { type AIModel, type Conversation, type Message } from "@shared/schema";

export async function createModel(data: {
  name: string;
  description?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  template?: string;
  isPublic?: number;
  category?: string;
  tags?: string[];
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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = sessionStorage.getItem("openai_api_key");
  if (apiKey) {
    headers["x-openai-api-key"] = apiKey;
  }

  const response = await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({ modelId, message, conversationId }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to start chat";
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If parsing fails, use default error message
    }
    throw new Error(errorMessage);
  }
  
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

export async function generateImage(
  modelId: string,
  prompt: string,
  conversationId?: string
): Promise<{ imageUrl: string; imageType: string; conversationId?: string }> {
  const response = await fetch("/api/chat/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelId, prompt, conversationId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate image");
  }

  return response.json();
}

export async function analyzeImage(
  modelId: string,
  imageData: string,
  prompt?: string,
  conversationId?: string
): Promise<{ analysis: string; conversationId?: string }> {
  const response = await fetch("/api/chat/analyze-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelId, imageData, prompt, conversationId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze image");
  }

  return response.json();
}

export async function executeCode(
  code: string,
  language: "python" | "javascript"
): Promise<{ output: string; error?: string; executionTime: number }> {
  const response = await fetch("/api/execute-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to execute code");
  }

  return response.json();
}

// Conversation Branching APIs
export async function createConversationBranch(
  conversationId: string,
  parentMessageId: string,
  branchName?: string,
  initialMessage?: any
) {
  const response = await fetch(`/api/conversations/${conversationId}/branches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parentMessageId, branchName, initialMessage }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create branch");
  }
  return response.json();
}

export async function getConversationBranches(conversationId: string) {
  const response = await fetch(`/api/conversations/${conversationId}/branches`);
  if (!response.ok) throw new Error("Failed to get branches");
  return response.json();
}

export async function switchConversationBranch(conversationId: string, branchId: string | null) {
  const response = await fetch(`/api/conversations/${conversationId}/switch-branch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branchId }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to switch branch");
  }
  return response.json();
}

// Prompt Template APIs
export async function getPromptTemplates() {
  const response = await fetch("/api/prompt-templates");
  if (!response.ok) throw new Error("Failed to get templates");
  return response.json();
}

export async function getPublicPromptTemplates(category?: string) {
  const url = category 
    ? `/api/prompt-templates/public?category=${encodeURIComponent(category)}`
    : "/api/prompt-templates/public";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to get public templates");
  return response.json();
}

export async function createPromptTemplate(data: any) {
  const response = await fetch("/api/prompt-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create template");
  }
  return response.json();
}

export async function usePromptTemplate(templateId: string) {
  const response = await fetch(`/api/prompt-templates/${templateId}/use`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to use template");
  return response.json();
}

// Workflow APIs
export async function runWorkflow(workflowId: string, input?: any) {
  const response = await fetch(`/api/workflows/${workflowId}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to run workflow");
  }
  return response.json();
}
