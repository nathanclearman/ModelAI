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

// User storage table (updated for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  companyName: varchar("company_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: integer("is_admin").notNull().default(0),
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

export const aiModels = pgTable("ai_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  workspaceId: varchar("workspace_id"),
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
};

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
