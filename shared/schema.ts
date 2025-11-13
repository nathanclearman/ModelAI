import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Subscription tier enum
export const subscriptionTiers = ["free", "pro", "enterprise"] as const;
export type SubscriptionTier = typeof subscriptionTiers[number];

// Subscription status enum
export const subscriptionStatuses = ["active", "canceled", "past_due", "incomplete", "trialing"] as const;
export type SubscriptionStatus = typeof subscriptionStatuses[number];

// User storage table (updated for Replit Auth and Stripe integration)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  companyName: varchar("company_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: integer("is_admin").notNull().default(0),
  // Stripe subscription fields
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  subscriptionStatus: text("subscription_status").default("active"),
  billingPeriodEnd: timestamp("billing_period_end"),
  // Usage tracking
  messageQuota: integer("message_quota").notNull().default(100),
  messagesUsed: integer("messages_used").notNull().default(0),
  imageQuota: integer("image_quota").notNull().default(10),
  imagesUsed: integer("images_used").notNull().default(0),
  // Newsletter subscription
  newsletterSubscribed: integer("newsletter_subscribed").notNull().default(0),
  newsletterSubscribedAt: timestamp("newsletter_subscribed_at"),
  // Email verification
  emailVerified: integer("email_verified").notNull().default(0),
  verificationToken: varchar("verification_token"),
  verificationSentAt: timestamp("verification_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Update user profile schema (only allows updating specific fields)
export const updateUserProfileSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
});

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

// Model type enum
export const modelTypes = ["chat", "image-generator"] as const;
export type ModelType = typeof modelTypes[number];

export const aiModels = pgTable("ai_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  modelType: text("model_type").notNull().default("chat"),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  model: text("model").notNull(),
  temperature: integer("temperature").notNull().default(70),
  maxTokens: integer("max_tokens").notNull().default(1000),
  template: text("template"),
  isPublic: integer("is_public").notNull().default(0),
  category: text("category"),
  tags: text("tags").array(),
  likesCount: integer("likes_count").notNull().default(0),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAIModelSchema = createInsertSchema(aiModels).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  model: z.string().min(1, "Model is required"),
});

export type InsertAIModel = z.infer<typeof insertAIModelSchema>;
export type AIModel = typeof aiModels.$inferSelect;

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  modelId: varchar("model_id").notNull(),
  title: text("title").notNull(),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  imageUrl?: string; // Optional image URL (from object storage, not base64)
  imageType?: "upload" | "generated"; // Track if image was uploaded or AI-generated
};

// Image assets table for generated/uploaded images
export const imageAssets = pgTable("image_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  storageKey: text("storage_key").notNull(), // Path/key in object storage or /tmp
  publicUrl: text("public_url").notNull(), // URL to access the image
  mimeType: text("mime_type").notNull().default("image/png"),
  byteSize: integer("byte_size").notNull(),
  imageType: text("image_type").notNull(), // "generated" or "upload"
  prompt: text("prompt"), // For generated images
  expiresAt: timestamp("expires_at"), // For temp storage cleanup
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ImageAsset = typeof imageAssets.$inferSelect;
export type InsertImageAsset = typeof imageAssets.$inferInsert;

// Usage tracking table for analytics
export const usageLogs = pgTable("usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  modelId: varchar("model_id").notNull(),
  conversationId: varchar("conversation_id"),
  promptTokens: integer("prompt_tokens").notNull().default(0),
  completionTokens: integer("completion_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  model: text("model").notNull(),
  costUsd: text("cost_usd").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = typeof usageLogs.$inferInsert;

// Model likes table for marketplace
export const modelLikes = pgTable("model_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  modelId: varchar("model_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ModelLike = typeof modelLikes.$inferSelect;

// Workspaces for team collaboration
export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;

// Workspace member roles enum
export const workspaceRoles = ["owner", "admin", "editor", "viewer"] as const;
export type WorkspaceRole = typeof workspaceRoles[number];

// Workspace members with role-based access
export const workspaceMembers = pgTable("workspace_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default("viewer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkspaceMemberSchema = createInsertSchema(workspaceMembers).omit({
  id: true,
  createdAt: true,
}).extend({
  role: z.enum(workspaceRoles),
});

export type InsertWorkspaceMember = z.infer<typeof insertWorkspaceMemberSchema>;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;

// API keys for model access
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  modelId: varchar("model_id"),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  userId: true,
  key: true,
  lastUsed: true,
  createdAt: true,
});

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// Model versions for tracking changes over time
// Note: versionNumber is auto-incremented per model within transactions to prevent race conditions
export const modelVersions = pgTable("model_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: varchar("model_id").notNull(),
  versionNumber: integer("version_number").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  model: text("model").notNull(),
  temperature: integer("temperature").notNull().default(70),
  maxTokens: integer("max_tokens").notNull().default(1000),
  template: text("template"),
  category: text("category"),
  tags: text("tags").array(),
  changeDescription: text("change_description"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_model_versions_model").on(table.modelId),
  index("idx_model_versions_created").on(table.createdAt),
]);

export const insertModelVersionSchema = createInsertSchema(modelVersions).omit({
  id: true,
  createdAt: true,
});

export type InsertModelVersion = z.infer<typeof insertModelVersionSchema>;
export type ModelVersion = typeof modelVersions.$inferSelect;

// Generated images table for Gemini image generation
export const generatedImages = pgTable("generated_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  modelId: varchar("model_id"),
  prompt: text("prompt").notNull(),
  imageData: text("image_data").notNull(),
  mimeType: text("mime_type").notNull().default("image/png"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_generated_images_user").on(table.userId),
  index("idx_generated_images_model").on(table.modelId),
  index("idx_generated_images_created").on(table.createdAt),
]);

export const insertGeneratedImageSchema = createInsertSchema(generatedImages).omit({
  id: true,
  createdAt: true,
});

export type InsertGeneratedImage = z.infer<typeof insertGeneratedImageSchema>;
export type GeneratedImage = typeof generatedImages.$inferSelect;

// Subscription plan configuration (server-side only, not stored in DB)
export const subscriptionPlans = {
  free: {
    name: "Free",
    price: 0,
    messageQuota: 100,
    imageQuota: 10,
    features: ["100 chat messages/month", "10 images/month", "Basic models", "Community support"],
  },
  pro: {
    name: "Pro",
    price: 20,
    messageQuota: 1000,
    imageQuota: 100,
    features: ["1,000 chat messages/month", "100 images/month", "Advanced models", "Priority support", "API access"],
  },
  enterprise: {
    name: "Enterprise",
    price: 100,
    messageQuota: 10000,
    imageQuota: 1000,
    features: ["10,000 chat messages/month", "1,000 images/month", "All models", "24/7 support", "Team workspaces", "Custom integrations"],
  },
} as const;
