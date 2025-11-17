import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, index, boolean } from "drizzle-orm/pg-core";
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

// Stripe checkout sessions tracking (prevent replay attacks)
export const stripeCheckoutSessions = pgTable("stripe_checkout_sessions", {
  sessionId: varchar("session_id").primaryKey(),
  userId: varchar("user_id").notNull(),
  processed: integer("processed").notNull().default(0),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type StripeCheckoutSession = typeof stripeCheckoutSessions.$inferSelect;

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
  // Coupon code tracking
  couponCode: varchar("coupon_code"),
  couponAppliedAt: timestamp("coupon_applied_at"),
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
  isFavorite: integer("is_favorite").notNull().default(0),
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
  branches: jsonb("branches").default([]), // Array of branch metadata
  activeBranchId: varchar("active_branch_id"), // Currently active branch
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
  documentIds?: string[]; // Optional array of document IDs attached to this message
  messageId?: string; // Unique ID for this message (for branching)
  parentMessageId?: string; // ID of parent message (for branching)
  branchId?: string; // ID of the branch this message belongs to
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

// Documents table for uploaded document analysis
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  conversationId: varchar("conversation_id"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // pdf, docx, txt, md
  mimeType: text("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  storageKey: text("storage_key").notNull(), // Path/key in storage
  publicUrl: text("public_url").notNull(), // URL to access the document
  extractedText: text("extracted_text"), // Full extracted text
  textChunks: jsonb("text_chunks"), // Array of text chunks for large documents
  summary: text("summary"), // AI-generated summary of document
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // For cleanup if needed
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

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

// Workflow automation tables
export const workflowTriggerTypes = ["manual", "schedule", "webhook"] as const;
export type WorkflowTriggerType = typeof workflowTriggerTypes[number];

export const workflowStepTypes = [
  "ai_chat",
  "ai_image_generation", 
  "ai_image_analysis",
  "document_analysis",
  "email",
  "webhook",
  "delay"
] as const;
export type WorkflowStepType = typeof workflowStepTypes[number];

export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull().default("manual"),
  triggerConfig: jsonb("trigger_config"),
  steps: jsonb("steps").notNull().default([]),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

export const workflowRunStatuses = ["pending", "running", "completed", "failed"] as const;
export type WorkflowRunStatus = typeof workflowRunStatuses[number];

export const workflowRuns = pgTable("workflow_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull(),
  userId: varchar("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  input: jsonb("input"),
  output: jsonb("output"),
  error: text("error"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertWorkflowRunSchema = createInsertSchema(workflowRuns).omit({
  id: true,
  startedAt: true,
});

export type InsertWorkflowRun = z.infer<typeof insertWorkflowRunSchema>;
export type WorkflowRun = typeof workflowRuns.$inferSelect;

// Webhook configurations for reusable webhook endpoints
export const webhookConfigurations = pgTable("webhook_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  name: text("name").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  method: text("method").notNull().default("POST"),
  headers: jsonb("headers").default({}),
  bodyTemplate: jsonb("body_template"),
  authType: text("auth_type"),
  authConfig: jsonb("auth_config"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_webhook_configs_user").on(table.userId),
  index("idx_webhook_configs_workspace").on(table.workspaceId),
]);

export const insertWebhookConfigurationSchema = createInsertSchema(webhookConfigurations).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWebhookConfiguration = z.infer<typeof insertWebhookConfigurationSchema>;
export type WebhookConfiguration = typeof webhookConfigurations.$inferSelect;

// Fine-tuning files storage
export const fineTuningFiles = pgTable("fine_tuning_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  openaiFileId: varchar("openai_file_id"),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  purpose: text("purpose").notNull().default("fine-tune"),
  exampleCount: integer("example_count"),
  status: text("status").notNull().default("uploaded"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFineTuningFileSchema = createInsertSchema(fineTuningFiles).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertFineTuningFile = z.infer<typeof insertFineTuningFileSchema>;
export type FineTuningFile = typeof fineTuningFiles.$inferSelect;

// Conversation branches for branching feature
export const conversationBranches = pgTable("conversation_branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  parentMessageId: varchar("parent_message_id").notNull(), // Message where branch was created
  branchName: text("branch_name"),
  messages: jsonb("messages").notNull().default([]), // Messages in this branch
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_conversation_branches_conversation").on(table.conversationId),
  index("idx_conversation_branches_parent").on(table.parentMessageId),
]);

export type ConversationBranch = typeof conversationBranches.$inferSelect;
export type InsertConversationBranch = typeof conversationBranches.$inferInsert;

// Prompt templates for prompt engineering
export const promptTemplates = pgTable("prompt_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // e.g., "coding", "writing", "analysis"
  prompt: text("prompt").notNull(), // Template with {{variables}}
  variables: jsonb("variables").default([]), // Array of variable definitions
  modelId: varchar("model_id"), // Default model to use
  isPublic: integer("is_public").notNull().default(0),
  isFavorite: integer("is_favorite").notNull().default(0),
  usageCount: integer("usage_count").notNull().default(0),
  rating: integer("rating").default(0), // Average rating
  ratingCount: integer("rating_count").notNull().default(0),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_prompt_templates_user").on(table.userId),
  index("idx_prompt_templates_public").on(table.isPublic),
  index("idx_prompt_templates_category").on(table.category),
]);

export const insertPromptTemplateSchema = createInsertSchema(promptTemplates).omit({
  id: true,
  userId: true,
  usageCount: true,
  ratingCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPromptTemplate = z.infer<typeof insertPromptTemplateSchema>;
export type PromptTemplate = typeof promptTemplates.$inferSelect;

// Prompt template ratings
export const promptTemplateRatings = pgTable("prompt_template_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull(),
  userId: varchar("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_prompt_ratings_template").on(table.templateId),
  index("idx_prompt_ratings_user").on(table.userId),
]);

export type PromptTemplateRating = typeof promptTemplateRatings.$inferSelect;

// Integration connections (Zapier, Make.com, etc.)
export const integrationTypes = ["zapier", "make", "n8n", "custom"] as const;
export type IntegrationType = typeof integrationTypes[number];

export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
  type: text("type").notNull(), // zapier, make, n8n, custom
  name: text("name").notNull(),
  description: text("description"),
  apiKey: text("api_key").notNull(), // API key for this integration
  webhookUrl: text("webhook_url"), // Webhook URL for receiving events
  config: jsonb("config").default({}), // Integration-specific config
  enabled: boolean("enabled").notNull().default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_integrations_user").on(table.userId),
  index("idx_integrations_type").on(table.type),
  index("idx_integrations_api_key").on(table.apiKey),
]);

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  userId: true,
  apiKey: true,
  lastUsed: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

// Integration events (for triggers)
export const integrationEvents = pgTable("integration_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").notNull(),
  eventType: text("event_type").notNull(), // new_message, model_created, etc.
  eventData: jsonb("event_data").notNull(),
  delivered: boolean("delivered").notNull().default(false),
  deliveredAt: timestamp("delivered_at"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_integration_events_integration").on(table.integrationId),
  index("idx_integration_events_type").on(table.eventType),
  index("idx_integration_events_delivered").on(table.delivered),
]);

export type IntegrationEvent = typeof integrationEvents.$inferSelect;
export type InsertIntegrationEvent = typeof integrationEvents.$inferInsert;

// Audio/Video assets for voice and video features
export const mediaAssets = pgTable("media_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  conversationId: varchar("conversation_id"),
  mediaType: text("media_type").notNull(), // "audio", "video"
  contentType: text("content_type").notNull(), // MIME type
  storageKey: text("storage_key").notNull(),
  publicUrl: text("public_url").notNull(),
  byteSize: integer("byte_size").notNull(),
  duration: integer("duration"), // Duration in seconds (for audio/video)
  transcription: text("transcription"), // Transcribed text (for audio/video)
  transcriptionLanguage: text("transcription_language"), // Language code (e.g., "en")
  metadata: jsonb("metadata").default({}), // Additional metadata
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_media_assets_user").on(table.userId),
  index("idx_media_assets_conversation").on(table.conversationId),
  index("idx_media_assets_type").on(table.mediaType),
]);

export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({
  id: true,
  createdAt: true,
});

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;

// Multi-model workflow steps (extends existing workflow system)
// Workflow steps now support: parallel execution, conditional logic, model chaining
export type WorkflowStep = {
  id: string;
  type: "ai_chat" | "ai_image_generation" | "ai_image_analysis" | "condition" | "parallel" | "merge" | "delay";
  modelId?: string; // For AI steps
  prompt?: string; // For AI steps
  condition?: {
    field: string; // Field from previous step output
    operator: "equals" | "contains" | "greater_than" | "less_than";
    value: any;
  };
  parallelSteps?: string[]; // IDs of steps to run in parallel
  delayMs?: number; // For delay steps
  nextStepId?: string; // Next step after this one
  onSuccessStepId?: string; // For conditional steps
  onFailureStepId?: string; // For conditional steps
  config?: Record<string, any>; // Additional step-specific config
};

// Fine-tuning jobs
export const fineTuningJobs = pgTable("fine_tuning_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  openaiJobId: varchar("openai_job_id"),
  trainingFileId: varchar("training_file_id").notNull(),
  validationFileId: varchar("validation_file_id"),
  baseModel: text("base_model").notNull(),
  fineTunedModel: text("fine_tuned_model"),
  suffix: text("suffix"),
  hyperparameters: jsonb("hyperparameters").default({}),
  status: text("status").notNull().default("pending"),
  trainedTokens: integer("trained_tokens"),
  estimatedCost: integer("estimated_cost"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  finishedAt: timestamp("finished_at"),
});

export const insertFineTuningJobSchema = createInsertSchema(fineTuningJobs).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFineTuningJob = z.infer<typeof insertFineTuningJobSchema>;
export type FineTuningJob = typeof fineTuningJobs.$inferSelect;

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
