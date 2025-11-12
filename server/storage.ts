import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import {
  users,
  aiModels,
  conversations,
  type User,
  type UpsertUser,
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
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: { firstName?: string | null; lastName?: string | null; companyName?: string | null }): Promise<User | undefined>;
  
  // AI Model methods (all scoped to userId)
  createAIModel(userId: string, model: InsertAIModel): Promise<AIModel>;
  getAIModel(userId: string, id: string): Promise<AIModel | undefined>;
  getAllAIModels(userId: string): Promise<AIModel[]>;
  updateAIModel(userId: string, id: string, model: Partial<InsertAIModel>): Promise<AIModel | undefined>;
  deleteAIModel(userId: string, id: string): Promise<boolean>;
  
  // Conversation methods (all scoped to userId)
  createConversation(userId: string, conversation: InsertConversation): Promise<Conversation>;
  getConversation(userId: string, id: string): Promise<Conversation | undefined>;
  getAllConversations(userId: string): Promise<Conversation[]>;
  getConversationsByModel(userId: string, modelId: string): Promise<Conversation[]>;
  updateConversation(userId: string, id: string, conversation: Partial<InsertConversation>): Promise<Conversation | undefined>;
  deleteConversation(userId: string, id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: { firstName?: string | null; lastName?: string | null; companyName?: string | null }): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // AI Model methods (all scoped to userId)
  async createAIModel(userId: string, model: InsertAIModel): Promise<AIModel> {
    const result = await db.insert(aiModels).values({ ...model, userId }).returning();
    return result[0];
  }

  async getAIModel(userId: string, id: string): Promise<AIModel | undefined> {
    const result = await db
      .select()
      .from(aiModels)
      .where(and(eq(aiModels.id, id), eq(aiModels.userId, userId)));
    return result[0];
  }

  async getAllAIModels(userId: string): Promise<AIModel[]> {
    return await db
      .select()
      .from(aiModels)
      .where(eq(aiModels.userId, userId))
      .orderBy(desc(aiModels.createdAt));
  }

  async updateAIModel(userId: string, id: string, model: Partial<InsertAIModel>): Promise<AIModel | undefined> {
    const result = await db
      .update(aiModels)
      .set(model)
      .where(and(eq(aiModels.id, id), eq(aiModels.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteAIModel(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(aiModels)
      .where(and(eq(aiModels.id, id), eq(aiModels.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Conversation methods (all scoped to userId)
  async createConversation(userId: string, conversation: InsertConversation): Promise<Conversation> {
    const result = await db.insert(conversations).values({ ...conversation, userId }).returning();
    return result[0];
  }

  async getConversation(userId: string, id: string): Promise<Conversation | undefined> {
    const result = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
    return result[0];
  }

  async getAllConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversationsByModel(userId: string, modelId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.modelId, modelId), eq(conversations.userId, userId)))
      .orderBy(desc(conversations.updatedAt));
  }

  async updateConversation(userId: string, id: string, conversation: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const result = await db
      .update(conversations)
      .set({ ...conversation, updatedAt: new Date() })
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteConversation(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
