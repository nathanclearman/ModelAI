import { eq, desc, and, sql, sum, count, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import {
  users,
  aiModels,
  conversations,
  usageLogs,
  modelLikes,
  workspaces,
  workspaceMembers,
  apiKeys,
  modelVersions,
  imageAssets,
  documents,
  stripeCheckoutSessions,
  type User,
  type UpsertUser,
  type AIModel,
  type InsertAIModel,
  type Conversation,
  type InsertConversation,
  type UsageLog,
  type InsertUsageLog,
  type ModelLike,
  type Workspace,
  type InsertWorkspace,
  type WorkspaceMember,
  type InsertWorkspaceMember,
  type ApiKey,
  type InsertApiKey,
  type ModelVersion,
  type InsertModelVersion,
  type ImageAsset,
  type InsertImageAsset,
  type Document,
  type InsertDocument,
  type StripeCheckoutSession,
} from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export type UserCostStat = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  messageQuota: number;
  messagesUsed: number;
  totalMessages: number;
  totalCost: string;
};

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: { firstName?: string | null; lastName?: string | null; companyName?: string | null }): Promise<User | undefined>;
  updateNewsletterSubscription(userId: string, subscribed: boolean): Promise<User | undefined>;
  applyCoupon(userId: string, couponCode: string, tier: string, imageQuota: number, messageQuota: number): Promise<User | undefined>;
  updateUserSubscription(userId: string, tier: string, messageQuota: number, imageQuota: number): Promise<User | undefined>;
  isStripeSessionProcessed(sessionId: string): Promise<boolean>;
  markStripeSessionProcessed(sessionId: string, userId: string): Promise<void>;
  processStripePayment(sessionId: string, userId: string, tier: string, messageQuota: number, imageQuota: number): Promise<User | undefined>;
  getNewsletterSubscribers(): Promise<Array<{ email: string; firstName: string | null; lastName: string | null }>>;
  incrementUserMessages(userId: string): Promise<void>;
  createVerificationToken(userId: string, token: string): Promise<void>;
  verifyEmail(token: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  
  // AI Model methods (all scoped to userId)
  createAIModel(userId: string, model: InsertAIModel): Promise<AIModel>;
  getAIModel(userId: string, id: string): Promise<AIModel | undefined>;
  getAllAIModels(userId: string): Promise<AIModel[]>;
  updateAIModel(userId: string, id: string, model: Partial<InsertAIModel>): Promise<AIModel | undefined>;
  deleteAIModel(userId: string, id: string): Promise<boolean>;
  toggleModelFavorite(userId: string, modelId: string): Promise<AIModel | undefined>;
  
  // Conversation methods (all scoped to userId)
  createConversation(userId: string, conversation: InsertConversation): Promise<Conversation>;
  getConversation(userId: string, id: string): Promise<Conversation | undefined>;
  getAllConversations(userId: string): Promise<Conversation[]>;
  getConversationsByModel(userId: string, modelId: string): Promise<Conversation[]>;
  updateConversation(userId: string, id: string, conversation: Partial<InsertConversation>): Promise<Conversation | undefined>;
  deleteConversation(userId: string, id: string): Promise<boolean>;
  
  // Usage tracking methods
  logUsage(usage: InsertUsageLog): Promise<UsageLog>;
  getUserUsageStats(userId: string, days?: number): Promise<{
    totalTokens: number;
    totalCost: number;
    usageByModel: Array<{ model: string; tokens: number }>;
    usageOverTime: Array<{ date: string; tokens: number }>;
  }>;
  getModelUsageStats(userId: string, modelId: string): Promise<{
    totalTokens: number;
    totalConversations: number;
    averageTokensPerConversation: number;
  }>;
  
  // Marketplace methods
  getPublicModels(category?: string, tags?: string[]): Promise<Array<AIModel & { creatorName: string }>>;
  likeModel(userId: string, modelId: string): Promise<boolean>;
  unlikeModel(userId: string, modelId: string): Promise<boolean>;
  isModelLiked(userId: string, modelId: string): Promise<boolean>;
  cloneModel(userId: string, modelId: string): Promise<AIModel>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  getAdminStats(): Promise<{
    totalUsers: number;
    totalModels: number;
    totalConversations: number;
    recentUsers: User[];
  }>;
  getUserCostStats(): Promise<UserCostStat[]>;
  updateUserAdminStatus(userId: string, isAdmin: number): Promise<User | undefined>;
  incrementImageUsage(userId: string): Promise<User | undefined>;
  
  // Image asset methods
  createImageAsset(asset: InsertImageAsset): Promise<ImageAsset>;
  getImageAsset(id: string): Promise<ImageAsset | undefined>;
  getUserImageAssets(userId: string): Promise<ImageAsset[]>;
  getExpiredImageAssets(): Promise<ImageAsset[]>;
  deleteImageAsset(id: string): Promise<boolean>;
  
  // Document methods (scoped to userId)
  createDocument(userId: string, document: Omit<InsertDocument, 'userId'>): Promise<Document>;
  getDocument(userId: string, id: string): Promise<Document | undefined>;
  getUserDocuments(userId: string): Promise<Document[]>;
  getConversationDocuments(userId: string, conversationId: string): Promise<Document[]>;
  deleteDocument(userId: string, id: string): Promise<boolean>;
  
  // Workspace methods
  createWorkspace(userId: string, workspace: InsertWorkspace): Promise<Workspace>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  getUserWorkspaces(userId: string): Promise<Workspace[]>;
  updateWorkspace(id: string, workspace: Partial<InsertWorkspace>): Promise<Workspace | undefined>;
  deleteWorkspace(id: string): Promise<boolean>;
  
  // Workspace member methods
  addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember>;
  getWorkspaceMembers(workspaceId: string): Promise<Array<WorkspaceMember & { user: User }>>;
  updateWorkspaceMemberRole(workspaceId: string, userId: string, role: string): Promise<WorkspaceMember | undefined>;
  removeWorkspaceMember(workspaceId: string, userId: string): Promise<boolean>;
  getUserWorkspaceRole(userId: string, workspaceId: string): Promise<string | null>;
  
  // API key methods
  createApiKey(userId: string, apiKeyData: InsertApiKey & { key: string }): Promise<ApiKey>;
  getApiKey(hashedKey: string): Promise<ApiKey | undefined>;
  getUserApiKeys(userId: string): Promise<ApiKey[]>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  deleteApiKey(userId: string, id: string): Promise<boolean>;
  
  // Model version methods
  getModelVersions(modelId: string): Promise<ModelVersion[]>;
  getModelVersion(modelId: string, versionNumber: number): Promise<ModelVersion | undefined>;
  createModelVersion(version: InsertModelVersion): Promise<ModelVersion>;
  getLatestVersionNumber(modelId: string): Promise<number>;
  restoreModelVersion(userId: string, modelId: string, versionNumber: number): Promise<AIModel | undefined>;
  deleteModelVersion(versionId: string): Promise<boolean>;
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

  async updateNewsletterSubscription(userId: string, subscribed: boolean): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ 
        newsletterSubscribed: subscribed ? 1 : 0,
        newsletterSubscribedAt: subscribed ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async applyCoupon(userId: string, couponCode: string, tier: string, imageQuota: number, messageQuota: number): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({
        couponCode,
        couponAppliedAt: new Date(),
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        imageQuota,
        messageQuota,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserSubscription(userId: string, tier: string, messageQuota: number, imageQuota: number): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        messageQuota,
        imageQuota,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async isStripeSessionProcessed(sessionId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(stripeCheckoutSessions)
      .where(eq(stripeCheckoutSessions.sessionId, sessionId))
      .limit(1);
    return result.length > 0 && result[0].processed === 1;
  }

  async markStripeSessionProcessed(sessionId: string, userId: string): Promise<void> {
    await db
      .insert(stripeCheckoutSessions)
      .values({
        sessionId,
        userId,
        processed: 1,
        processedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: stripeCheckoutSessions.sessionId,
        set: {
          processed: 1,
          processedAt: new Date(),
        },
      });
  }

  async processStripePayment(sessionId: string, userId: string, tier: string, messageQuota: number, imageQuota: number): Promise<User | undefined> {
    return await db.transaction(async (tx) => {
      const existingSession = await tx
        .select()
        .from(stripeCheckoutSessions)
        .where(eq(stripeCheckoutSessions.sessionId, sessionId))
        .limit(1);

      if (existingSession.length > 0 && existingSession[0].processed === 1) {
        throw new Error("Payment session already processed");
      }

      await tx
        .insert(stripeCheckoutSessions)
        .values({
          sessionId,
          userId,
          processed: 1,
          processedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: stripeCheckoutSessions.sessionId,
          set: {
            processed: 1,
            processedAt: new Date(),
          },
        });

      const result = await tx
        .update(users)
        .set({
          subscriptionTier: tier,
          subscriptionStatus: 'active',
          messageQuota,
          imageQuota,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      return result[0];
    });
  }

  async getNewsletterSubscribers(): Promise<Array<{ email: string; firstName: string | null; lastName: string | null }>> {
    const subscribers = await db
      .select({
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.newsletterSubscribed, 1));
    return subscribers;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async incrementUserMessages(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ messagesUsed: sql`${users.messagesUsed} + 1` })
      .where(eq(users.id, userId));
  }

  async createVerificationToken(userId: string, token: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        verificationToken: token,
        verificationSentAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async verifyEmail(token: string): Promise<User | undefined> {
    // First get the user to check token expiration
    const user = await this.getUserByVerificationToken(token);
    if (!user || !user.verificationSentAt) {
      return undefined;
    }

    // Check if token is expired (24 hours)
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const sentAt = new Date(user.verificationSentAt).getTime();
    const now = Date.now();
    if (now - sentAt > expirationTime) {
      return undefined; // Token expired
    }

    // Verify and clear token
    const result = await db
      .update(users)
      .set({ 
        emailVerified: 1,
        verificationToken: null,
        verificationSentAt: null,
        updatedAt: new Date()
      })
      .where(eq(users.verificationToken, token))
      .returning();
    return result[0];
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, token));
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
      .orderBy(desc(aiModels.isFavorite), desc(aiModels.createdAt));
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

  async toggleModelFavorite(userId: string, modelId: string): Promise<AIModel | undefined> {
    const model = await this.getAIModel(userId, modelId);
    if (!model) return undefined;
    
    const newFavoriteStatus = model.isFavorite ? 0 : 1;
    const result = await db
      .update(aiModels)
      .set({ isFavorite: newFavoriteStatus })
      .where(and(eq(aiModels.id, modelId), eq(aiModels.userId, userId)))
      .returning();
    return result[0];
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

  // Usage tracking methods
  async logUsage(usage: InsertUsageLog): Promise<UsageLog> {
    const [log] = await db.insert(usageLogs).values(usage).returning();
    return log;
  }

  async getUserUsageStats(userId: string, days: number = 30): Promise<{
    totalTokens: number;
    totalCost: number;
    usageByModel: Array<{ model: string; tokens: number }>;
    usageOverTime: Array<{ date: string; tokens: number }>;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get total tokens
    const allUsage = await db
      .select()
      .from(usageLogs)
      .where(and(
        eq(usageLogs.userId, userId),
        sql`${usageLogs.createdAt} >= ${cutoffDate}`
      ));

    const totalTokens = allUsage.reduce((sum, log) => sum + log.totalTokens, 0);
    
    // Estimate cost (rough estimates per 1K tokens)
    const costPerModel: Record<string, number> = {
      'gpt-4o': 0.005,
      'gpt-4o-mini': 0.0005,
      'gpt-4': 0.03,
      'gpt-3.5-turbo': 0.001,
      'default': 0.002
    };
    
    const totalCost = allUsage.reduce((sum, log) => {
      const costPer1k = costPerModel[log.model] || costPerModel['default'];
      return sum + (log.totalTokens / 1000) * costPer1k;
    }, 0);

    // Usage by model
    const usageByModelMap = new Map<string, number>();
    allUsage.forEach(log => {
      const current = usageByModelMap.get(log.model) || 0;
      usageByModelMap.set(log.model, current + log.totalTokens);
    });
    const usageByModel = Array.from(usageByModelMap.entries()).map(([model, tokens]) => ({
      model,
      tokens
    }));

    // Usage over time (daily)
    const usageByDate = new Map<string, number>();
    allUsage.forEach(log => {
      const date = new Date(log.createdAt).toISOString().split('T')[0];
      const current = usageByDate.get(date) || 0;
      usageByDate.set(date, current + log.totalTokens);
    });
    const usageOverTime = Array.from(usageByDate.entries())
      .map(([date, tokens]) => ({ date, tokens }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalTokens,
      totalCost,
      usageByModel,
      usageOverTime,
    };
  }

  async getModelUsageStats(userId: string, modelId: string): Promise<{
    totalTokens: number;
    totalConversations: number;
    averageTokensPerConversation: number;
  }> {
    const modelUsage = await db
      .select()
      .from(usageLogs)
      .where(and(
        eq(usageLogs.userId, userId),
        eq(usageLogs.modelId, modelId)
      ));

    const totalTokens = modelUsage.reduce((sum, log) => sum + log.totalTokens, 0);
    const uniqueConversations = new Set(modelUsage.map(log => log.conversationId).filter(Boolean));
    const totalConversations = uniqueConversations.size;
    const averageTokensPerConversation = totalConversations > 0 
      ? Math.round(totalTokens / totalConversations)
      : 0;

    return {
      totalTokens,
      totalConversations,
      averageTokensPerConversation,
    };
  }

  // Marketplace methods
  async getPublicModels(category?: string, tags?: string[]): Promise<Array<AIModel & { creatorName: string }>> {
    let query = db
      .select({
        model: aiModels,
        user: users,
      })
      .from(aiModels)
      .leftJoin(users, eq(aiModels.userId, users.id))
      .where(eq(aiModels.isPublic, 1))
      .orderBy(desc(aiModels.likesCount), desc(aiModels.createdAt));

    const results = await query;
    
    return results.map(row => ({
      ...row.model,
      creatorName: row.user ? `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() || row.user.email.split('@')[0] : 'Unknown',
    }));
  }

  async likeModel(userId: string, modelId: string): Promise<boolean> {
    // Check if already liked
    const existing = await db
      .select()
      .from(modelLikes)
      .where(and(eq(modelLikes.userId, userId), eq(modelLikes.modelId, modelId)));

    if (existing.length > 0) {
      return false; // Already liked
    }

    // Add like
    await db.insert(modelLikes).values({ userId, modelId });

    // Increment likes count
    await db
      .update(aiModels)
      .set({ likesCount: sql`${aiModels.likesCount} + 1` })
      .where(eq(aiModels.id, modelId));

    return true;
  }

  async unlikeModel(userId: string, modelId: string): Promise<boolean> {
    const result = await db
      .delete(modelLikes)
      .where(and(eq(modelLikes.userId, userId), eq(modelLikes.modelId, modelId)))
      .returning();

    if (result.length > 0) {
      // Decrement likes count
      await db
        .update(aiModels)
        .set({ likesCount: sql`${aiModels.likesCount} - 1` })
        .where(eq(aiModels.id, modelId));
      return true;
    }

    return false;
  }

  async isModelLiked(userId: string, modelId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(modelLikes)
      .where(and(eq(modelLikes.userId, userId), eq(modelLikes.modelId, modelId)));

    return result.length > 0;
  }

  async cloneModel(userId: string, modelId: string): Promise<AIModel> {
    // Get the original model (must be public)
    const [original] = await db
      .select()
      .from(aiModels)
      .where(and(eq(aiModels.id, modelId), eq(aiModels.isPublic, 1)));

    if (!original) {
      throw new Error("Model not found or not public");
    }

    // Increment usage count on original
    await db
      .update(aiModels)
      .set({ usageCount: sql`${aiModels.usageCount} + 1` })
      .where(eq(aiModels.id, modelId));

    // Create clone for the user
    const [cloned] = await db
      .insert(aiModels)
      .values({
        userId,
        name: `${original.name} (Clone)`,
        description: original.description,
        systemPrompt: original.systemPrompt,
        model: original.model,
        temperature: original.temperature,
        maxTokens: original.maxTokens,
        template: original.template,
        category: original.category,
        tags: original.tags,
        isPublic: 0, // Clones are private by default
      })
      .returning();

    return cloned;
  }

  // Admin methods
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalModels: number;
    totalConversations: number;
    recentUsers: User[];
  }> {
    const allUsers = await db.select().from(users);
    const allModels = await db.select().from(aiModels);
    const allConversations = await db.select().from(conversations);
    const recentUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    return {
      totalUsers: allUsers.length,
      totalModels: allModels.length,
      totalConversations: allConversations.length,
      recentUsers,
    };
  }

  async getUserCostStats(): Promise<Array<{
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    messageQuota: number;
    messagesUsed: number;
    totalMessages: number;
    totalCost: string;
  }>> {
    const result = await db
      .select({
        userId: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        messageQuota: users.messageQuota,
        messagesUsed: users.messagesUsed,
        totalMessages: sql<number>`COALESCE(COUNT(${usageLogs.id}), 0)`,
        totalCost: sql<string>`COALESCE(SUM(CAST(${usageLogs.costUsd} AS DECIMAL)), 0)`,
      })
      .from(users)
      .leftJoin(usageLogs, eq(users.id, usageLogs.userId))
      .groupBy(users.id)
      .orderBy(desc(sql`COALESCE(SUM(CAST(${usageLogs.costUsd} AS DECIMAL)), 0)`));
    
    return result;
  }

  async updateUserAdminStatus(userId: string, isAdmin: number): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ isAdmin, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async incrementImageUsage(userId: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const result = await db
      .update(users)
      .set({ imagesUsed: user.imagesUsed + 1, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // Workspace methods
  async createWorkspace(userId: string, workspace: InsertWorkspace): Promise<Workspace> {
    const [created] = await db
      .insert(workspaces)
      .values({ ...workspace, ownerId: userId })
      .returning();

    // Auto-add owner as admin member
    await db.insert(workspaceMembers).values({
      workspaceId: created.id,
      userId,
      role: "owner",
    });

    return created;
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const result = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id));
    return result[0];
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const result = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        description: workspaces.description,
        ownerId: workspaces.ownerId,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })
      .from(workspaces)
      .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, userId))
      .orderBy(desc(workspaces.createdAt));
    
    return result;
  }

  async updateWorkspace(id: string, workspace: Partial<InsertWorkspace>): Promise<Workspace | undefined> {
    const result = await db
      .update(workspaces)
      .set({ ...workspace, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();
    return result[0];
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    // Delete workspace members first
    await db.delete(workspaceMembers).where(eq(workspaceMembers.workspaceId, id));
    
    // Delete the workspace
    const result = await db
      .delete(workspaces)
      .where(eq(workspaces.id, id))
      .returning();
    return result.length > 0;
  }

  // Workspace member methods
  async addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const [created] = await db
      .insert(workspaceMembers)
      .values(member)
      .returning();
    return created;
  }

  async getWorkspaceMembers(workspaceId: string): Promise<Array<WorkspaceMember & { user: User }>> {
    const result = await db
      .select()
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    return result.map(r => ({
      ...r.workspace_members,
      user: r.users,
    }));
  }

  async updateWorkspaceMemberRole(workspaceId: string, userId: string, role: string): Promise<WorkspaceMember | undefined> {
    const result = await db
      .update(workspaceMembers)
      .set({ role })
      .where(and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      ))
      .returning();
    return result[0];
  }

  async removeWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      ))
      .returning();
    return result.length > 0;
  }

  async getUserWorkspaceRole(userId: string, workspaceId: string): Promise<string | null> {
    const result = await db
      .select()
      .from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.workspaceId, workspaceId)
      ));
    return result[0]?.role || null;
  }

  // API key methods
  async createApiKey(userId: string, apiKeyData: InsertApiKey & { key: string }): Promise<ApiKey> {
    const [created] = await db
      .insert(apiKeys)
      .values({ ...apiKeyData, userId })
      .returning();
    return created;
  }

  async getApiKey(hashedKey: string): Promise<ApiKey | undefined> {
    const result = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, hashedKey));
    return result[0];
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsed: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async deleteApiKey(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Model version methods
  async getModelVersions(modelId: string): Promise<ModelVersion[]> {
    return await db
      .select()
      .from(modelVersions)
      .where(eq(modelVersions.modelId, modelId))
      .orderBy(desc(modelVersions.versionNumber));
  }

  async getModelVersion(modelId: string, versionNumber: number): Promise<ModelVersion | undefined> {
    const result = await db
      .select()
      .from(modelVersions)
      .where(and(
        eq(modelVersions.modelId, modelId),
        eq(modelVersions.versionNumber, versionNumber)
      ));
    return result[0];
  }

  async createModelVersion(version: InsertModelVersion): Promise<ModelVersion> {
    const [created] = await db
      .insert(modelVersions)
      .values(version)
      .returning();
    return created;
  }

  async getLatestVersionNumber(modelId: string): Promise<number> {
    const result = await db
      .select({ maxVersion: sql<number>`COALESCE(MAX(${modelVersions.versionNumber}), 0)` })
      .from(modelVersions)
      .where(eq(modelVersions.modelId, modelId));
    return result[0]?.maxVersion ?? 0;
  }

  async restoreModelVersion(userId: string, modelId: string, versionNumber: number): Promise<AIModel | undefined> {
    // Get the version to restore
    const version = await this.getModelVersion(modelId, versionNumber);
    if (!version) {
      return undefined;
    }

    // Update the model with the version's data
    const [updated] = await db
      .update(aiModels)
      .set({
        name: version.name,
        description: version.description,
        systemPrompt: version.systemPrompt,
        model: version.model,
        temperature: version.temperature,
        maxTokens: version.maxTokens,
        template: version.template,
        category: version.category,
        tags: version.tags,
      })
      .where(and(eq(aiModels.id, modelId), eq(aiModels.userId, userId)))
      .returning();

    return updated;
  }

  async deleteModelVersion(versionId: string): Promise<boolean> {
    const result = await db
      .delete(modelVersions)
      .where(eq(modelVersions.id, versionId))
      .returning();
    return result.length > 0;
  }

  // Image asset methods
  async createImageAsset(asset: InsertImageAsset): Promise<ImageAsset> {
    const [created] = await db.insert(imageAssets).values(asset).returning();
    return created;
  }

  async getImageAsset(id: string): Promise<ImageAsset | undefined> {
    const result = await db.select().from(imageAssets).where(eq(imageAssets.id, id));
    return result[0];
  }

  async getUserImageAssets(userId: string): Promise<ImageAsset[]> {
    return db.select().from(imageAssets).where(eq(imageAssets.userId, userId)).orderBy(desc(imageAssets.createdAt));
  }

  async getExpiredImageAssets(): Promise<ImageAsset[]> {
    const now = new Date();
    return db.select().from(imageAssets).where(and(
      sql`${imageAssets.expiresAt} IS NOT NULL`,
      lt(imageAssets.expiresAt, now)
    ));
  }

  async deleteImageAsset(id: string): Promise<boolean> {
    const result = await db.delete(imageAssets).where(eq(imageAssets.id, id)).returning();
    return result.length > 0;
  }

  // Document methods
  async createDocument(userId: string, document: Omit<InsertDocument, 'userId'>): Promise<Document> {
    const [doc] = await db.insert(documents).values({
      ...document,
      userId,
    }).returning();
    return doc;
  }

  async getDocument(userId: string, id: string): Promise<Document | undefined> {
    const result = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)));
    return result[0];
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }

  async getConversationDocuments(userId: string, conversationId: string): Promise<Document[]> {
    return db
      .select()
      .from(documents)
      .where(and(
        eq(documents.userId, userId),
        eq(documents.conversationId, conversationId)
      ))
      .orderBy(desc(documents.createdAt));
  }

  async deleteDocument(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
