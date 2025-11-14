import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAIModelSchema, insertConversationSchema, updateUserProfileSchema, insertWorkspaceSchema, insertWorkspaceMemberSchema, insertApiKeySchema, workspaceRoles, type Message } from "@shared/schema";
import OpenAI from "openai";
import { isAuthenticated, isAdmin } from "./auth";
import { generateApiKey, hashApiKey } from "./utils/apiKey";
import { calculateCost } from "./utils/costCalculator";
import { checkImagePrompt } from "./utils/contentFilter";
import { geminiService } from "./services/geminiService";
import { checkImageQuota, incrementImageUsage } from "./middleware/imageAccess";
import { imageStore } from "./services/imageStore";
import { processDocument } from "./services/documentService";
import { storeDocument, deleteDocument as deleteDocumentFile } from "./services/documentStore";
import multer from "multer";
import Stripe from "stripe";

// Initialize Stripe only if key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    })
  : null;

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

  // Email verification endpoint
  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Verification token is required" });
      }

      // Verify the email using the token
      const user = await storage.verifyEmail(token);

      if (!user) {
        return res.status(400).json({ error: "Invalid or expired verification token" });
      }

      // Log the user in after successful verification
      const { password, ...userWithoutPassword } = user;
      req.logIn(userWithoutPassword, (err) => {
        if (err) {
          return res.status(500).json({ message: "Verification succeeded but login failed. Please log in manually." });
        }
        return res.json({ 
          message: "Email verified successfully! You can now use your account.",
          user: userWithoutPassword
        });
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ error: "Email verification failed" });
    }
  });

  // Update newsletter subscription
  app.patch('/api/auth/newsletter', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { subscribed } = req.body;

      if (typeof subscribed !== 'boolean') {
        return res.status(400).json({ error: "subscribed must be a boolean" });
      }

      const updatedUser = await storage.updateNewsletterSubscription(userId, subscribed);

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      res.json({
        user: userWithoutPassword,
        message: subscribed 
          ? "Successfully subscribed to newsletter" 
          : "Successfully unsubscribed from newsletter"
      });
    } catch (error) {
      console.error("Error updating newsletter subscription:", error);
      res.status(500).json({ error: "Failed to update newsletter subscription" });
    }
  });

  // Apply coupon code
  app.post('/api/auth/apply-coupon', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { couponCode } = req.body;

      if (!couponCode || typeof couponCode !== 'string') {
        return res.status(400).json({ error: "Coupon code is required" });
      }

      const normalizedCode = couponCode.trim().toLowerCase();

      // Check if user already used a coupon
      const user = await storage.getUserById(userId);
      if (user?.couponCode) {
        return res.status(400).json({ error: "You have already redeemed a coupon code" });
      }

      // Validate coupon code
      const validCoupons: { [key: string]: { tier: string; imageQuota: number; messageQuota: number } } = {
        'christmas2024': {
          tier: 'pro',
          imageQuota: 100,
          messageQuota: 1000
        }
      };

      const coupon = validCoupons[normalizedCode];
      if (!coupon) {
        return res.status(400).json({ error: "Invalid coupon code" });
      }

      // Apply coupon - upgrade user to Pro tier
      const updatedUser = await storage.applyCoupon(userId, couponCode, coupon.tier, coupon.imageQuota, coupon.messageQuota);

      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to apply coupon" });
      }

      // Update the session with the new user data using req.login()
      const { password, ...userWithoutPassword } = updatedUser;
      
      req.logIn(userWithoutPassword, (err: any) => {
        if (err) {
          console.error("Error updating session:", err);
          return res.status(500).json({ error: "Coupon applied but session update failed" });
        }
        
        res.json({
          user: userWithoutPassword,
          message: `Coupon applied successfully! You now have ${coupon.tier} tier access.`
        });
      });
    } catch (error) {
      console.error("Error applying coupon:", error);
      res.status(500).json({ error: "Failed to apply coupon" });
    }
  });

  // Stripe checkout session
  app.post('/api/create-checkout-session', isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: "Payment system is not configured" });
      }

      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'http://localhost:5000';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Pro Tier Upgrade',
                description: 'One-time payment for Pro tier access',
              },
              unit_amount: 1000,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/settings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/settings?payment=cancelled`,
        customer_email: req.user.email,
        metadata: {
          userId: req.user.id,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session: " + error.message });
    }
  });

  // Stripe webhook endpoint
  app.post('/api/webhook/stripe', async (req: any, res) => {
    if (!stripe) {
      return res.status(503).send('Payment system is not configured');
    }

    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).send('Missing stripe-signature header');
    }

    let event;

    try {
      const rawBody = req.rawBody;
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;

      if (session.payment_status === 'paid' && session.metadata?.userId) {
        try {
          await storage.processStripePayment(
            session.id,
            session.metadata.userId,
            'pro',
            1000,
            100
          );
          console.log(`Successfully upgraded user ${session.metadata.userId} to Pro tier`);
        } catch (error: any) {
          if (error.message.includes('already processed')) {
            console.log(`Payment session ${session.id} already processed`);
          } else {
            console.error('Error processing payment:', error);
          }
        }
      }
    }

    res.json({ received: true });
  });

  // Verify Stripe payment status (read-only check with dev mode fallback)
  app.get('/api/verify-payment', isAuthenticated, async (req: any, res) => {
    try {
      const { session_id } = req.query;

      if (!session_id || typeof session_id !== 'string') {
        return res.status(400).json({ error: "Session ID is required" });
      }

      const isProcessed = await storage.isStripeSessionProcessed(session_id);

      if (isProcessed) {
        res.json({
          processed: true,
          message: "Payment processed successfully! Please refresh the page to see your upgraded account.",
        });
      } else {
        // In development, webhooks don't work, so check with Stripe directly
        if (process.env.NODE_ENV === 'development' && stripe) {
          try {
            const session = await stripe.checkout.sessions.retrieve(session_id);
            
            if (session.payment_status === 'paid' && session.metadata?.userId === req.user.id) {
              // Process the payment now since webhook won't fire in dev
              await storage.processStripePayment(
                session_id,
                req.user.id,
                'Pro',
                1000,
                100
              );
              
              res.json({
                processed: true,
                message: "Payment verified and processed! Please refresh the page to see your upgraded account.",
              });
            } else {
              res.status(202).json({ 
                processed: false,
                message: "Payment is being processed. Please wait a moment and try again.",
              });
            }
          } catch (stripeError: any) {
            console.error("Error checking Stripe session:", stripeError);
            res.status(202).json({ 
              processed: false,
              message: "Payment is being processed. Please wait a moment and try again.",
            });
          }
        } else {
          res.status(202).json({ 
            processed: false,
            message: "Payment is being processed. Please wait a moment and try again.",
          });
        }
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment: " + error.message });
    }
  });

  // AI Model Routes (all protected)
  
  // Helper function to seed default models for new users
  async function seedDefaultModels(userId: string) {
    const defaultModels = [
      {
        name: "General Assistant",
        description: "A versatile AI assistant for general tasks",
        systemPrompt: "You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and concise responses.",
        model: "gpt-4o",
        temperature: 70,
        maxTokens: 1000,
      },
      {
        name: "Code Helper",
        description: "Specialized in programming and technical questions",
        systemPrompt: "You are an expert programming assistant. Help users write, debug, and understand code. Provide clear explanations and best practices.",
        model: "gpt-4o",
        temperature: 50,
        maxTokens: 2000,
      },
      {
        name: "Creative Writer",
        description: "For creative writing and content generation",
        systemPrompt: "You are a creative writing assistant. Help users craft engaging stories, articles, and creative content with flair and imagination.",
        model: "gpt-4o",
        temperature: 90,
        maxTokens: 1500,
      },
    ];

    const createdModels = [];
    for (const modelData of defaultModels) {
      const model = await storage.createAIModel(userId, modelData);
      createdModels.push(model);
    }
    return createdModels;
  }
  
  // Get all AI models for the authenticated user
  app.get("/api/models", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let models = await storage.getAllAIModels(userId);
      
      // Auto-seed default models if user has none
      if (models.length === 0) {
        console.log(`Seeding default models for user ${userId}`);
        models = await seedDefaultModels(userId);
      }
      
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
      
      // Validate request body with Zod
      const validatedData = insertAIModelSchema.partial().parse(req.body);
      
      // Get the current model state to create a version snapshot
      const currentModel = await storage.getAIModel(userId, req.params.id);
      if (!currentModel) {
        return res.status(404).json({ error: "Model not found" });
      }

      // Create a version snapshot of the current state before updating
      // This MUST succeed before we proceed with the update to maintain audit trail
      const latestVersion = await storage.getLatestVersionNumber(req.params.id);
      const newVersionNumber = latestVersion + 1;
      
      try {
        await storage.createModelVersion({
          modelId: req.params.id,
          versionNumber: newVersionNumber,
          name: currentModel.name,
          description: currentModel.description,
          systemPrompt: currentModel.systemPrompt,
          model: currentModel.model,
          temperature: currentModel.temperature,
          maxTokens: currentModel.maxTokens,
          template: currentModel.template,
          category: currentModel.category,
          tags: currentModel.tags,
          changeDescription: req.body.changeDescription || "Model updated",
          createdBy: userId,
        });
      } catch (versionError) {
        console.error("Failed to create version snapshot:", versionError);
        return res.status(500).json({ error: "Failed to create version snapshot. Update cancelled." });
      }

      // Now update the model with validated data
      const model = await storage.updateAIModel(userId, req.params.id, validatedData);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error: any) {
      console.error("Error updating model:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid model data", details: error.errors });
      }
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

  // Toggle model favorite
  app.post("/api/models/:id/favorite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const model = await storage.toggleModelFavorite(userId, req.params.id);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      console.error("Error toggling model favorite:", error);
      res.status(500).json({ error: "Failed to toggle favorite" });
    }
  });

  // Model Version Routes

  // Get all versions for a model
  app.get("/api/models/:id/versions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // Verify user owns the model
      const model = await storage.getAIModel(userId, req.params.id);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      const versions = await storage.getModelVersions(req.params.id);
      res.json(versions);
    } catch (error) {
      console.error("Error fetching model versions:", error);
      res.status(500).json({ error: "Failed to fetch model versions" });
    }
  });

  // Get a specific version of a model
  app.get("/api/models/:id/versions/:versionNumber", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // Verify user owns the model
      const model = await storage.getAIModel(userId, req.params.id);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      const version = await storage.getModelVersion(req.params.id, parseInt(req.params.versionNumber));
      if (!version) {
        return res.status(404).json({ error: "Version not found" });
      }
      res.json(version);
    } catch (error) {
      console.error("Error fetching model version:", error);
      res.status(500).json({ error: "Failed to fetch model version" });
    }
  });

  // Restore model to a previous version
  app.post("/api/models/:id/versions/:versionNumber/restore", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const versionNumber = parseInt(req.params.versionNumber);
      
      // Verify the version exists before attempting restore
      const versionToRestore = await storage.getModelVersion(req.params.id, versionNumber);
      if (!versionToRestore) {
        return res.status(404).json({ error: "Version not found" });
      }

      // Get current model to verify ownership and capture pre-restore state
      // Note: In rare concurrent update scenarios, this snapshot might not reflect
      // the exact state at restore time. Future enhancement: Use database transactions
      // to ensure atomicity across read-snapshot-restore operations.
      const currentModel = await storage.getAIModel(userId, req.params.id);
      if (!currentModel) {
        return res.status(404).json({ error: "Model not found or access denied" });
      }

      // Create audit version snapshot of CURRENT state BEFORE restoring
      // This preserves the pre-restore configuration so it can be accessed later
      // If this fails, the restore will not proceed
      const latestVersion = await storage.getLatestVersionNumber(req.params.id);
      const newVersionNumber = latestVersion + 1;
      
      let createdVersionId: string | null = null;
      try {
        const auditVersion = await storage.createModelVersion({
          modelId: req.params.id,
          versionNumber: newVersionNumber,
          // Store CURRENT model state (what's being replaced), not the version we're restoring to
          name: currentModel.name,
          description: currentModel.description,
          systemPrompt: currentModel.systemPrompt,
          model: currentModel.model,
          temperature: currentModel.temperature,
          maxTokens: currentModel.maxTokens,
          template: currentModel.template,
          category: currentModel.category,
          tags: currentModel.tags,
          changeDescription: `Restored from version ${versionNumber}`,
          createdBy: userId,
        });
        createdVersionId = auditVersion.id;
      } catch (auditError) {
        console.error("Failed to create audit version for restore:", auditError);
        return res.status(500).json({ error: "Failed to create audit trail. Restore cancelled." });
      }
      
      // Now restore the model - audit trail is already in place
      // Wrap in try-catch to ensure cleanup happens even if restoreModelVersion throws
      let restoredModel;
      try {
        restoredModel = await storage.restoreModelVersion(userId, req.params.id, versionNumber);
      } catch (restoreError) {
        // Restore threw exception - delete the orphaned audit version
        if (createdVersionId) {
          try {
            await storage.deleteModelVersion(createdVersionId);
            console.log(`Deleted orphaned audit version ${createdVersionId} after restore exception`);
          } catch (cleanupError) {
            console.error("CRITICAL: Failed to cleanup orphaned version after restore exception:", cleanupError);
          }
        }
        console.error("Restore failed with exception:", restoreError);
        return res.status(500).json({ error: "Failed to restore model state" });
      }
      
      if (!restoredModel) {
        // Restore returned null/undefined - delete the orphaned audit version
        if (createdVersionId) {
          try {
            await storage.deleteModelVersion(createdVersionId);
            console.log(`Deleted orphaned audit version ${createdVersionId} after restore returned null`);
          } catch (cleanupError) {
            console.error("CRITICAL: Failed to cleanup orphaned version after restore failure:", cleanupError);
          }
        }
        return res.status(500).json({ error: "Failed to restore model state" });
      }

      res.json(restoredModel);
    } catch (error) {
      console.error("Error restoring model version:", error);
      res.status(500).json({ error: "Failed to restore model version" });
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

  // Image generation endpoint (available to all users with quota)
  app.post("/api/chat/generate-image", isAuthenticated, checkImageQuota, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { modelId, prompt, conversationId } = req.body;

      if (!modelId || !prompt) {
        return res.status(400).json({ error: "Model ID and prompt are required" });
      }

      // Check content filter
      const filterResult = checkImagePrompt(prompt);
      if (!filterResult.allowed) {
        return res.status(400).json({ error: filterResult.reason });
      }

      // Generate image using Gemini
      const { imageData, mimeType } = await geminiService.generateImage(prompt);
      
      // Store the image and get a public URL
      const { publicUrl } = await imageStore.store(imageData, userId, "generated", prompt);
      
      // Increment image usage for non-admin users
      const user = await storage.getUserById(userId);
      if (user && user.isAdmin !== 1) {
        await incrementImageUsage(userId);
      }

      // Create messages for conversation history
      const userMessage: Message = {
        role: "user",
        content: prompt,
        timestamp: new Date().toISOString(),
      };

      const assistantMessage: Message = {
        role: "assistant",
        content: `I've generated an image based on your prompt: "${prompt}"`,
        timestamp: new Date().toISOString(),
        imageUrl: publicUrl,
        imageType: "generated"
      };

      // Get or create conversation
      let conversation = conversationId
        ? await storage.getConversation(userId, conversationId)
        : null;

      const messages = conversation?.messages as Message[] || [];
      messages.push(userMessage);
      messages.push(assistantMessage);

      // Save conversation
      let savedConversation;
      if (conversation) {
        savedConversation = await storage.updateConversation(userId, conversation.id, {
          messages: messages as any,
        });
      } else {
        const title = prompt.slice(0, 50) + (prompt.length > 50 ? "..." : "");
        savedConversation = await storage.createConversation(userId, {
          modelId,
          title,
          messages: messages as any,
        });
      }

      res.json({
        imageUrl: publicUrl,
        imageType: "generated",
        conversationId: savedConversation?.id
      });
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  // Configure multer for document uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Allowed file types (DOCX only, not legacy DOC)
      const allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
      ];

      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}. Supported formats: PDF, DOCX, TXT, MD`));
      }
    },
  });

  // Document upload endpoint (available to all authenticated users)
  app.post("/api/documents/upload", isAuthenticated, upload.single('document'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const file = req.file;
      const { conversationId } = req.body;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Process document and extract text with error handling
      let processed;
      try {
        processed = await processDocument(file);
      } catch (error: any) {
        console.error("Document processing error:", error);
        return res.status(400).json({ 
          error: "Failed to process document. Please ensure the file is not corrupted or password-protected." 
        });
      }

      // Store the file
      const { storageKey, publicUrl } = await storeDocument(
        file.buffer,
        userId,
        file.originalname
      );

      // Save document metadata to database
      const document = await storage.createDocument(userId, {
        fileName: processed.fileName,
        fileType: processed.fileType,
        mimeType: processed.mimeType,
        storageKey,
        publicUrl,
        extractedText: processed.extractedText,
        textChunks: processed.textChunks,
        byteSize: processed.byteSize,
        conversationId: conversationId || null,
      });

      res.json({
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        byteSize: document.byteSize,
        createdAt: document.createdAt,
        textPreview: processed.extractedText.slice(0, 200),
      });
    } catch (error: any) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: error.message || "Failed to upload document" });
    }
  });

  // Get user's documents
  app.get("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const documents = await storage.getUserDocuments(userId);
      
      res.json(documents.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        byteSize: doc.byteSize,
        createdAt: doc.createdAt,
        conversationId: doc.conversationId,
      })));
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Get specific document with full content
  app.get("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const document = await storage.getDocument(userId, id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      res.json(document);
    } catch (error: any) {
      console.error("Error fetching document:", error);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const document = await storage.getDocument(userId, id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // NOTE: Delete operation is best-effort, not fully transactional.
      // In production, consider using a job queue for cleanup or database transactions.
      // Current approach: Try file deletion first, then remove DB record.
      // If file deletion fails, we still clean up the database to prevent orphaned records.
      try {
        await deleteDocumentFile(document.storageKey);
      } catch (error: any) {
        console.error("Failed to delete document file, continuing with DB cleanup:", error);
        // File might already be deleted or unreachable - don't block DB cleanup
      }

      // Delete from database
      const deleted = await storage.deleteDocument(userId, id);

      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete document" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Image analysis endpoint (available to all authenticated users)
  app.post("/api/chat/analyze-image", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { modelId, imageData, prompt, conversationId } = req.body;

      if (!modelId || !imageData) {
        return res.status(400).json({ error: "Model ID and image data are required" });
      }

      // Store the uploaded image
      const { publicUrl } = await imageStore.store(imageData, userId, "upload");

      // Analyze image using Gemini
      const { analysis } = await geminiService.analyzeImage(imageData, prompt);

      // Increment image usage for non-admin users
      const user = await storage.getUserById(userId);
      if (user && user.isAdmin !== 1) {
        await incrementImageUsage(userId);
      }

      // Create messages for conversation history
      const userMessage: Message = {
        role: "user",
        content: prompt || "Analyze this image",
        timestamp: new Date().toISOString(),
        imageUrl: publicUrl,
        imageType: "upload"
      };

      const assistantMessage: Message = {
        role: "assistant",
        content: analysis,
        timestamp: new Date().toISOString(),
      };

      // Get or create conversation
      let conversation = conversationId
        ? await storage.getConversation(userId, conversationId)
        : null;

      const messages = conversation?.messages as Message[] || [];
      messages.push(userMessage);
      messages.push(assistantMessage);

      // Save conversation
      let savedConversation;
      if (conversation) {
        savedConversation = await storage.updateConversation(userId, conversation.id, {
          messages: messages as any,
        });
      } else {
        const title = (prompt || "Image analysis").slice(0, 50);
        savedConversation = await storage.createConversation(userId, {
          modelId,
          title,
          messages: messages as any,
        });
      }

      res.json({
        analysis,
        conversationId: savedConversation?.id
      });
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ error: error.message || "Failed to analyze image" });
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

      // Check usage limits for non-admin users
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.isAdmin && user.messagesUsed >= user.messageQuota) {
        return res.status(429).json({ 
          error: "Message quota exceeded. Please contact an administrator to increase your quota.",
          quota: user.messageQuota,
          used: user.messagesUsed,
        });
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
      console.log(`[Chat] Looking up model - userId: ${userId}, modelId: ${modelId}`);
      const model = await storage.getAIModel(userId, modelId);
      if (!model) {
        console.log(`[Chat] Model not found - userId: ${userId}, modelId: ${modelId}`);
        return res.status(404).json({ error: "Model not found" });
      }
      console.log(`[Chat] Model found: ${model.name} (${model.model})`);
    

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
      // GPT-5 and newer models use max_completion_tokens instead of max_tokens
      const useMaxCompletionTokens = model.model.toLowerCase().includes('gpt-5') || 
                                      model.model.toLowerCase().includes('o1') ||
                                      model.model.toLowerCase().includes('o3');
      
      const stream = await openaiClient.chat.completions.create({
        model: model.model,
        messages: openaiMessages,
        temperature: model.temperature / 100,
        stream: true,
        stream_options: { include_usage: true },
        ...(useMaxCompletionTokens 
          ? { max_completion_tokens: model.maxTokens } 
          : { max_tokens: model.maxTokens }
        ),
      } as any);

      let fullResponse = "";
      let usageData: any = null;

      // @ts-expect-error - TypeScript incorrectly infers non-streaming type despite stream:true parameter
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

      // Log token usage for analytics with cost tracking
      if (usageData) {
        const cost = calculateCost(
          model.model,
          usageData.prompt_tokens || 0,
          usageData.completion_tokens || 0
        );
        
        await storage.logUsage({
          userId,
          modelId: model.id,
          conversationId: savedConversation?.id,
          promptTokens: usageData.prompt_tokens || 0,
          completionTokens: usageData.completion_tokens || 0,
          totalTokens: usageData.total_tokens || 0,
          model: model.model,
          costUsd: cost,
        });

        // Increment message count for non-admin users
        if (!user.isAdmin) {
          await storage.incrementUserMessages(userId);
        }
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

  app.get('/api/admin/cost-stats', isAdmin, async (req: any, res) => {
    try {
      const costStats = await storage.getUserCostStats();
      res.json(costStats);
    } catch (error) {
      console.error("Error fetching cost stats:", error);
      res.status(500).json({ message: "Failed to fetch cost statistics" });
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

  // Get newsletter subscribers count
  app.get('/api/admin/newsletter/subscribers', isAdmin, async (req: any, res) => {
    try {
      const subscribers = await storage.getNewsletterSubscribers();
      res.json({ count: subscribers.length, subscribers });
    } catch (error) {
      console.error("Error fetching newsletter subscribers:", error);
      res.status(500).json({ message: "Failed to fetch newsletter subscribers" });
    }
  });

  // Send newsletter to all subscribers
  app.post('/api/admin/newsletter/send', isAdmin, async (req: any, res) => {
    try {
      const { subject, headline, content, ctaText, ctaUrl } = req.body;

      if (!subject || !headline || !content) {
        return res.status(400).json({ error: "Subject, headline, and content are required" });
      }

      // Get all newsletter subscribers
      const subscribers = await storage.getNewsletterSubscribers();

      if (subscribers.length === 0) {
        return res.status(400).json({ error: "No subscribers found" });
      }

      // Import email service dynamically
      const { sendNewsletterToSubscribers } = await import('./email/emailService');

      // Send newsletter to all subscribers
      const results = await sendNewsletterToSubscribers(
        subscribers,
        subject,
        headline,
        content,
        ctaText,
        ctaUrl
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.json({
        message: "Newsletter sent",
        totalSubscribers: subscribers.length,
        successCount,
        failureCount,
        results,
      });
    } catch (error) {
      console.error("Error sending newsletter:", error);
      res.status(500).json({ error: "Failed to send newsletter" });
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

  // Marketplace API endpoints
  app.get('/api/marketplace/models', isAuthenticated, async (req: any, res) => {
    try {
      const models = await storage.getPublicModels();
      res.json(models);
    } catch (error) {
      console.error("Error fetching public models:", error);
      res.status(500).json({ message: "Failed to fetch marketplace models" });
    }
  });

  app.post('/api/marketplace/models/:modelId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { modelId } = req.params;
      
      const liked = await storage.likeModel(userId, modelId);
      if (liked) {
        res.json({ success: true, message: "Model liked" });
      } else {
        res.status(400).json({ message: "Model already liked" });
      }
    } catch (error) {
      console.error("Error liking model:", error);
      res.status(500).json({ message: "Failed to like model" });
    }
  });

  app.delete('/api/marketplace/models/:modelId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { modelId } = req.params;
      
      const unliked = await storage.unlikeModel(userId, modelId);
      if (unliked) {
        res.json({ success: true, message: "Model unliked" });
      } else {
        res.status(400).json({ message: "Model not liked" });
      }
    } catch (error) {
      console.error("Error unliking model:", error);
      res.status(500).json({ message: "Failed to unlike model" });
    }
  });

  app.get('/api/marketplace/models/:modelId/liked', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { modelId } = req.params;
      
      const liked = await storage.isModelLiked(userId, modelId);
      res.json({ liked });
    } catch (error) {
      console.error("Error checking if model is liked:", error);
      res.status(500).json({ message: "Failed to check like status" });
    }
  });

  app.post('/api/marketplace/models/:modelId/clone', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { modelId } = req.params;
      
      const clonedModel = await storage.cloneModel(userId, modelId);
      res.status(201).json(clonedModel);
    } catch (error: any) {
      console.error("Error cloning model:", error);
      res.status(400).json({ message: error.message || "Failed to clone model" });
    }
  });

  // API Keys routes
  app.get('/api/keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const keys = await storage.getUserApiKeys(userId);
      // Don't send the full key in list response, only last 4 chars
      const maskedKeys = keys.map(k => ({
        ...k,
        key: `...${k.key.slice(-4)}`
      }));
      res.json(maskedKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  app.post('/api/keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertApiKeySchema.parse(req.body);
      
      const { key, hashedKey } = generateApiKey();
      const apiKey = await storage.createApiKey(userId, { ...validatedData, key: hashedKey });
      
      // Return the full key ONLY this one time (it won't be stored)
      res.status(201).json({ ...apiKey, key });
    } catch (error: any) {
      console.error("Error creating API key:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to create API key" });
    }
  });

  app.delete('/api/keys/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const deleted = await storage.deleteApiKey(userId, req.params.id);
      
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "API key not found" });
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ message: "Failed to delete API key" });
    }
  });

  // Workspace routes
  app.get('/api/workspaces', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workspaces = await storage.getUserWorkspaces(userId);
      res.json(workspaces);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      res.status(500).json({ message: "Failed to fetch workspaces" });
    }
  });

  app.post('/api/workspaces', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertWorkspaceSchema.parse(req.body);
      
      const workspace = await storage.createWorkspace(userId, validatedData);
      res.status(201).json(workspace);
    } catch (error: any) {
      console.error("Error creating workspace:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to create workspace" });
    }
  });

  app.get('/api/workspaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workspace = await storage.getWorkspace(req.params.id);
      
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      // Check if user has access to this workspace
      const role = await storage.getUserWorkspaceRole(userId, workspace.id);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(workspace);
    } catch (error) {
      console.error("Error fetching workspace:", error);
      res.status(500).json({ message: "Failed to fetch workspace" });
    }
  });

  app.patch('/api/workspaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workspace = await storage.getWorkspace(req.params.id);
      
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      // Check if user is owner or admin
      const role = await storage.getUserWorkspaceRole(userId, workspace.id);
      if (role !== "owner" && role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertWorkspaceSchema.partial().parse(req.body);
      const updated = await storage.updateWorkspace(workspace.id, validatedData);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating workspace:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to update workspace" });
    }
  });

  app.delete('/api/workspaces/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workspace = await storage.getWorkspace(req.params.id);
      
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      
      // Only owner can delete
      if (workspace.ownerId !== userId) {
        return res.status(403).json({ message: "Only the owner can delete this workspace" });
      }
      
      const deleted = await storage.deleteWorkspace(workspace.id);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Workspace not found" });
      }
    } catch (error) {
      console.error("Error deleting workspace:", error);
      res.status(500).json({ message: "Failed to delete workspace" });
    }
  });

  // Workspace member routes
  app.get('/api/workspaces/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user has access to this workspace
      const role = await storage.getUserWorkspaceRole(userId, req.params.id);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const members = await storage.getWorkspaceMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching workspace members:", error);
      res.status(500).json({ message: "Failed to fetch workspace members" });
    }
  });

  app.post('/api/workspaces/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workspaceId = req.params.id;
      
      // Check if user is owner or admin
      const role = await storage.getUserWorkspaceRole(userId, workspaceId);
      if (role !== "owner" && role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const validatedData = insertWorkspaceMemberSchema.parse({
        ...req.body,
        workspaceId
      });
      
      const member = await storage.addWorkspaceMember(validatedData);
      res.status(201).json(member);
    } catch (error: any) {
      console.error("Error adding workspace member:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ message: "Failed to add workspace member" });
    }
  });

  app.patch('/api/workspaces/:id/members/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.id;
      const { id: workspaceId, userId: targetUserId } = req.params;
      
      // Check if requester is owner or admin
      const role = await storage.getUserWorkspaceRole(requesterId, workspaceId);
      if (role !== "owner" && role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate new role
      const { role: newRole } = req.body;
      if (!workspaceRoles.includes(newRole)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // Prevent changing owner role unless you're the owner
      if (newRole === "owner" && role !== "owner") {
        return res.status(403).json({ message: "Only owner can assign owner role" });
      }
      
      const updated = await storage.updateWorkspaceMemberRole(workspaceId, targetUserId, newRole);
      res.json(updated);
    } catch (error) {
      console.error("Error updating workspace member:", error);
      res.status(500).json({ message: "Failed to update workspace member" });
    }
  });

  app.delete('/api/workspaces/:id/members/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const requesterId = req.user.id;
      const { id: workspaceId, userId: targetUserId } = req.params;
      
      // Check if requester is owner or admin (or removing themselves)
      const role = await storage.getUserWorkspaceRole(requesterId, workspaceId);
      if (requesterId !== targetUserId && role !== "owner" && role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const removed = await storage.removeWorkspaceMember(workspaceId, targetUserId);
      if (removed) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Member not found" });
      }
    } catch (error) {
      console.error("Error removing workspace member:", error);
      res.status(500).json({ message: "Failed to remove workspace member" });
    }
  });

  // Public API endpoint (v1) - authenticated via API key
  app.post('/api/v1/chat', async (req, res) => {
    try {
      const apiKeyHeader = req.headers['x-api-key'] as string;
      
      if (!apiKeyHeader) {
        return res.status(401).json({ error: "API key required" });
      }
      
      // Hash the provided key to compare with stored hash
      const hashedKey = hashApiKey(apiKeyHeader);
      const apiKey = await storage.getApiKey(hashedKey);
      
      if (!apiKey) {
        return res.status(401).json({ error: "Invalid API key" });
      }
      
      // Check if API key is expired
      if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
        return res.status(401).json({ error: "API key expired" });
      }
      
      // Update last used timestamp
      await storage.updateApiKeyLastUsed(apiKey.id);
      
      const { message, modelId } = req.body;
      
      if (!message || !modelId) {
        return res.status(400).json({ error: "message and modelId are required" });
      }
      
      // Get the model (check if it belongs to the API key's user or their workspace)
      const model = await storage.getAIModel(apiKey.userId, modelId);
      if (!model && apiKey.modelId !== modelId) {
        return res.status(404).json({ error: "Model not found or access denied" });
      }
      
      // Get OpenAI API key from environment
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }
      
      const openai = new OpenAI({ apiKey: openaiApiKey });
      
      const modelName = model?.model || "gpt-4o-mini";
      const useMaxCompletionTokens = modelName.toLowerCase().includes('gpt-5') || 
                                      modelName.toLowerCase().includes('o1') ||
                                      modelName.toLowerCase().includes('o3');
      
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: model?.systemPrompt || "You are a helpful assistant." },
          { role: "user", content: message }
        ],
        temperature: (model?.temperature || 70) / 100,
        ...(useMaxCompletionTokens 
          ? { max_completion_tokens: model?.maxTokens || 1000 } 
          : { max_tokens: model?.maxTokens || 1000 }
        ),
      } as any);
      
      const response = completion.choices[0]?.message?.content || "";
      
      // Log usage
      if (completion.usage) {
        await storage.logUsage({
          userId: apiKey.userId,
          modelId: modelId,
          conversationId: null,
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
          model: model?.model || "gpt-4o-mini",
        });
      }
      
      res.json({
        response,
        usage: completion.usage
      });
    } catch (error: any) {
      console.error("Error in public API:", error);
      res.status(500).json({ error: error.message || "Failed to process request" });
    }
  });

  // Workflow endpoints
  app.get("/api/workflows", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workflows = await storage.getUserWorkflows(userId);
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.post("/api/workflows", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workflow = await storage.createWorkflow(userId, req.body);
      res.json(workflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      res.status(500).json({ error: "Failed to create workflow" });
    }
  });

  app.get("/api/workflows/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workflow = await storage.getWorkflow(userId, req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Error fetching workflow:", error);
      res.status(500).json({ error: "Failed to fetch workflow" });
    }
  });

  app.patch("/api/workflows/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workflow = await storage.updateWorkflow(userId, req.params.id, req.body);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Error updating workflow:", error);
      res.status(500).json({ error: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteWorkflow(userId, req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workflow:", error);
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  });

  app.post("/api/workflows/:id/execute", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { workflowEngine } = await import("./workflowEngine");
      const run = await workflowEngine.executeWorkflow(req.params.id, userId, req.body.input);
      res.json(run);
    } catch (error: any) {
      console.error("Error executing workflow:", error);
      res.status(500).json({ error: error.message || "Failed to execute workflow" });
    }
  });

  app.get("/api/workflows/:id/runs", isAuthenticated, async (req: any, res) => {
    try {
      const runs = await storage.getWorkflowRuns(req.params.id);
      res.json(runs);
    } catch (error) {
      console.error("Error fetching workflow runs:", error);
      res.status(500).json({ error: "Failed to fetch workflow runs" });
    }
  });

  // Fine-tuning routes
  
  // Upload training file
  app.post("/api/fine-tuning/files", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { fileName, fileContent, purpose = "fine-tune" } = req.body;

      if (!fileName || !fileContent) {
        return res.status(400).json({ error: "fileName and fileContent are required" });
      }

      // File size validation (10MB limit)
      const fileSizeBytes = Buffer.byteLength(fileContent, 'utf-8');
      const maxSizeMB = 10;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      
      if (fileSizeBytes > maxSizeBytes) {
        return res.status(400).json({ 
          error: `File size (${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size of ${maxSizeMB} MB` 
        });
      }

      // Validate JSONL format and clean data
      const lines = fileContent.trim().split('\n');
      if (lines.length === 0) {
        return res.status(400).json({ error: "File is empty" });
      }

      // Validate and clean each line - remove extra fields, keep only "messages"
      const cleanedLines: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        try {
          const parsed = JSON.parse(lines[i]);
          if (!parsed.messages || !Array.isArray(parsed.messages)) {
            return res.status(400).json({ 
              error: `Invalid format at line ${i + 1}: Each line must have a 'messages' array` 
            });
          }
          
          // Clean each message: only keep "role" and "content" fields
          // Remove extra fields like "timestamp", "name", "id", etc. from individual messages
          const cleanedMessages = parsed.messages.map((msg: any) => {
            const cleaned: any = {
              role: msg.role,
              content: msg.content
            };
            
            // Keep "name" field only if present (it's optional for function calls)
            if (msg.name) {
              cleaned.name = msg.name;
            }
            
            return cleaned;
          });
          
          // Clean the data: only keep "messages" field at top level
          const cleanedData = {
            messages: cleanedMessages
          };
          
          cleanedLines.push(JSON.stringify(cleanedData));
        } catch (e) {
          return res.status(400).json({ 
            error: `Invalid JSON at line ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}` 
          });
        }
      }

      // Create cleaned JSONL content
      const cleanedContent = cleanedLines.join('\n');
      const fileBuffer = Buffer.from(cleanedContent, 'utf-8');

      // Upload to OpenAI using toFile helper (works in Node.js)
      const openai = new OpenAI({
        apiKey: req.user.openaiApiKey || process.env.OPENAI_API_KEY
      });

      // Use OpenAI's toFile helper which works in Node.js environment
      const { toFile } = await import('openai/uploads');
      const fileToUpload = await toFile(fileBuffer, fileName, { type: 'application/jsonl' });

      const uploadedFile = await openai.files.create({
        file: fileToUpload,
        purpose: purpose as "fine-tune",
      });

      // Store file record in database
      const fileRecord = await storage.createFineTuningFile(userId, {
        openaiFileId: uploadedFile.id,
        fileName,
        fileSize: fileBuffer.length,
        purpose,
        exampleCount: lines.length,
        status: 'uploaded',
      });

      res.json(fileRecord);
    } catch (error: any) {
      console.error("Error uploading training file:", error);
      res.status(500).json({ error: error.message || "Failed to upload training file" });
    }
  });

  // List user's training files
  app.get("/api/fine-tuning/files", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const files = await storage.getUserFineTuningFiles(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching training files:", error);
      res.status(500).json({ error: "Failed to fetch training files" });
    }
  });

  // Delete training file
  app.delete("/api/fine-tuning/files/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const file = await storage.getFineTuningFile(userId, req.params.id);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Delete from OpenAI if openaiFileId exists
      if (file.openaiFileId) {
        try {
          const openai = new OpenAI({
            apiKey: req.user.openaiApiKey || process.env.OPENAI_API_KEY
          });
          await openai.files.delete(file.openaiFileId);
        } catch (error) {
          console.error("Error deleting file from OpenAI:", error);
          // Continue even if OpenAI deletion fails
        }
      }

      const success = await storage.deleteFineTuningFile(userId, req.params.id);
      if (!success) {
        return res.status(404).json({ error: "File not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting training file:", error);
      res.status(500).json({ error: "Failed to delete training file" });
    }
  });

  // Create fine-tuning job
  app.post("/api/fine-tuning/jobs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { trainingFileId, validationFileId, baseModel, suffix, hyperparameters } = req.body;

      if (!trainingFileId || !baseModel) {
        return res.status(400).json({ error: "trainingFileId and baseModel are required" });
      }

      // Get training file
      const trainingFile = await storage.getFineTuningFile(userId, trainingFileId);
      if (!trainingFile || !trainingFile.openaiFileId) {
        return res.status(404).json({ error: "Training file not found" });
      }

      // Get validation file if provided
      let validationOpenaiFileId = null;
      if (validationFileId) {
        const validationFile = await storage.getFineTuningFile(userId, validationFileId);
        if (!validationFile || !validationFile.openaiFileId) {
          return res.status(404).json({ error: "Validation file not found" });
        }
        validationOpenaiFileId = validationFile.openaiFileId;
      }

      // Create fine-tuning job on OpenAI
      const openai = new OpenAI({
        apiKey: req.user.openaiApiKey || process.env.OPENAI_API_KEY
      });

      const jobParams: any = {
        training_file: trainingFile.openaiFileId,
        model: baseModel,
      };

      if (validationOpenaiFileId) {
        jobParams.validation_file = validationOpenaiFileId;
      }

      if (suffix) {
        jobParams.suffix = suffix;
      }

      if (hyperparameters) {
        jobParams.hyperparameters = hyperparameters;
      }

      const openaiJob = await openai.fineTuning.jobs.create(jobParams);

      // Store job record in database
      const job = await storage.createFineTuningJob(userId, {
        openaiJobId: openaiJob.id,
        trainingFileId,
        validationFileId: validationFileId || null,
        baseModel,
        fineTunedModel: openaiJob.fine_tuned_model,
        suffix: suffix || null,
        hyperparameters: hyperparameters || {},
        status: openaiJob.status,
        trainedTokens: openaiJob.trained_tokens || null,
        error: openaiJob.error?.message || null,
      });

      res.json(job);
    } catch (error: any) {
      console.error("Error creating fine-tuning job:", error);
      res.status(500).json({ error: error.message || "Failed to create fine-tuning job" });
    }
  });

  // List user's fine-tuning jobs
  app.get("/api/fine-tuning/jobs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const jobs = await storage.getUserFineTuningJobs(userId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching fine-tuning jobs:", error);
      res.status(500).json({ error: "Failed to fetch fine-tuning jobs" });
    }
  });

  // Get specific fine-tuning job
  app.get("/api/fine-tuning/jobs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const job = await storage.getFineTuningJob(userId, req.params.id);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      res.json(job);
    } catch (error) {
      console.error("Error fetching fine-tuning job:", error);
      res.status(500).json({ error: "Failed to fetch fine-tuning job" });
    }
  });

  // Sync job status from OpenAI
  app.post("/api/fine-tuning/jobs/:id/sync", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const job = await storage.getFineTuningJob(userId, req.params.id);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (!job.openaiJobId) {
        return res.status(400).json({ error: "Job has no OpenAI ID" });
      }

      // Fetch latest status from OpenAI
      const openai = new OpenAI({
        apiKey: req.user.openaiApiKey || process.env.OPENAI_API_KEY
      });

      const openaiJob = await openai.fineTuning.jobs.retrieve(job.openaiJobId);

      // Update job in database
      const updatedJob = await storage.updateFineTuningJob(userId, req.params.id, {
        status: openaiJob.status,
        fineTunedModel: openaiJob.fine_tuned_model,
        trainedTokens: openaiJob.trained_tokens || null,
        error: openaiJob.error?.message || null,
        finishedAt: openaiJob.finished_at ? new Date(openaiJob.finished_at * 1000) : null,
      });

      res.json(updatedJob);
    } catch (error: any) {
      console.error("Error syncing job status:", error);
      res.status(500).json({ error: error.message || "Failed to sync job status" });
    }
  });

  // Cancel fine-tuning job
  app.post("/api/fine-tuning/jobs/:id/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const job = await storage.getFineTuningJob(userId, req.params.id);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (!job.openaiJobId) {
        return res.status(400).json({ error: "Job has no OpenAI ID" });
      }

      // Cancel job on OpenAI
      const openai = new OpenAI({
        apiKey: req.user.openaiApiKey || process.env.OPENAI_API_KEY
      });

      await openai.fineTuning.jobs.cancel(job.openaiJobId);

      // Update job status in database
      const updatedJob = await storage.cancelFineTuningJob(userId, req.params.id);

      res.json(updatedJob);
    } catch (error: any) {
      console.error("Error cancelling fine-tuning job:", error);
      res.status(500).json({ error: error.message || "Failed to cancel fine-tuning job" });
    }
  });

  // Test fine-tuned model
  app.post("/api/fine-tuning/test", isAuthenticated, async (req: any, res) => {
    try {
      const { model, messages } = req.body;

      if (!model || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "model and messages array are required" });
      }

      const openai = new OpenAI({
        apiKey: req.user.openaiApiKey || process.env.OPENAI_API_KEY
      });

      const completion = await openai.chat.completions.create({
        model: model,
        messages: messages,
        max_tokens: 500,
      });

      res.json({ message: completion.choices[0]?.message?.content || "No response" });
    } catch (error: any) {
      console.error("Error testing fine-tuned model:", error);
      res.status(500).json({ error: error.message || "Failed to test model" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
