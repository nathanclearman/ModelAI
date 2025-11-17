import type { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs/promises";
import path from "path";
import { storage } from "./storage";
import { insertAIModelSchema, insertConversationSchema, updateUserProfileSchema, insertWorkspaceSchema, insertWorkspaceMemberSchema, insertApiKeySchema, insertWebhookConfigurationSchema, insertIntegrationSchema, workspaceRoles, type Message } from "@shared/schema";
import OpenAI from "openai";
import { isAuthenticated, isAdmin } from "./auth";
import { generateApiKey, hashApiKey } from "./utils/apiKey";
import crypto from "crypto";
import { calculateCost } from "./utils/costCalculator";
import { checkImagePrompt } from "./utils/contentFilter";
import { geminiService } from "./services/geminiService";
import { checkImageQuota, incrementImageUsage } from "./middleware/imageAccess";
import { imageStore } from "./services/imageStore";
import { processDocument } from "./services/documentService";
import { storeDocument, deleteDocument as deleteDocumentFile } from "./services/documentStore";
import { mediaStore } from "./services/mediaStore";
import { transcribeAudio, textToSpeech } from "./services/audioService";
import { analyzeVideo } from "./services/videoService";
import { processConversationForKnowledge, getRelevantKnowledgeForQuery, formatKnowledgeAsContext } from "./services/knowledgeGraphService";
import multer from "multer";
import Stripe from "stripe";
import bcrypt from "bcryptjs";

// Initialize Stripe only if key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Test endpoint to verify proxy is accessible
  app.get("/api/images/proxy/test", (req, res) => {
    console.log("[ImageProxy] Test endpoint hit!");
    res.json({ status: "ok", message: "Image proxy endpoint is accessible" });
  });

  // Image proxy endpoint - MUST be registered early, before auth middleware
  // This endpoint must be public (no auth) to allow images to load in browsers
  app.get("/api/images/proxy", async (req, res) => {
    // Log immediately when endpoint is hit
    console.log("[ImageProxy] ===== ENDPOINT HIT =====");
    console.log("[ImageProxy] Request received:", {
      method: req.method,
      path: req.path,
      query: req.query,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'referer': req.headers['referer'],
      },
    });
    
    try {
      const { key } = req.query;
      
      if (!key || typeof key !== "string") {
        console.error("[ImageProxy] Missing or invalid key parameter:", key);
        return res.status(400).send("Image key is required");
      }

      // Decode the URL-encoded key
      let decodedKey: string;
      try {
        decodedKey = decodeURIComponent(key);
      } catch (e) {
        console.error("[ImageProxy] Failed to decode key:", key, e);
        decodedKey = key; // Fallback to original key
      }
      
      console.log("[ImageProxy] Processing request:", {
        originalKey: key,
        decodedKey,
        timestamp: new Date().toISOString(),
      });

      // Check if imageStore has a get method
      if (typeof imageStore.get !== "function") {
        console.error("[ImageProxy] Image store does not support retrieval");
        return res.status(500).send("Image retrieval not supported");
      }

      // Get image from storage
      const { buffer, contentType } = await imageStore.get(decodedKey);
      
      console.log("[ImageProxy] Successfully retrieved image:", {
        key: decodedKey,
        size: buffer.length,
        contentType,
      });

      // Set appropriate headers for image
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Content-Length", buffer.length.toString());
      res.setHeader("Access-Control-Allow-Origin", "*"); // Allow CORS for images

      // Send image buffer
      res.send(buffer);
    } catch (error: any) {
      console.error("[ImageProxy] Error serving image:", {
        error: error.message,
        code: error.code || error.Code,
        name: error.name,
        query: req.query,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
      
      // Return a 1x1 transparent PNG instead of JSON error
      // This prevents broken image icons in the browser
      const transparentPng = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-cache");
      res.status(404).send(transparentPng);
    }
  });

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

  // Delete account
  app.delete('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { password: providedPassword } = req.body;
      
      // Require password verification for account deletion
      if (!providedPassword) {
        return res.status(400).json({ error: "Password is required to delete your account" });
      }
      
      // Get user with password to verify (getUserWithPassword includes password field)
      const user = await storage.getUserWithPassword(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify password
      const passwordMatch = await bcrypt.compare(providedPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Incorrect password" });
      }
      
      // Delete user and all associated data
      await storage.deleteUser(userId);
      
      // Logout and destroy session properly
      await new Promise<void>((resolve, reject) => {
        req.logout((err: Error) => {
          if (err) {
            console.error("Error logging out after account deletion:", err);
            return reject(err);
          }
          req.session.destroy((destroyErr: Error) => {
            if (destroyErr) {
              console.error("Error destroying session after account deletion:", destroyErr);
              return reject(destroyErr);
            }
            res.clearCookie('connect.sid');
            resolve();
          });
        });
      });
      
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting user account:", error);
      if (error.message && error.message.includes("workspace")) {
        return res.status(400).json({ error: error.message });
      }
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to delete account" });
      }
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

      // Get base URL for Stripe redirects - supports multiple env var formats
      let baseUrl = 'http://localhost:5000';
      if (process.env.BASE_URL) {
        baseUrl = process.env.BASE_URL.replace(/\/$/, '');
      } else if (process.env.DOMAIN) {
        const protocol = process.env.DOMAIN.includes('localhost') ? 'http' : 'https';
        baseUrl = `${protocol}://${process.env.DOMAIN}`;
      } else if (process.env.REPLIT_DOMAINS) {
        const domains = process.env.REPLIT_DOMAINS.split(',');
        baseUrl = `https://${domains[0].trim()}`;
      } else if (process.env.REPLIT_DEV_DOMAIN) {
        baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
      }

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
      
      // Emit integration event
      emitIntegrationEvent(userId, "model_created", {
        modelId: model.id,
        name: model.name,
        model: model.model,
        createdAt: model.createdAt,
      }).catch(err => console.error("Failed to emit model_created event:", err));
      
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

  // Knowledge Graph - Process conversation for knowledge extraction
  app.post("/api/knowledge/process-conversation/:conversationId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { conversationId } = req.params;
      const { workspaceId } = req.body;

      const conversation = await storage.getConversation(userId, conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = (conversation.messages as Message[]) || [];
      const result = await processConversationForKnowledge(
        userId,
        conversationId,
        messages,
        workspaceId
      );

      res.json(result);
    } catch (error: any) {
      console.error("Error processing conversation for knowledge:", error);
      res.status(500).json({ error: error.message || "Failed to process conversation" });
    }
  });

  // Knowledge Graph - Get relevant knowledge for query
  app.get("/api/knowledge/search", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { q, limit = 10 } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const knowledge = await getRelevantKnowledgeForQuery(userId, q, parseInt(limit as string));
      res.json(knowledge);
    } catch (error: any) {
      console.error("Error searching knowledge:", error);
      res.status(500).json({ error: error.message || "Failed to search knowledge" });
    }
  });

  // Knowledge Graph - Get knowledge context for prompt
  app.get("/api/knowledge/context", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { q, limit = 10 } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const knowledge = await getRelevantKnowledgeForQuery(userId, q, parseInt(limit as string));
      const context = formatKnowledgeAsContext(knowledge);
      res.json({ context, knowledge });
    } catch (error: any) {
      console.error("Error getting knowledge context:", error);
      res.status(500).json({ error: error.message || "Failed to get knowledge context" });
    }
  });

  // Knowledge Graph - Get all entities
  app.get("/api/knowledge/entities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { workspaceId, type } = req.query;

      const entities = await storage.getKnowledgeEntities(
        userId,
        workspaceId as string | undefined,
        type as string | undefined
      );
      res.json(entities);
    } catch (error: any) {
      console.error("Error fetching entities:", error);
      res.status(500).json({ error: error.message || "Failed to fetch entities" });
    }
  });

  // Knowledge Graph - Get entity by ID
  app.get("/api/knowledge/entities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const entity = await storage.getKnowledgeEntity(userId, req.params.id);
      if (!entity) {
        return res.status(404).json({ error: "Entity not found" });
      }
      res.json(entity);
    } catch (error: any) {
      console.error("Error fetching entity:", error);
      res.status(500).json({ error: error.message || "Failed to fetch entity" });
    }
  });

  // Knowledge Graph - Update entity
  app.patch("/api/knowledge/entities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const entity = await storage.updateKnowledgeEntity(userId, req.params.id, req.body);
      if (!entity) {
        return res.status(404).json({ error: "Entity not found" });
      }
      res.json(entity);
    } catch (error: any) {
      console.error("Error updating entity:", error);
      res.status(500).json({ error: error.message || "Failed to update entity" });
    }
  });

  // Knowledge Graph - Delete entity
  app.delete("/api/knowledge/entities/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteKnowledgeEntity(userId, req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Entity not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting entity:", error);
      res.status(500).json({ error: error.message || "Failed to delete entity" });
    }
  });

  // Knowledge Graph - Get relationships
  app.get("/api/knowledge/relationships", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { entityId, type } = req.query;

      const relationships = await storage.getKnowledgeRelationships(
        userId,
        entityId as string | undefined,
        type as string | undefined
      );
      res.json(relationships);
    } catch (error: any) {
      console.error("Error fetching relationships:", error);
      res.status(500).json({ error: error.message || "Failed to fetch relationships" });
    }
  });

  // Knowledge Graph - Get facts
  app.get("/api/knowledge/facts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { entityId, factType } = req.query;

      const facts = await storage.getKnowledgeFacts(
        userId,
        entityId as string | undefined,
        factType as string | undefined
      );
      res.json(facts);
    } catch (error: any) {
      console.error("Error fetching facts:", error);
      res.status(500).json({ error: error.message || "Failed to fetch facts" });
    }
  });

  // Knowledge Graph - Update fact
  app.patch("/api/knowledge/facts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const fact = await storage.updateKnowledgeFact(userId, req.params.id, req.body);
      if (!fact) {
        return res.status(404).json({ error: "Fact not found" });
      }
      res.json(fact);
    } catch (error: any) {
      console.error("Error updating fact:", error);
      res.status(500).json({ error: error.message || "Failed to update fact" });
    }
  });

  // Knowledge Graph - Delete fact
  app.delete("/api/knowledge/facts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteKnowledgeFact(userId, req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Fact not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting fact:", error);
      res.status(500).json({ error: error.message || "Failed to delete fact" });
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

      // Emit integration event for image generation
      emitIntegrationEvent(userId, "image_generated", {
        imageId: publicUrl.split('/').pop() || crypto.randomUUID(),
        imageUrl: publicUrl,
        prompt,
        conversationId: savedConversation?.id,
        createdAt: new Date().toISOString(),
      }).catch(err => console.error("Failed to emit image_generated event:", err));

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

  // Configure multer for video uploads
  const videoUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit for videos
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo', // .avi
      ];

      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Unsupported video type: ${file.mimetype}. Supported formats: MP4, WebM, MOV, AVI`));
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

      // Emit integration event for new message
      emitIntegrationEvent(userId, "new_message", {
        conversationId: savedConversation?.id,
        messageId: userMessage.messageId || crypto.randomUUID(),
        role: "user",
        content: message,
        timestamp: userMessage.timestamp,
      }).catch(err => console.error("Failed to emit new_message event:", err));

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
      
      // If workflow failed, include error details in response
      if (run.status === "failed") {
        return res.status(200).json({
          ...run,
          error: run.error || "Workflow execution failed",
        });
      }
      
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

  // Webhook configuration endpoints
  app.post("/api/webhooks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validated = insertWebhookConfigurationSchema.parse(req.body);
      const webhook = await storage.createWebhookConfiguration(userId, validated);
      res.json(webhook);
    } catch (error: any) {
      console.error("Error creating webhook configuration:", error);
      res.status(500).json({ error: error.message || "Failed to create webhook configuration" });
    }
  });

  app.get("/api/webhooks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const webhooks = await storage.getUserWebhookConfigurations(userId);
      
      // Sanitize sensitive data before sending to frontend
      const sanitized = webhooks.map((webhook: any) => ({
        ...webhook,
        authConfig: webhook.authType ? { configured: true } : null,
      }));
      
      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching webhook configurations:", error);
      res.status(500).json({ error: "Failed to fetch webhook configurations" });
    }
  });

  app.get("/api/webhooks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const webhook = await storage.getWebhookConfiguration(userId, req.params.id);
      
      if (!webhook) {
        return res.status(404).json({ error: "Webhook configuration not found" });
      }

      // Sanitize sensitive data
      const sanitized = {
        ...webhook,
        authConfig: webhook.authType ? { configured: true } : null,
      };

      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching webhook configuration:", error);
      res.status(500).json({ error: "Failed to fetch webhook configuration" });
    }
  });

  app.patch("/api/webhooks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validated = insertWebhookConfigurationSchema.partial().parse(req.body);
      const webhook = await storage.updateWebhookConfiguration(userId, req.params.id, validated);
      
      if (!webhook) {
        return res.status(404).json({ error: "Webhook configuration not found" });
      }

      res.json(webhook);
    } catch (error: any) {
      console.error("Error updating webhook configuration:", error);
      res.status(500).json({ error: error.message || "Failed to update webhook configuration" });
    }
  });

  app.delete("/api/webhooks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const deleted = await storage.deleteWebhookConfiguration(userId, req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Webhook configuration not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting webhook configuration:", error);
      res.status(500).json({ error: "Failed to delete webhook configuration" });
    }
  });

  // Test webhook endpoint
  app.post("/api/webhooks/:id/test", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const webhook = await storage.getWebhookConfiguration(userId, req.params.id);
      
      if (!webhook) {
        return res.status(404).json({ error: "Webhook configuration not found" });
      }

      // Validate webhook URL is not pointing to internal/private networks (SSRF protection)
      try {
        const url = new URL(webhook.url);
        const hostname = url.hostname.toLowerCase();
        
        // Block localhost, private IPs, and internal networks
        const blockedHosts = [
          'localhost', '127.0.0.1', '0.0.0.0',
          '::1', '::ffff:127.0.0.1',
        ];
        
        if (blockedHosts.includes(hostname) || 
            hostname.startsWith('10.') ||
            hostname.startsWith('192.168.') ||
            hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
            hostname.endsWith('.local')) {
          return res.status(400).json({ error: "Cannot test webhooks pointing to internal networks" });
        }
      } catch (urlError) {
        return res.status(400).json({ error: "Invalid webhook URL" });
      }

      const { testData } = req.body;

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(webhook.headers as Record<string, string> || {}),
      };

      // Add authentication if configured
      if (webhook.authType === "bearer" && webhook.authConfig) {
        const authConfig = webhook.authConfig as { token?: string };
        if (authConfig.token) {
          headers["Authorization"] = `Bearer ${authConfig.token}`;
        }
      } else if (webhook.authType === "api_key" && webhook.authConfig) {
        const authConfig = webhook.authConfig as { key?: string; value?: string };
        if (authConfig.key && authConfig.value) {
          headers[authConfig.key] = authConfig.value;
        }
      }

      // Prepare body
      let body = testData || webhook.bodyTemplate;

      const response = await fetch(webhook.url, {
        method: webhook.method,
        headers,
        body: webhook.method !== "GET" ? JSON.stringify(body) : undefined,
      });

      const responseText = await response.text();
      let responseBody;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
      }

      res.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
      });
    } catch (error: any) {
      console.error("Error testing webhook:", error);
      res.status(500).json({ error: error.message || "Failed to test webhook" });
    }
  });

  // Rate limiting for code execution (per user)
  const codeExecutionRateLimit = new Map<string, { count: number; resetAt: number }>();
  const CODE_EXECUTION_RATE_LIMIT = 10; // Max 10 executions per window
  const CODE_EXECUTION_WINDOW_MS = 60 * 1000; // 1 minute window

  // Dangerous patterns to block
  const DANGEROUS_PATTERNS = [
    // File system access
    /import\s+os|import\s+sys|import\s+subprocess|import\s+shutil|import\s+pathlib/gi,
    /__import__|eval\(|exec\(|compile\(/gi,
    /open\(|file\(|read\(|write\(|remove\(|delete\(/gi,
    /fs\.|require\(['"]fs['"]|require\(['"]child_process['"]/gi,
    // Network access
    /import\s+urllib|import\s+requests|import\s+http|import\s+socket/gi,
    /fetch\(|XMLHttpRequest|http\.|https\.|net\.|dns\./gi,
    // Process/system access
    /process\.|spawn\(|exec\(|execFile\(|fork\(/gi,
    /subprocess\.|os\.system|os\.popen|os\.spawn/gi,
    // Dangerous JavaScript
    /Function\(|constructor\(|prototype\.|__proto__|this\.constructor/gi,
    /global\.|globalThis\.|window\.|document\./gi,
    // Shell commands
    /`.*\$\(|`.*\$\{/gi, // Template literals with commands
    /\.exec\(|\.spawn\(|\.execFile\(/gi,
  ];

  function validateCodeSafety(code: string, language: string): { safe: boolean; reason?: string } {
    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(code)) {
        return { safe: false, reason: "Code contains potentially dangerous operations" };
      }
    }

    // Additional language-specific checks
    if (language.toLowerCase() === "python") {
      // Block import of dangerous modules
      const dangerousImports = [
        "os", "sys", "subprocess", "shutil", "pathlib", "urllib", "requests",
        "http", "socket", "multiprocessing", "threading", "ctypes", "pickle"
      ];
      for (const mod of dangerousImports) {
        if (new RegExp(`import\\s+${mod}|from\\s+${mod}`, "gi").test(code)) {
          return { safe: false, reason: `Import of '${mod}' is not allowed` };
        }
      }
    }

    if (language.toLowerCase() === "javascript") {
      // Block require of dangerous modules
      const dangerousRequires = ["fs", "child_process", "http", "https", "net", "dns", "crypto"];
      for (const mod of dangerousRequires) {
        if (new RegExp(`require\\(['"]${mod}['"]\\)`, "gi").test(code)) {
          return { safe: false, reason: `Require of '${mod}' is not allowed` };
        }
      }
    }

    return { safe: true };
  }

  // Code execution endpoint (sandboxed)
  app.post("/api/execute-code", isAuthenticated, async (req: any, res) => {
    try {
      // Check if code execution is enabled
      const codeExecutionEnabled = process.env.ENABLE_CODE_EXECUTION === "true";
      
      if (!codeExecutionEnabled) {
        return res.status(403).json({ 
          error: "Code execution is disabled in production for security reasons" 
        });
      }

      const userId = (req as any).user?.id || req.ip || "anonymous";
      const now = Date.now();

      // Rate limiting
      const userLimit = codeExecutionRateLimit.get(userId);
      if (userLimit) {
        if (now < userLimit.resetAt) {
          if (userLimit.count >= CODE_EXECUTION_RATE_LIMIT) {
            return res.status(429).json({ 
              error: `Rate limit exceeded. Maximum ${CODE_EXECUTION_RATE_LIMIT} executions per minute.` 
            });
          }
          userLimit.count++;
        } else {
          // Reset window
          codeExecutionRateLimit.set(userId, { count: 1, resetAt: now + CODE_EXECUTION_WINDOW_MS });
        }
      } else {
        codeExecutionRateLimit.set(userId, { count: 1, resetAt: now + CODE_EXECUTION_WINDOW_MS });
      }

      // Clean up old rate limit entries (prevent memory leak)
      if (Math.random() < 0.01) { // 1% chance to cleanup
        for (const key of Array.from(codeExecutionRateLimit.keys())) {
          const value = codeExecutionRateLimit.get(key);
          if (value && now >= value.resetAt) {
            codeExecutionRateLimit.delete(key);
          }
        }
      }

      const { code, language } = req.body;

      if (!code || !language) {
        return res.status(400).json({ error: "Code and language are required" });
      }

      if (!["python", "javascript"].includes(language.toLowerCase())) {
        return res.status(400).json({ error: "Only Python and JavaScript are supported" });
      }

      // Security: Limit code length
      if (code.length > 5000) {
        return res.status(400).json({ error: "Code is too long (max 5,000 characters)" });
      }

      // Validate code safety
      const safetyCheck = validateCodeSafety(code, language);
      if (!safetyCheck.safe) {
        return res.status(400).json({ 
          error: safetyCheck.reason || "Code contains potentially dangerous operations" 
        });
      }

      let result: { output: string; error?: string; executionTime: number };

      if (language.toLowerCase() === "python") {
        // Execute Python code using child_process with strict isolation
        const { spawn } = await import("child_process");
        const startTime = Date.now();
        
        try {
          // Write code to temp file and execute
          const fs = await import("fs/promises");
          const path = await import("path");
          const os = await import("os");
          
          const tempDir = os.tmpdir();
          const tempFile = path.join(tempDir, `code_${Date.now()}_${Math.random().toString(36).substring(7)}.py`);
          
          // Wrap code in a safer environment
          // Note: We rely on input validation to block dangerous imports
          // This wrapper just ensures clean environment
          const safeCode = `
import sys
# Limit module search path (but don't clear completely to allow basic operations)
if hasattr(sys, 'path'):
    sys.path = [p for p in sys.path if 'site-packages' not in p]

# Block dangerous builtins (but keep safe ones)
_original_builtins = __builtins__
if isinstance(__builtins__, dict):
    _original_builtins = __builtins__
else:
    _original_builtins = __builtins__.__dict__

# Create restricted builtins
_safe_builtins = {
    'print': _original_builtins.get('print', print),
    'len': _original_builtins.get('len', len),
    'str': _original_builtins.get('str', str),
    'int': _original_builtins.get('int', int),
    'float': _original_builtins.get('float', float),
    'bool': _original_builtins.get('bool', bool),
    'list': _original_builtins.get('list', list),
    'dict': _original_builtins.get('dict', dict),
    'tuple': _original_builtins.get('tuple', tuple),
    'set': _original_builtins.get('set', set),
    'range': _original_builtins.get('range', range),
    'enumerate': _original_builtins.get('enumerate', enumerate),
    'zip': _original_builtins.get('zip', zip),
    'min': _original_builtins.get('min', min),
    'max': _original_builtins.get('max', max),
    'sum': _original_builtins.get('sum', sum),
    'abs': _original_builtins.get('abs', abs),
    'round': _original_builtins.get('round', round),
    'sorted': _original_builtins.get('sorted', sorted),
    'reversed': _original_builtins.get('reversed', reversed),
    'type': _original_builtins.get('type', type),
    'isinstance': _original_builtins.get('isinstance', isinstance),
    'hasattr': _original_builtins.get('hasattr', hasattr),
    'getattr': _original_builtins.get('getattr', getattr),
}

# Block dangerous operations (already validated, but double-check)
for key in ['__import__', 'eval', 'exec', 'compile', 'open', 'file', 'input', 'raw_input']:
    if key in _safe_builtins:
        del _safe_builtins[key]

__builtins__ = _safe_builtins

${code}
`;
          
          await fs.writeFile(tempFile, safeCode, "utf-8");
          
          // Execute with strict timeout and resource limits
          const timeout = 3000; // 3 seconds (reduced from 5)
          let stdout = "";
          let stderr = "";
          let timedOut = false;

          const pythonCmd = process.platform === "win32" ? "python" : "python3";
          const child = spawn(pythonCmd, [tempFile], {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
              ...process.env,
              PYTHONPATH: '', // Clear Python path
              PYTHONDONTWRITEBYTECODE: '1',
            },
          });

          const MAX_OUTPUT = 512 * 1024; // 512KB max output
          const timeoutId = setTimeout(() => {
            timedOut = true;
            try {
              child.kill('SIGKILL');
            } catch {}
          }, timeout);

          if (child.stdout) {
            child.stdout.on('data', (data: Buffer) => {
              stdout += data.toString();
              if (stdout.length > MAX_OUTPUT) {
                try {
                  child.kill('SIGKILL');
                } catch {}
              }
            });
          }

          if (child.stderr) {
            child.stderr.on('data', (data: Buffer) => {
              stderr += data.toString();
              if (stderr.length > MAX_OUTPUT) {
                try {
                  child.kill('SIGKILL');
                } catch {}
              }
            });
          }

          await new Promise<void>((resolve, reject) => {
            child.on('close', (code: number | null) => {
              clearTimeout(timeoutId);
              resolve();
            });
            child.on('error', (error: Error) => {
              clearTimeout(timeoutId);
              reject(error);
            });
          });

          // Clean up temp file immediately
          try {
            await fs.unlink(tempFile);
          } catch {}

          const executionTime = Date.now() - startTime;
          
          if (timedOut) {
            result = {
              output: "",
              error: "Execution timeout (3 seconds)",
              executionTime,
            };
          } else {
            result = {
              output: stdout || stderr || "(no output)",
              error: stderr || undefined,
              executionTime,
            };
          }
        } catch (error: any) {
          const executionTime = Date.now() - startTime;
          result = {
            output: "",
            error: error.message || "Execution failed",
            executionTime,
          };
        }
      } else {
        // Execute JavaScript code using Node's vm module (strictly sandboxed)
        const vm = await import("vm");
        const startTime = Date.now();

        try {
          const output: string[] = [];
          let outputLength = 0;
          const MAX_OUTPUT_LENGTH = 10000; // Max 10KB output

          // Create a minimal, safe context
          const safeContext = {
            console: {
              log: (...args: any[]) => {
                const message = args.map((arg) => {
                  if (typeof arg === "object") {
                    try {
                      return JSON.stringify(arg, null, 2);
                    } catch {
                      return "[Object]";
                    }
                  }
                  return String(arg);
                }).join(" ");
                
                if (outputLength + message.length < MAX_OUTPUT_LENGTH) {
                  output.push(message);
                  outputLength += message.length;
                } else if (outputLength < MAX_OUTPUT_LENGTH) {
                  output.push(message.substring(0, MAX_OUTPUT_LENGTH - outputLength) + "... (output truncated)");
                  outputLength = MAX_OUTPUT_LENGTH;
                }
              },
            },
            // Safe math functions
            Math: {
              abs: Math.abs,
              ceil: Math.ceil,
              floor: Math.floor,
              max: Math.max,
              min: Math.min,
              pow: Math.pow,
              random: Math.random,
              round: Math.round,
              sqrt: Math.sqrt,
            },
            // Safe string functions
            String: String,
            Number: Number,
            Boolean: Boolean,
            Array: Array,
            Object: Object,
            Date: Date,
            JSON: JSON,
            // Safe array methods
            parseInt: parseInt,
            parseFloat: parseFloat,
            isNaN: isNaN,
            isFinite: isFinite,
            // Blocked: setTimeout, setInterval, process, require, global, etc.
          };

          // Create sandbox with no access to Node.js internals
          const sandbox = vm.createContext(safeContext, {
            name: "CodeExecutionSandbox",
            codeGeneration: {
              strings: false, // Prevent code generation from strings
              wasm: false, // Prevent WebAssembly
            },
          });

          // Compile and run with strict timeout
          const script = new vm.Script(code);

          script.runInContext(sandbox, {
            timeout: 3000, // 3 seconds
            breakOnSigint: false,
            displayErrors: true,
          });

          const executionTime = Date.now() - startTime;

          result = {
            output: output.join("\n") || "(no output)",
            executionTime,
          };
        } catch (error: any) {
          const executionTime = Date.now() - startTime;
          let errorMessage = error.message || "Execution failed";
          
          // Sanitize error messages (don't leak internal details)
          if (errorMessage.includes("timeout")) {
            errorMessage = "Execution timeout (3 seconds)";
          } else if (errorMessage.includes("Maximum call stack")) {
            errorMessage = "Stack overflow - code too complex";
          }
          
          result = {
            output: "",
            error: errorMessage,
            executionTime,
          };
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error("Code execution error:", error);
      res.status(500).json({ error: error.message || "Failed to execute code" });
    }
  });

  // ============================================
  // CONVERSATION BRANCHING APIs
  // ============================================

  // Create a new branch from a message
  app.post("/api/conversations/:conversationId/branches", isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const { parentMessageId, branchName, initialMessage } = req.body;
      const userId = req.user.id;

      // Verify conversation belongs to user
      const conversation = await storage.getConversation(userId, conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Create branch
      const branch = await storage.createConversationBranch({
        conversationId,
        parentMessageId,
        branchName: branchName || `Branch ${new Date().toLocaleString()}`,
        messages: initialMessage ? [initialMessage] : [],
      });

      // Update conversation to include branch reference
      const branches = (conversation.branches as any[]) || [];
      branches.push({ id: branch.id, name: branch.branchName, parentMessageId });
      await storage.updateConversation(userId, conversationId, { branches });

      res.json(branch);
    } catch (error: any) {
      console.error("Error creating branch:", error);
      res.status(500).json({ error: error.message || "Failed to create branch" });
    }
  });

  // Get all branches for a conversation
  app.get("/api/conversations/:conversationId/branches", isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const conversation = await storage.getConversation(userId, conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const branches = await storage.getConversationBranches(conversationId);
      res.json(branches);
    } catch (error: any) {
      console.error("Error getting branches:", error);
      res.status(500).json({ error: error.message || "Failed to get branches" });
    }
  });

  // Get a specific branch
  app.get("/api/branches/:branchId", isAuthenticated, async (req: any, res) => {
    try {
      const { branchId } = req.params;
      const branch = await storage.getConversationBranch(branchId);
      
      if (!branch) {
        return res.status(404).json({ error: "Branch not found" });
      }

      // Verify user has access to the conversation
      const conversation = await storage.getConversation(req.user.id, branch.conversationId);
      if (!conversation) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(branch);
    } catch (error: any) {
      console.error("Error getting branch:", error);
      res.status(500).json({ error: error.message || "Failed to get branch" });
    }
  });

  // Switch active branch
  app.post("/api/conversations/:conversationId/switch-branch", isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const { branchId } = req.body;
      const userId = req.user.id;

      const conversation = await storage.getConversation(userId, conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (branchId) {
        const branch = await storage.getConversationBranch(branchId);
        if (!branch || branch.conversationId !== conversationId) {
          return res.status(404).json({ error: "Branch not found" });
        }
        // Load branch messages into conversation
        await storage.updateConversation(userId, conversationId, {
          activeBranchId: branchId,
          messages: branch.messages as any,
        });
      } else {
        // Switch back to main branch
        await storage.updateConversation(userId, conversationId, {
          activeBranchId: null,
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error switching branch:", error);
      res.status(500).json({ error: error.message || "Failed to switch branch" });
    }
  });

  // ============================================
  // PROMPT TEMPLATE APIs
  // ============================================

  // Create a prompt template
  app.post("/api/prompt-templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const template = await storage.createPromptTemplate(userId, req.body);
      res.json(template);
    } catch (error: any) {
      console.error("Error creating prompt template:", error);
      res.status(500).json({ error: error.message || "Failed to create template" });
    }
  });

  // Get user's prompt templates
  app.get("/api/prompt-templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const templates = await storage.getUserPromptTemplates(userId);
      res.json(templates);
    } catch (error: any) {
      console.error("Error getting prompt templates:", error);
      res.status(500).json({ error: error.message || "Failed to get templates" });
    }
  });

  // Get public prompt templates
  app.get("/api/prompt-templates/public", async (req: any, res) => {
    try {
      const { category } = req.query;
      const templates = await storage.getPublicPromptTemplates(category);
      res.json(templates);
    } catch (error: any) {
      console.error("Error getting public templates:", error);
      res.status(500).json({ error: error.message || "Failed to get templates" });
    }
  });

  // Get a specific template
  app.get("/api/prompt-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Try user's template first
      let template = await storage.getPromptTemplate(userId, id);
      
      // If not found, try public templates
      if (!template) {
        const publicTemplates = await storage.getPublicPromptTemplates();
        template = publicTemplates.find(t => t.id === id);
      }

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      res.json(template);
    } catch (error: any) {
      console.error("Error getting template:", error);
      res.status(500).json({ error: error.message || "Failed to get template" });
    }
  });

  // Update a template
  app.put("/api/prompt-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const template = await storage.updatePromptTemplate(userId, id, req.body);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      res.json(template);
    } catch (error: any) {
      console.error("Error updating template:", error);
      res.status(500).json({ error: error.message || "Failed to update template" });
    }
  });

  // Delete a template
  app.delete("/api/prompt-templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const success = await storage.deletePromptTemplate(userId, id);
      
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: error.message || "Failed to delete template" });
    }
  });

  // Use a template (increments usage count)
  app.post("/api/prompt-templates/:id/use", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.incrementPromptTemplateUsage(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error using template:", error);
      res.status(500).json({ error: error.message || "Failed to use template" });
    }
  });

  // Rate a template
  app.post("/api/prompt-templates/:id/rate", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      const userId = req.user.id;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const result = await storage.ratePromptTemplate(id, userId, rating);
      res.json(result);
    } catch (error: any) {
      console.error("Error rating template:", error);
      res.status(500).json({ error: error.message || "Failed to rate template" });
    }
  });

  // ============================================
  // MULTI-MODEL ORCHESTRATION APIs
  // ============================================

  // Execute a workflow (multi-model orchestration)
  app.post("/api/workflows/:id/run", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { input } = req.body;
      const userId = req.user.id;

      const workflow = await storage.getWorkflow(userId, id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      if (!workflow.enabled) {
        return res.status(400).json({ error: "Workflow is disabled" });
      }

      // Create workflow run
      const run = await storage.createWorkflowRun({
        workflowId: id,
        userId,
        status: "running",
        input: input || {},
      });

      // Execute workflow asynchronously
      executeWorkflow(workflow, run.id, userId, input || {}).catch((error) => {
        console.error("Workflow execution error:", error);
        storage.updateWorkflowRun(run.id, {
          status: "failed",
          error: error.message,
          completedAt: new Date(),
        });
      });

      res.json(run);
    } catch (error: any) {
      console.error("Error running workflow:", error);
      res.status(500).json({ error: error.message || "Failed to run workflow" });
    }
  });

  // Helper function to execute workflow steps
  async function executeWorkflow(workflow: any, runId: string, userId: string, input: any) {
    const steps = workflow.steps as any[];
    const context: Record<string, any> = { input };
    let currentStepId = steps[0]?.id;

    while (currentStepId) {
      const step = steps.find(s => s.id === currentStepId);
      if (!step) break;

      try {
        let result: any;

        switch (step.type) {
          case "ai_chat":
            if (!step.modelId || !step.prompt) {
              throw new Error("AI chat step requires modelId and prompt");
            }
            // Execute AI chat (simplified - you'll need to integrate with your chat system)
            result = { output: "AI response placeholder" };
            break;

          case "condition":
            if (!step.condition) {
              throw new Error("Condition step requires condition config");
            }
            const fieldValue = context[step.condition.field];
            let conditionMet = false;
            
            switch (step.condition.operator) {
              case "equals":
                conditionMet = fieldValue === step.condition.value;
                break;
              case "contains":
                conditionMet = String(fieldValue).includes(String(step.condition.value));
                break;
              case "greater_than":
                conditionMet = Number(fieldValue) > Number(step.condition.value);
                break;
              case "less_than":
                conditionMet = Number(fieldValue) < Number(step.condition.value);
                break;
            }
            
            currentStepId = conditionMet ? step.onSuccessStepId : step.onFailureStepId;
            continue;

          case "parallel":
            if (!step.parallelSteps) {
              throw new Error("Parallel step requires parallelSteps");
            }
            // Execute parallel steps (simplified)
            result = { outputs: [] };
            break;

          case "delay":
            if (step.delayMs) {
              await new Promise(resolve => setTimeout(resolve, step.delayMs));
            }
            result = { delayed: step.delayMs };
            break;

          default:
            result = { output: "Step executed" };
        }

        context[step.id] = result;
        currentStepId = step.nextStepId;
      } catch (error: any) {
        await storage.updateWorkflowRun(runId, {
          status: "failed",
          error: error.message,
          completedAt: new Date(),
        });
        throw error;
      }
    }

    // Mark workflow as completed
    await storage.updateWorkflowRun(runId, {
      status: "completed",
      output: context,
      completedAt: new Date(),
    });
  }

  // ============================================
  // INTEGRATION APIs (Zapier, Make.com, etc.)
  // ============================================

  // API Key authentication middleware for integrations
  const authenticateApiKey = async (req: any, res: any, next: any) => {
    try {
      const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
      
      if (!apiKey) {
        return res.status(401).json({ error: "API key required" });
      }

      const integration = await storage.getIntegrationByApiKey(apiKey);
      if (!integration || !integration.enabled) {
        return res.status(401).json({ error: "Invalid or disabled API key" });
      }

      // Update last used
      await storage.updateIntegrationLastUsed(integration.id);

      // Attach integration to request
      req.integration = integration;
      req.user = { id: integration.userId }; // For compatibility with other middleware
      
      next();
    } catch (error: any) {
      console.error("API key authentication error:", error);
      res.status(401).json({ error: "Authentication failed" });
    }
  };

  // Create integration
  app.post("/api/integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validated = insertIntegrationSchema.parse(req.body);
      
      // Generate API key for integration
      const apiKey = `int_${crypto.randomBytes(32).toString('base64url')}`;
      
      const integration = await storage.createIntegration(userId, validated, apiKey);
      
      // Return integration with API key (only shown once)
      res.status(201).json({ ...integration, apiKey });
    } catch (error: any) {
      console.error("Error creating integration:", error);
      res.status(500).json({ error: error.message || "Failed to create integration" });
    }
  });

  // Get user's integrations
  app.get("/api/integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const integrations = await storage.getUserIntegrations(userId);
      
      // Don't expose API keys in list
      const sanitized = integrations.map((int: any) => {
        const { apiKey, ...rest } = int;
        return rest;
      });
      
      res.json(sanitized);
    } catch (error: any) {
      console.error("Error getting integrations:", error);
      res.status(500).json({ error: error.message || "Failed to get integrations" });
    }
  });

  // Get integration (with API key if user owns it)
  app.get("/api/integrations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const integration = await storage.getIntegration(userId, req.params.id);
      
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      res.json(integration);
    } catch (error: any) {
      console.error("Error getting integration:", error);
      res.status(500).json({ error: error.message || "Failed to get integration" });
    }
  });

  // Update integration
  app.patch("/api/integrations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validated = insertIntegrationSchema.partial().parse(req.body);
      const integration = await storage.updateIntegration(userId, req.params.id, validated);
      
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }

      res.json(integration);
    } catch (error: any) {
      console.error("Error updating integration:", error);
      res.status(500).json({ error: error.message || "Failed to update integration" });
    }
  });

  // Delete integration
  app.delete("/api/integrations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const success = await storage.deleteIntegration(userId, req.params.id);
      
      if (!success) {
        return res.status(404).json({ error: "Integration not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ error: error.message || "Failed to delete integration" });
    }
  });

  // ============================================
  // ZAPIER/MAKE.COM TRIGGERS (Webhooks)
  // ============================================

  // Get available triggers
  app.get("/api/integrations/triggers", authenticateApiKey, async (req: any, res) => {
    try {
      const triggers = [
        {
          key: "new_message",
          name: "New Message",
          description: "Triggered when a new message is sent in a conversation",
          sample: {
            conversationId: "conv_123",
            messageId: "msg_456",
            role: "user",
            content: "Hello!",
            timestamp: new Date().toISOString(),
          },
        },
        {
          key: "model_created",
          name: "Model Created",
          description: "Triggered when a new AI model is created",
          sample: {
            modelId: "model_123",
            name: "My Model",
            model: "gpt-4",
            createdAt: new Date().toISOString(),
          },
        },
        {
          key: "image_generated",
          name: "Image Generated",
          description: "Triggered when an image is generated",
          sample: {
            imageId: "img_123",
            imageUrl: "https://...",
            prompt: "A beautiful sunset",
            createdAt: new Date().toISOString(),
          },
        },
      ];
      
      res.json(triggers);
    } catch (error: any) {
      console.error("Error getting triggers:", error);
      res.status(500).json({ error: error.message || "Failed to get triggers" });
    }
  });

  // Get pending events for a trigger (Zapier polling)
  app.get("/api/integrations/triggers/:triggerKey", authenticateApiKey, async (req: any, res) => {
    try {
      const { triggerKey } = req.params;
      const integration = req.integration;
      
      // Get pending events for this integration and trigger
      const events = await storage.getPendingIntegrationEvents(integration.id);
      const filteredEvents = events.filter(e => e.eventType === triggerKey);
      
      // Mark as delivered
      for (const event of filteredEvents) {
        await storage.markEventDelivered(event.id);
      }
      
      res.json(filteredEvents.map(e => e.eventData));
    } catch (error: any) {
      console.error("Error getting trigger events:", error);
      res.status(500).json({ error: error.message || "Failed to get trigger events" });
    }
  });

  // ============================================
  // ZAPIER/MAKE.COM ACTIONS
  // ============================================

  // Get available actions
  app.get("/api/integrations/actions", authenticateApiKey, async (req: any, res) => {
    try {
      const actions = [
        {
          key: "send_message",
          name: "Send Message",
          description: "Send a message to an AI model",
          inputFields: [
            { key: "modelId", label: "Model ID", required: true, type: "string" },
            { key: "message", label: "Message", required: true, type: "text" },
            { key: "conversationId", label: "Conversation ID", required: false, type: "string" },
          ],
        },
        {
          key: "generate_image",
          name: "Generate Image",
          description: "Generate an image using AI",
          inputFields: [
            { key: "modelId", label: "Model ID", required: true, type: "string" },
            { key: "prompt", label: "Image Prompt", required: true, type: "text" },
          ],
        },
        {
          key: "list_models",
          name: "List Models",
          description: "Get list of available AI models",
          inputFields: [],
        },
      ];
      
      res.json(actions);
    } catch (error: any) {
      console.error("Error getting actions:", error);
      res.status(500).json({ error: error.message || "Failed to get actions" });
    }
  });

  // Execute action: Send Message
  app.post("/api/integrations/actions/send_message", authenticateApiKey, async (req: any, res) => {
    try {
      const { modelId, message, conversationId } = req.body;
      const integration = req.integration;
      
      if (!modelId || !message) {
        return res.status(400).json({ error: "modelId and message are required" });
      }

      // Verify model belongs to user
      const model = await storage.getAIModel(integration.userId, modelId);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }

      // Use OpenAI client to send message (simplified version)
      const userApiKey = process.env.OPENAI_API_KEY;
      if (!userApiKey) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const openaiClient = new OpenAI({ apiKey: userApiKey });
      
      // Get conversation if exists
      let conversation = conversationId
        ? await storage.getConversation(integration.userId, conversationId)
        : null;

      const messages = conversation?.messages as Message[] || [];
      messages.push({
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
        messageId: crypto.randomUUID(),
      });

      const openaiMessages: any[] = [
        { role: "system", content: model.systemPrompt },
        ...messages.map((msg) => ({ role: msg.role, content: msg.content })),
      ];

      const completion = await openaiClient.chat.completions.create({
        model: model.model,
        messages: openaiMessages,
        temperature: model.temperature / 100,
        max_tokens: model.maxTokens,
      });

      const response = completion.choices[0]?.message?.content || "";

      res.json({
        success: true,
        response,
        conversationId: conversationId || "new",
      });
    } catch (error: any) {
      console.error("Error executing send_message action:", error);
      res.status(500).json({ error: error.message || "Failed to execute action" });
    }
  });

  // Execute action: Generate Image
  app.post("/api/integrations/actions/generate_image", authenticateApiKey, async (req: any, res) => {
    try {
      const { modelId, prompt } = req.body;
      const integration = req.integration;
      
      if (!modelId || !prompt) {
        return res.status(400).json({ error: "modelId and prompt are required" });
      }

      // Verify model belongs to user
      const model = await storage.getAIModel(integration.userId, modelId);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }

      // Check content filter
      const filterResult = checkImagePrompt(prompt);
      if (!filterResult.allowed) {
        return res.status(400).json({ error: filterResult.reason });
      }

      // Generate image using Gemini
      const { imageData, mimeType } = await geminiService.generateImage(prompt);
      
      // Store the image and get a public URL
      const { publicUrl } = await imageStore.store(imageData, integration.userId, "generated", prompt);
      
      res.json({
        success: true,
        imageUrl: publicUrl,
        imageType: "generated",
      });
    } catch (error: any) {
      console.error("Error executing generate_image action:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  // Execute action: List Models
  app.post("/api/integrations/actions/list_models", authenticateApiKey, async (req: any, res) => {
    try {
      const integration = req.integration;
      const models = await storage.getAllAIModels(integration.userId);
      
      res.json({
        success: true,
        models: models.map(m => ({
          id: m.id,
          name: m.name,
          description: m.description,
          model: m.model,
          isPublic: m.isPublic,
        })),
      });
    } catch (error: any) {
      console.error("Error executing list_models action:", error);
      res.status(500).json({ error: error.message || "Failed to list models" });
    }
  });

  // ============================================
  // EVENT EMISSION (Internal - called when events happen)
  // ============================================

  // Helper function to emit integration events
  async function emitIntegrationEvent(userId: string, eventType: string, eventData: any) {
    try {
      // Get all enabled integrations for user
      const integrations = await storage.getUserIntegrations(userId);
      const enabledIntegrations = integrations.filter(i => i.enabled);
      
      for (const integration of enabledIntegrations) {
        // Create event
        const event = await storage.createIntegrationEvent({
          integrationId: integration.id,
          eventType,
          eventData,
        });

        // If webhook URL is configured, send event immediately
        if (integration.webhookUrl) {
          try {
            const response = await fetch(integration.webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": integration.apiKey,
              },
              body: JSON.stringify({
                event: eventType,
                data: eventData,
                timestamp: new Date().toISOString(),
              }),
            });

            if (response.ok) {
              await storage.markEventDelivered(event.id);
            } else {
              await storage.markEventDelivered(event.id, `HTTP ${response.status}`);
            }
          } catch (error: any) {
            await storage.markEventDelivered(event.id, error.message);
          }
        }
      }
    } catch (error) {
      console.error("Error emitting integration event:", error);
    }
  }

  // ============================================
  // VOICE & VIDEO APIs
  // ============================================

  // Serve media files (audio/video)
  app.get("/tmp-media/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join("/tmp/model-ai-media", filename);
      
      // Security: prevent directory traversal
      if (filename.includes("..") || filename.includes("/")) {
        return res.status(400).json({ error: "Invalid filename" });
      }

      const stats = await fs.stat(filePath);
      const file = await fs.readFile(filePath);
      
      // Determine content type from extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".webm": "video/webm", // webm can be audio or video, defaulting to video
        ".ogg": "audio/ogg",
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
      };
      
      res.setHeader("Content-Type", contentTypeMap[ext] || "application/octet-stream");
      res.setHeader("Content-Length", stats.size);
      res.send(file);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        res.status(404).json({ error: "Media file not found" });
      } else {
        console.error("Error serving media file:", error);
        res.status(500).json({ error: "Failed to serve media file" });
      }
    }
  });

  // Transcribe audio
  app.post("/api/audio/transcribe", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { audioData, language, conversationId } = req.body;

      if (!audioData) {
        return res.status(400).json({ error: "Audio data is required" });
      }

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioData, "base64");

      // Transcribe using Whisper
      const result = await transcribeAudio(audioBuffer, language);

      // Store the audio asset
      const mimeType = "audio/webm"; // Default, could be detected from request
      const { publicUrl, storageKey } = await mediaStore.store(
        audioBuffer,
        userId,
        "audio",
        mimeType,
        conversationId
      );

      // Update media asset with transcription
      const mediaAssets = await storage.getUserMediaAssets(userId, "audio");
      const latestAsset = mediaAssets[0];
      if (latestAsset) {
        await storage.updateMediaAsset(latestAsset.id, {
          transcription: result.text,
          transcriptionLanguage: result.language,
          duration: result.duration,
        });
      }

      res.json({
        text: result.text,
        language: result.language,
        duration: result.duration,
        audioUrl: publicUrl,
      });
    } catch (error: any) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ error: error.message || "Failed to transcribe audio" });
    }
  });

  // Text to speech
  app.post("/api/audio/speak", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { text, voice, model, conversationId } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Generate speech
      const result = await textToSpeech(
        text,
        voice || "alloy",
        model || "tts-1"
      );

      // Store the audio asset
      const { publicUrl } = await mediaStore.store(
        result.audioData,
        userId,
        "audio",
        result.mimeType,
        conversationId
      );

      res.json({
        audioUrl: publicUrl,
        mimeType: result.mimeType,
      });
    } catch (error: any) {
      console.error("Error generating speech:", error);
      res.status(500).json({ error: error.message || "Failed to generate speech" });
    }
  });

  // Analyze video
  app.post("/api/video/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { videoData, prompt, conversationId } = req.body;

      if (!videoData) {
        return res.status(400).json({ error: "Video data is required" });
      }

      // Convert base64 to buffer
      const videoBuffer = Buffer.from(videoData, "base64");

      // Store the video first
      const mimeType = "video/mp4"; // Default, could be detected
      const { publicUrl } = await mediaStore.store(
        videoBuffer,
        userId,
        "video",
        mimeType,
        conversationId
      );

      // Analyze video
      const analysis = await analyzeVideo(publicUrl, prompt);

      // Update media asset with analysis
      const mediaAssets = await storage.getUserMediaAssets(userId, "video");
      const latestAsset = mediaAssets[0];
      if (latestAsset) {
        await storage.updateMediaAsset(latestAsset.id, {
          transcription: analysis.description,
          metadata: analysis.metadata,
        });
      }

      res.json({
        description: analysis.description,
        transcription: analysis.transcription,
        keyFrames: analysis.keyFrames,
        metadata: analysis.metadata,
        videoUrl: publicUrl,
      });
    } catch (error: any) {
      console.error("Error analyzing video:", error);
      res.status(500).json({ error: error.message || "Failed to analyze video" });
    }
  });

  // Upload video file (multipart)
  app.post("/api/video/upload", isAuthenticated, videoUpload.single("video"), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { prompt, conversationId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "Video file is required" });
      }

      // Store the video
      const { publicUrl } = await mediaStore.store(
        file.buffer,
        userId,
        "video",
        file.mimetype,
        conversationId
      );

      // Analyze video
      const analysis = await analyzeVideo(publicUrl, prompt);

      // Update media asset with analysis
      const mediaAssets = await storage.getUserMediaAssets(userId, "video");
      const latestAsset = mediaAssets[0];
      if (latestAsset) {
        await storage.updateMediaAsset(latestAsset.id, {
          transcription: analysis.description,
          metadata: analysis.metadata,
        });
      }

      res.json({
        description: analysis.description,
        transcription: analysis.transcription,
        keyFrames: analysis.keyFrames,
        metadata: analysis.metadata,
        videoUrl: publicUrl,
      });
    } catch (error: any) {
      console.error("Error uploading video:", error);
      res.status(500).json({ error: error.message || "Failed to upload video" });
    }
  });

  // Get user's media assets
  app.get("/api/media", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { type } = req.query; // "audio" or "video"
      
      const assets = await storage.getUserMediaAssets(
        userId,
        type as "audio" | "video" | undefined
      );

      res.json(assets);
    } catch (error: any) {
      console.error("Error getting media assets:", error);
      res.status(500).json({ error: error.message || "Failed to get media assets" });
    }
  });

  // R2 Diagnostic Endpoint (for debugging)
  app.get("/api/debug/r2", isAuthenticated, async (req: any, res) => {
    try {
      const diagnostics: any = {
        configured: false,
        credentials: {},
        test: null,
        error: null,
      };

      // Check if R2 is configured
      const hasR2Config = 
        process.env.R2_ACCOUNT_ID?.trim() &&
        process.env.R2_ACCESS_KEY_ID?.trim() &&
        process.env.R2_SECRET_ACCESS_KEY?.trim() &&
        process.env.R2_BUCKET_NAME?.trim();

      diagnostics.configured = !!hasR2Config;
      diagnostics.credentials = {
        hasAccountId: !!process.env.R2_ACCOUNT_ID?.trim(),
        hasAccessKeyId: !!process.env.R2_ACCESS_KEY_ID?.trim(),
        hasSecretAccessKey: !!process.env.R2_SECRET_ACCESS_KEY?.trim(),
        hasBucketName: !!process.env.R2_BUCKET_NAME?.trim(),
        hasPublicDomain: !!process.env.R2_PUBLIC_DOMAIN?.trim(),
        accountIdLength: process.env.R2_ACCOUNT_ID?.trim()?.length || 0,
        accessKeyIdLength: process.env.R2_ACCESS_KEY_ID?.trim()?.length || 0,
        secretAccessKeyLength: process.env.R2_SECRET_ACCESS_KEY?.trim()?.length || 0,
        bucketName: process.env.R2_BUCKET_NAME?.trim() || 'not set',
        publicDomain: process.env.R2_PUBLIC_DOMAIN?.trim() || 'not set',
      };

      if (hasR2Config) {
        try {
          // Try to test R2 connection by attempting to list objects (limited to 1)
          const { S3Client, ListObjectsV2Command } = await import("@aws-sdk/client-s3");
          const testClient = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_ACCOUNT_ID?.trim()}.r2.cloudflarestorage.com`,
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim()!,
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim()!,
            },
          });

          const result = await testClient.send(
            new ListObjectsV2Command({
              Bucket: process.env.R2_BUCKET_NAME?.trim()!,
              MaxKeys: 1,
            })
          );

          diagnostics.test = {
            success: true,
            bucketExists: true,
            objectCount: result.KeyCount || 0,
            message: "R2 connection successful",
          };
        } catch (testError: any) {
          diagnostics.test = {
            success: false,
            error: testError.message || String(testError),
            code: testError.Code || testError.code,
            name: testError.name,
            message: "R2 connection test failed",
          };
          diagnostics.error = testError.message || String(testError);
        }
      } else {
        diagnostics.error = "R2 credentials not fully configured";
      }

      res.json(diagnostics);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to run R2 diagnostics",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
