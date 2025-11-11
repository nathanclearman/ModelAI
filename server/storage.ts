import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import {
  users,
  aiModels,
  conversations,
  type User,
  type InsertUser,
  type AIModel,
  type InsertAIModel,
  type Conversation,
  type InsertConversation,
} from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // AI Model methods
  createAIModel(model: InsertAIModel): Promise<AIModel>;
  getAIModel(id: string): Promise<AIModel | undefined>;
  getAllAIModels(): Promise<AIModel[]>;
  updateAIModel(id: string, model: Partial<InsertAIModel>): Promise<AIModel | undefined>;
  deleteAIModel(id: string): Promise<boolean>;
  
  // Conversation methods
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  getConversationsByModel(modelId: string): Promise<Conversation[]>;
  updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // AI Model methods
  async createAIModel(model: InsertAIModel): Promise<AIModel> {
    const result = await db.insert(aiModels).values(model).returning();
    return result[0];
  }

  async getAIModel(id: string): Promise<AIModel | undefined> {
    const result = await db.select().from(aiModels).where(eq(aiModels.id, id));
    return result[0];
  }

  async getAllAIModels(): Promise<AIModel[]> {
    return await db.select().from(aiModels).orderBy(desc(aiModels.createdAt));
  }

  async updateAIModel(id: string, model: Partial<InsertAIModel>): Promise<AIModel | undefined> {
    const result = await db
      .update(aiModels)
      .set(model)
      .where(eq(aiModels.id, id))
      .returning();
    return result[0];
  }

  async deleteAIModel(id: string): Promise<boolean> {
    const result = await db.delete(aiModels).where(eq(aiModels.id, id)).returning();
    return result.length > 0;
  }

  // Conversation methods
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const result = await db.insert(conversations).values(conversation).returning();
    return result[0];
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.id, id));
    return result[0];
  }

  async getAllConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations).orderBy(desc(conversations.updatedAt));
  }

  async getConversationsByModel(modelId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.modelId, modelId))
      .orderBy(desc(conversations.updatedAt));
  }

  async updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const result = await db
      .update(conversations)
      .set({ ...conversation, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return result[0];
  }

  async deleteConversation(id: string): Promise<boolean> {
    const result = await db.delete(conversations).where(eq(conversations.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
