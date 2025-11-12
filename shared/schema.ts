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
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  model: text("model").notNull(),
  temperature: integer("temperature").notNull().default(70),
  maxTokens: integer("max_tokens").notNull().default(1000),
  template: text("template"),
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
