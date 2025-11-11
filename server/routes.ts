import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAIModelSchema, insertConversationSchema, type Message } from "@shared/schema";
import OpenAI from "openai";

// Using OpenAI's API with user's API key (supports fine-tuned models)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Model Routes
  
  // Get all AI models
  app.get("/api/models", async (req, res) => {
    try {
      const models = await storage.getAllAIModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ error: "Failed to fetch models" });
    }
  });

  // Get single AI model
  app.get("/api/models/:id", async (req, res) => {
    try {
      const model = await storage.getAIModel(req.params.id);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      console.error("Error fetching model:", error);
      res.status(500).json({ error: "Failed to fetch model" });
    }
  });

  // Create new AI model
  app.post("/api/models", async (req, res) => {
    try {
      const validatedData = insertAIModelSchema.parse(req.body);
      const model = await storage.createAIModel(validatedData);
      res.status(201).json(model);
    } catch (error: any) {
      console.error("Error creating model:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid model data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create model" });
    }
  });

  // Update AI model
  app.patch("/api/models/:id", async (req, res) => {
    try {
      const model = await storage.updateAIModel(req.params.id, req.body);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      console.error("Error updating model:", error);
      res.status(500).json({ error: "Failed to update model" });
    }
  });

  // Delete AI model
  app.delete("/api/models/:id", async (req, res) => {
    try {
      const success = await storage.deleteAIModel(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting model:", error);
      res.status(500).json({ error: "Failed to delete model" });
    }
  });

  // Conversation Routes
  
  // Get all conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid conversation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Update conversation (add messages)
  app.patch("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.updateConversation(req.params.id, req.body);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const success = await storage.deleteConversation(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Chat endpoint with streaming
  app.post("/api/chat", async (req, res) => {
    try {
      const { modelId, message, conversationId } = req.body;

      if (!modelId || !message) {
        return res.status(400).json({ error: "Model ID and message are required" });
      }

      // Get the AI model configuration
      const model = await storage.getAIModel(modelId);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }

      // Get existing conversation or prepare for new one
      let conversation = conversationId
        ? await storage.getConversation(conversationId)
        : null;

      const messages = conversation?.messages as Message[] || [];

      // Add user message
      const userMessage: Message = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };
      messages.push(userMessage);

      // Prepare messages for OpenAI
      const openaiMessages: any[] = [
        {
          role: "system",
          content: model.systemPrompt,
        },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ];

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const stream = await openai.chat.completions.create({
        model: model.model,
        messages: openaiMessages,
        temperature: model.temperature / 100,
        max_tokens: model.maxTokens,
        stream: true,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Add assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: fullResponse,
        timestamp: new Date().toISOString(),
      };
      messages.push(assistantMessage);

      // Save or update conversation
      let savedConversation;
      if (conversation) {
        savedConversation = await storage.updateConversation(conversation.id, {
          messages: messages as any,
        });
      } else {
        // Create new conversation with a generated title
        const title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
        savedConversation = await storage.createConversation({
          modelId: model.id,
          title,
          messages: messages as any,
        });
      }

      // Send final event with conversation ID
      res.write(
        `data: ${JSON.stringify({ done: true, conversationId: savedConversation?.id })}\n\n`
      );
      res.end();
    } catch (error: any) {
      console.error("Error in chat:", error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
