import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAIModelSchema, insertConversationSchema, updateUserProfileSchema, type Message } from "@shared/schema";
import OpenAI from "openai";
import { isAuthenticated, isAdmin } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // req.user already contains the user without password
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate request body with Zod
      const validatedData = updateUserProfileSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(userId, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response for security
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error updating user:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // AI Model Routes (all protected)
  
  // Get all AI models for the authenticated user
  app.get("/api/models", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const models = await storage.getAllAIModels(userId);
      res.json(models);
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ error: "Failed to fetch models" });
    }
  });

  // Get single AI model
  app.get("/api/models/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const model = await storage.getAIModel(userId, req.params.id);
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
  app.post("/api/models", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertAIModelSchema.parse(req.body);
      const model = await storage.createAIModel(userId, validatedData);
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
  app.patch("/api/models/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const model = await storage.updateAIModel(userId, req.params.id, req.body);
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
  app.delete("/api/models/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteAIModel(userId, req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting model:", error);
      res.status(500).json({ error: "Failed to delete model" });
    }
  });

  // Conversation Routes (all protected)
  
  // Get all conversations for the authenticated user
  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getAllConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation
  app.get("/api/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversation = await storage.getConversation(userId, req.params.id);
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
  app.post("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(userId, validatedData);
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
  app.patch("/api/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversation = await storage.updateConversation(userId, req.params.id, req.body);
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
  app.delete("/api/conversations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteConversation(userId, req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Chat endpoint with streaming (protected)
  app.post("/api/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { modelId, message, conversationId } = req.body;

      if (!modelId || !message) {
        return res.status(400).json({ error: "Model ID and message are required" });
      }

      // Get API key from header or use environment variable as fallback
      const userApiKey = req.headers['x-openai-api-key'] as string;
      const apiKeyToUse = userApiKey || process.env.OPENAI_API_KEY;

      if (!apiKeyToUse) {
        return res.status(400).json({ 
          error: "OpenAI API key is required. Please configure your API key in Settings." 
        });
      }

      // Create OpenAI client with user's API key or fallback to environment
      const openaiClient = new OpenAI({
        apiKey: apiKeyToUse,
      });

      // Get the AI model configuration (scoped to user)
      const model = await storage.getAIModel(userId, modelId);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }

      // Get existing conversation or prepare for new one (scoped to user)
      let conversation = conversationId
        ? await storage.getConversation(userId, conversationId)
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
      const stream = await openaiClient.chat.completions.create({
        model: model.model,
        messages: openaiMessages,
        temperature: model.temperature / 100,
        max_tokens: model.maxTokens,
        stream: true,
        stream_options: { include_usage: true },
      });

      let fullResponse = "";
      let usageData: any = null;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
        // Capture usage data from the final chunk
        if (chunk.usage) {
          usageData = chunk.usage;
        }
      }

      // Add assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: fullResponse,
        timestamp: new Date().toISOString(),
      };
      messages.push(assistantMessage);

      // Save or update conversation (scoped to user)
      let savedConversation;
      if (conversation) {
        savedConversation = await storage.updateConversation(userId, conversation.id, {
          messages: messages as any,
        });
      } else {
        // Create new conversation with a generated title
        const title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
        savedConversation = await storage.createConversation(userId, {
          modelId: model.id,
          title,
          messages: messages as any,
        });
      }

      // Log token usage for analytics
      if (usageData) {
        await storage.logUsage({
          userId,
          modelId: model.id,
          conversationId: savedConversation?.id,
          promptTokens: usageData.prompt_tokens || 0,
          completionTokens: usageData.completion_tokens || 0,
          totalTokens: usageData.total_tokens || 0,
          model: model.model,
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

  // Admin Routes (protected by isAdmin middleware)
  app.get('/api/admin/stats', isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      
      // Remove passwords from recent users
      const sanitizedStats = {
        ...stats,
        recentUsers: stats.recentUsers.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }),
      };
      
      res.json(sanitizedStats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });

  app.get('/api/admin/users', isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from user data
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:userId/admin-status', isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { isAdmin: newAdminStatus } = req.body;

      // Validate the admin status is 0 or 1
      if (newAdminStatus !== 0 && newAdminStatus !== 1) {
        return res.status(400).json({ message: "Invalid admin status. Must be 0 or 1" });
      }

      // Prevent user from removing their own admin status
      if (userId === req.user.id && newAdminStatus === 0) {
        return res.status(400).json({ message: "You cannot remove your own admin privileges" });
      }

      const updatedUser = await storage.updateUserAdminStatus(userId, newAdminStatus);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating admin status:", error);
      res.status(500).json({ message: "Failed to update admin status" });
    }
  });

  app.get('/api/admin/users/:userId/conversations', isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;

      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all conversations for this user
      const conversations = await storage.getAllConversations(userId);
      
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching user conversations:", error);
      res.status(500).json({ message: "Failed to fetch user conversations" });
    }
  });

  // Analytics API endpoints
  app.get('/api/analytics/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days as string) || 30;
      
      const stats = await storage.getUserUsageStats(userId, days);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ message: "Failed to fetch usage statistics" });
    }
  });

  app.get('/api/analytics/models/:modelId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { modelId } = req.params;
      
      const stats = await storage.getModelUsageStats(userId, modelId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching model stats:", error);
      res.status(500).json({ message: "Failed to fetch model statistics" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
