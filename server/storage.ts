import { eq, desc, and, sql, sum, count, lt, isNotNull } from "drizzle-orm";
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
  workflows,
  workflowRuns,
  fineTuningFiles,
  fineTuningJobs,
  webhookConfigurations,
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
  type Workflow,
  type InsertWorkflow,
  type WorkflowRun,
  type InsertWorkflowRun,
  type FineTuningFile,
  type InsertFineTuningFile,
  type FineTuningJob,
  type InsertFineTuningJob,
  type WebhookConfiguration,
  type InsertWebhookConfiguration,
  conversationBranches,
  type ConversationBranch,
  type InsertConversationBranch,
  promptTemplates,
  type PromptTemplate,
  type InsertPromptTemplate,
  promptTemplateRatings,
  type PromptTemplateRating,
  integrations,
  type Integration,
  type InsertIntegration,
  integrationEvents,
  type IntegrationEvent,
  type InsertIntegrationEvent,
  mediaAssets,
  type MediaAsset,
  type InsertMediaAsset,
  knowledgeEntities,
  type KnowledgeEntity,
  type InsertKnowledgeEntity,
  knowledgeRelationships,
  type KnowledgeRelationship,
  type InsertKnowledgeRelationship,
  knowledgeFacts,
  type KnowledgeFact,
  type InsertKnowledgeFact,
  memorySources,
  type MemorySource,
  type InsertMemorySource,
  memoryLinks,
  type MemoryLink,
  type InsertMemoryLink,
  memoryVersions,
  type MemoryVersion,
  type InsertMemoryVersion,
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
  getUserWithPassword(id: string): Promise<User | undefined>;
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
  deleteUser(userId: string): Promise<boolean>;
  
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
  
  // Workflow methods
  createWorkflow(userId: string, workflow: InsertWorkflow): Promise<Workflow>;
  getWorkflow(userId: string, id: string): Promise<Workflow | undefined>;
  getUserWorkflows(userId: string): Promise<Workflow[]>;
  updateWorkflow(userId: string, id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(userId: string, id: string): Promise<boolean>;
  
  // Workflow run methods
  createWorkflowRun(run: InsertWorkflowRun): Promise<WorkflowRun>;
  getWorkflowRun(id: string): Promise<WorkflowRun | undefined>;
  getWorkflowRuns(workflowId: string): Promise<WorkflowRun[]>;
  updateWorkflowRun(id: string, run: Partial<InsertWorkflowRun>): Promise<WorkflowRun | undefined>;
  
  // Fine-tuning file methods
  createFineTuningFile(userId: string, file: InsertFineTuningFile): Promise<FineTuningFile>;
  getFineTuningFile(userId: string, id: string): Promise<FineTuningFile | undefined>;
  getUserFineTuningFiles(userId: string): Promise<FineTuningFile[]>;
  updateFineTuningFile(userId: string, id: string, data: Partial<InsertFineTuningFile>): Promise<FineTuningFile | undefined>;
  deleteFineTuningFile(userId: string, id: string): Promise<boolean>;
  
  // Fine-tuning job methods
  createFineTuningJob(userId: string, job: InsertFineTuningJob): Promise<FineTuningJob>;
  getFineTuningJob(userId: string, id: string): Promise<FineTuningJob | undefined>;
  getUserFineTuningJobs(userId: string): Promise<FineTuningJob[]>;
  updateFineTuningJob(userId: string, id: string, data: Partial<InsertFineTuningJob>): Promise<FineTuningJob | undefined>;
  cancelFineTuningJob(userId: string, id: string): Promise<FineTuningJob | undefined>;
  
  // Webhook configuration methods
  createWebhookConfiguration(userId: string, webhook: InsertWebhookConfiguration): Promise<WebhookConfiguration>;
  getWebhookConfiguration(userId: string, id: string): Promise<WebhookConfiguration | undefined>;
  getUserWebhookConfigurations(userId: string): Promise<WebhookConfiguration[]>;
  updateWebhookConfiguration(userId: string, id: string, data: Partial<InsertWebhookConfiguration>): Promise<WebhookConfiguration | undefined>;
  deleteWebhookConfiguration(userId: string, id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserWithPassword(id: string): Promise<User | undefined> {
    // This method specifically returns user WITH password for verification purposes
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

  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Check for multi-member workspaces BEFORE deleting anything
      const ownedWorkspaces = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.ownerId, userId));
      
      for (const workspace of ownedWorkspaces) {
        const members = await db
          .select()
          .from(workspaceMembers)
          .where(eq(workspaceMembers.workspaceId, workspace.id));
        
        // Block deletion if workspace has other members
        const otherMembers = members.filter(m => m.userId !== userId);
        if (otherMembers.length > 0) {
          throw new Error(
            `Cannot delete account: You own workspace "${workspace.name}" with other members. ` +
            `Please transfer ownership or remove other members first.`
          );
        }
      }
      
      // Delete all user data in a transaction for referential integrity
      await db.transaction(async (tx) => {
        // Delete in order of FK dependencies (deepest first)
        
        // Delete workflow runs for user's workflows
        const userWorkflows = await tx
          .select({ id: workflows.id })
          .from(workflows)
          .where(eq(workflows.userId, userId));
        
        for (const workflow of userWorkflows) {
          await tx.delete(workflowRuns).where(eq(workflowRuns.workflowId, workflow.id));
        }
        
        // Delete workflows
        await tx.delete(workflows).where(eq(workflows.userId, userId));
        
        // Delete model versions for user's models
        const userModels = await tx
          .select({ id: aiModels.id })
          .from(aiModels)
          .where(eq(aiModels.userId, userId));
        
        for (const model of userModels) {
          await tx.delete(modelVersions).where(eq(modelVersions.modelId, model.id));
        }
        
        // Delete usage logs (references conversations and models)
        await tx.delete(usageLogs).where(eq(usageLogs.userId, userId));
        
        // Delete conversations
        await tx.delete(conversations).where(eq(conversations.userId, userId));
        
        // Delete AI models (including public marketplace models)
        await tx.delete(aiModels).where(eq(aiModels.userId, userId));
        
        // Delete model likes
        await tx.delete(modelLikes).where(eq(modelLikes.userId, userId));
        
        // Delete documents
        await tx.delete(documents).where(eq(documents.userId, userId));
        
        // Delete image assets
        await tx.delete(imageAssets).where(eq(imageAssets.userId, userId));
        
        // Delete API keys
        await tx.delete(apiKeys).where(eq(apiKeys.userId, userId));
        
        // Delete fine-tuning jobs
        await tx.delete(fineTuningJobs).where(eq(fineTuningJobs.userId, userId));
        
        // Delete fine-tuning files
        await tx.delete(fineTuningFiles).where(eq(fineTuningFiles.userId, userId));
        
        // Delete webhook configurations
        await tx.delete(webhookConfigurations).where(eq(webhookConfigurations.userId, userId));
        
        // Delete ALL workspace memberships (whether user is owner or member)
        await tx.delete(workspaceMembers).where(eq(workspaceMembers.userId, userId));
        
        // Delete workspaces owned by user (we already checked they're solo)
        for (const workspace of ownedWorkspaces) {
          await tx.delete(workspaces).where(eq(workspaces.id, workspace.id));
        }
        
        // Delete Stripe checkout sessions
        await tx.delete(stripeCheckoutSessions).where(eq(stripeCheckoutSessions.userId, userId));
        
        // Finally, delete the user
        await tx.delete(users).where(eq(users.id, userId));
      });
      
      console.log(`[Storage] Successfully deleted user ${userId} and all associated data`);
      return true;
    } catch (error) {
      console.error("[Storage] Failed to delete user:", error);
      throw error;
    }
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

  // Workflow methods
  async createWorkflow(userId: string, workflow: InsertWorkflow): Promise<Workflow> {
    const [created] = await db.insert(workflows).values({
      ...workflow,
      userId,
    }).returning();
    return created;
  }

  async getWorkflow(userId: string, id: string): Promise<Workflow | undefined> {
    const result = await db
      .select()
      .from(workflows)
      .where(and(eq(workflows.id, id), eq(workflows.userId, userId)));
    return result[0];
  }

  async getUserWorkflows(userId: string): Promise<Workflow[]> {
    return db
      .select()
      .from(workflows)
      .where(eq(workflows.userId, userId))
      .orderBy(desc(workflows.createdAt));
  }

  async updateWorkflow(userId: string, id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const result = await db
      .update(workflows)
      .set({ ...workflow, updatedAt: new Date() })
      .where(and(eq(workflows.id, id), eq(workflows.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteWorkflow(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(workflows)
      .where(and(eq(workflows.id, id), eq(workflows.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Workflow run methods
  async createWorkflowRun(run: InsertWorkflowRun): Promise<WorkflowRun> {
    const [created] = await db.insert(workflowRuns).values(run).returning();
    return created;
  }

  async getWorkflowRun(id: string): Promise<WorkflowRun | undefined> {
    const result = await db.select().from(workflowRuns).where(eq(workflowRuns.id, id));
    return result[0];
  }

  async getWorkflowRuns(workflowId: string): Promise<WorkflowRun[]> {
    return db
      .select()
      .from(workflowRuns)
      .where(eq(workflowRuns.workflowId, workflowId))
      .orderBy(desc(workflowRuns.startedAt));
  }

  async updateWorkflowRun(id: string, run: Partial<InsertWorkflowRun>): Promise<WorkflowRun | undefined> {
    const result = await db
      .update(workflowRuns)
      .set(run)
      .where(eq(workflowRuns.id, id))
      .returning();
    return result[0];
  }

  // Fine-tuning file methods
  async createFineTuningFile(userId: string, file: InsertFineTuningFile): Promise<FineTuningFile> {
    const [created] = await db
      .insert(fineTuningFiles)
      .values({ ...file, userId })
      .returning();
    return created;
  }

  async getFineTuningFile(userId: string, id: string): Promise<FineTuningFile | undefined> {
    const result = await db
      .select()
      .from(fineTuningFiles)
      .where(and(eq(fineTuningFiles.id, id), eq(fineTuningFiles.userId, userId)));
    return result[0];
  }

  async getUserFineTuningFiles(userId: string): Promise<FineTuningFile[]> {
    return db
      .select()
      .from(fineTuningFiles)
      .where(eq(fineTuningFiles.userId, userId))
      .orderBy(desc(fineTuningFiles.createdAt));
  }

  async updateFineTuningFile(userId: string, id: string, data: Partial<InsertFineTuningFile>): Promise<FineTuningFile | undefined> {
    const result = await db
      .update(fineTuningFiles)
      .set(data)
      .where(and(eq(fineTuningFiles.id, id), eq(fineTuningFiles.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteFineTuningFile(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(fineTuningFiles)
      .where(and(eq(fineTuningFiles.id, id), eq(fineTuningFiles.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Fine-tuning job methods
  async createFineTuningJob(userId: string, job: InsertFineTuningJob): Promise<FineTuningJob> {
    const [created] = await db
      .insert(fineTuningJobs)
      .values({ ...job, userId })
      .returning();
    return created;
  }

  async getFineTuningJob(userId: string, id: string): Promise<FineTuningJob | undefined> {
    const result = await db
      .select()
      .from(fineTuningJobs)
      .where(and(eq(fineTuningJobs.id, id), eq(fineTuningJobs.userId, userId)));
    return result[0];
  }

  async getUserFineTuningJobs(userId: string): Promise<FineTuningJob[]> {
    return db
      .select()
      .from(fineTuningJobs)
      .where(eq(fineTuningJobs.userId, userId))
      .orderBy(desc(fineTuningJobs.createdAt));
  }

  async updateFineTuningJob(userId: string, id: string, data: Partial<InsertFineTuningJob>): Promise<FineTuningJob | undefined> {
    const result = await db
      .update(fineTuningJobs)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(fineTuningJobs.id, id), eq(fineTuningJobs.userId, userId)))
      .returning();
    return result[0];
  }

  async cancelFineTuningJob(userId: string, id: string): Promise<FineTuningJob | undefined> {
    const result = await db
      .update(fineTuningJobs)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(fineTuningJobs.id, id), eq(fineTuningJobs.userId, userId)))
      .returning();
    return result[0];
  }

  // Webhook configuration methods
  async createWebhookConfiguration(userId: string, webhook: InsertWebhookConfiguration): Promise<WebhookConfiguration> {
    const [created] = await db
      .insert(webhookConfigurations)
      .values({ ...webhook, userId })
      .returning();
    return created;
  }

  async getWebhookConfiguration(userId: string, id: string): Promise<WebhookConfiguration | undefined> {
    const result = await db
      .select()
      .from(webhookConfigurations)
      .where(and(eq(webhookConfigurations.id, id), eq(webhookConfigurations.userId, userId)));
    return result[0];
  }

  async getUserWebhookConfigurations(userId: string): Promise<WebhookConfiguration[]> {
    return db
      .select()
      .from(webhookConfigurations)
      .where(eq(webhookConfigurations.userId, userId))
      .orderBy(desc(webhookConfigurations.createdAt));
  }

  async updateWebhookConfiguration(userId: string, id: string, data: Partial<InsertWebhookConfiguration>): Promise<WebhookConfiguration | undefined> {
    const result = await db
      .update(webhookConfigurations)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(webhookConfigurations.id, id), eq(webhookConfigurations.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteWebhookConfiguration(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(webhookConfigurations)
      .where(and(eq(webhookConfigurations.id, id), eq(webhookConfigurations.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Conversation branching methods
  async createConversationBranch(branch: InsertConversationBranch): Promise<ConversationBranch> {
    const [created] = await db
      .insert(conversationBranches)
      .values(branch)
      .returning();
    return created;
  }

  async getConversationBranches(conversationId: string): Promise<ConversationBranch[]> {
    return db
      .select()
      .from(conversationBranches)
      .where(eq(conversationBranches.conversationId, conversationId))
      .orderBy(desc(conversationBranches.createdAt));
  }

  async getConversationBranch(id: string): Promise<ConversationBranch | undefined> {
    const result = await db
      .select()
      .from(conversationBranches)
      .where(eq(conversationBranches.id, id));
    return result[0];
  }

  async updateConversationBranch(id: string, data: Partial<InsertConversationBranch>): Promise<ConversationBranch | undefined> {
    const result = await db
      .update(conversationBranches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(conversationBranches.id, id))
      .returning();
    return result[0];
  }

  async deleteConversationBranch(id: string): Promise<boolean> {
    const result = await db
      .delete(conversationBranches)
      .where(eq(conversationBranches.id, id))
      .returning();
    return result.length > 0;
  }

  // Prompt template methods
  async createPromptTemplate(userId: string, template: InsertPromptTemplate): Promise<PromptTemplate> {
    const [created] = await db
      .insert(promptTemplates)
      .values({ ...template, userId })
      .returning();
    return created;
  }

  async getPromptTemplate(userId: string, id: string): Promise<PromptTemplate | undefined> {
    const result = await db
      .select()
      .from(promptTemplates)
      .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)));
    return result[0];
  }

  async getPublicPromptTemplates(category?: string): Promise<PromptTemplate[]> {
    if (category) {
      return db
        .select()
        .from(promptTemplates)
        .where(and(eq(promptTemplates.isPublic, 1), eq(promptTemplates.category, category)))
        .orderBy(desc(promptTemplates.usageCount));
    }
    
    return db
      .select()
      .from(promptTemplates)
      .where(eq(promptTemplates.isPublic, 1))
      .orderBy(desc(promptTemplates.usageCount));
  }

  async getUserPromptTemplates(userId: string): Promise<PromptTemplate[]> {
    return db
      .select()
      .from(promptTemplates)
      .where(eq(promptTemplates.userId, userId))
      .orderBy(desc(promptTemplates.updatedAt));
  }

  async updatePromptTemplate(userId: string, id: string, data: Partial<InsertPromptTemplate>): Promise<PromptTemplate | undefined> {
    const result = await db
      .update(promptTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)))
      .returning();
    return result[0];
  }

  async deletePromptTemplate(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(promptTemplates)
      .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async incrementPromptTemplateUsage(id: string): Promise<void> {
    await db
      .update(promptTemplates)
      .set({ usageCount: sql`${promptTemplates.usageCount} + 1` })
      .where(eq(promptTemplates.id, id));
  }

  async ratePromptTemplate(templateId: string, userId: string, rating: number): Promise<PromptTemplateRating> {
    // Check if user already rated
    const existing = await db
      .select()
      .from(promptTemplateRatings)
      .where(and(eq(promptTemplateRatings.templateId, templateId), eq(promptTemplateRatings.userId, userId)));

    if (existing.length > 0) {
      // Update existing rating
      const [updated] = await db
        .update(promptTemplateRatings)
        .set({ rating })
        .where(and(eq(promptTemplateRatings.templateId, templateId), eq(promptTemplateRatings.userId, userId)))
        .returning();
      
      // Recalculate average rating
      await this.updatePromptTemplateRating(templateId);
      return updated;
    } else {
      // Create new rating
      const [created] = await db
        .insert(promptTemplateRatings)
        .values({ templateId, userId, rating })
        .returning();
      
      // Recalculate average rating
      await this.updatePromptTemplateRating(templateId);
      return created;
    }
  }

  private async updatePromptTemplateRating(templateId: string): Promise<void> {
    const ratings = await db
      .select()
      .from(promptTemplateRatings)
      .where(eq(promptTemplateRatings.templateId, templateId));
    
    if (ratings.length > 0) {
      const avgRating = Math.round(ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length);
      await db
        .update(promptTemplates)
        .set({ rating: avgRating, ratingCount: ratings.length })
        .where(eq(promptTemplates.id, templateId));
    }
  }

  // Integration methods
  async createIntegration(userId: string, integration: InsertIntegration, apiKey: string): Promise<Integration> {
    const [created] = await db
      .insert(integrations)
      .values({ ...integration, userId, apiKey })
      .returning();
    return created;
  }

  async getIntegration(userId: string, id: string): Promise<Integration | undefined> {
    const result = await db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, userId)));
    return result[0];
  }

  async getIntegrationByApiKey(apiKey: string): Promise<Integration | undefined> {
    const result = await db
      .select()
      .from(integrations)
      .where(eq(integrations.apiKey, apiKey));
    return result[0];
  }

  async getUserIntegrations(userId: string): Promise<Integration[]> {
    return db
      .select()
      .from(integrations)
      .where(eq(integrations.userId, userId))
      .orderBy(desc(integrations.createdAt));
  }

  async updateIntegration(userId: string, id: string, data: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const result = await db
      .update(integrations)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(integrations.id, id), eq(integrations.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteIntegration(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async updateIntegrationLastUsed(id: string): Promise<void> {
    await db
      .update(integrations)
      .set({ lastUsed: new Date() })
      .where(eq(integrations.id, id));
  }

  // Integration events
  async createIntegrationEvent(event: InsertIntegrationEvent): Promise<IntegrationEvent> {
    const [created] = await db
      .insert(integrationEvents)
      .values(event)
      .returning();
    return created;
  }

  async getPendingIntegrationEvents(integrationId: string): Promise<IntegrationEvent[]> {
    return db
      .select()
      .from(integrationEvents)
      .where(and(
        eq(integrationEvents.integrationId, integrationId),
        eq(integrationEvents.delivered, false)
      ))
      .orderBy(desc(integrationEvents.createdAt))
      .limit(100);
  }

  async markEventDelivered(eventId: string, error?: string): Promise<void> {
    await db
      .update(integrationEvents)
      .set({
        delivered: true,
        deliveredAt: error ? undefined : new Date(),
        error: error || undefined,
      })
      .where(eq(integrationEvents.id, eventId));
  }

  // Media asset methods
  async createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset> {
    const [created] = await db
      .insert(mediaAssets)
      .values(asset)
      .returning();
    return created;
  }

  async getMediaAsset(id: string): Promise<MediaAsset | undefined> {
    const result = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id));
    return result[0];
  }

  async getUserMediaAssets(userId: string, mediaType?: "audio" | "video"): Promise<MediaAsset[]> {
    const conditions = [eq(mediaAssets.userId, userId)];
    if (mediaType) {
      conditions.push(eq(mediaAssets.mediaType, mediaType));
    }
    return db
      .select()
      .from(mediaAssets)
      .where(and(...conditions))
      .orderBy(desc(mediaAssets.createdAt));
  }

  async getExpiredMediaAssets(): Promise<MediaAsset[]> {
    return db
      .select()
      .from(mediaAssets)
      .where(and(
        isNotNull(mediaAssets.expiresAt),
        lt(mediaAssets.expiresAt, new Date())
      ));
  }

  async updateMediaAsset(id: string, data: Partial<InsertMediaAsset>): Promise<MediaAsset | undefined> {
    const result = await db
      .update(mediaAssets)
      .set(data)
      .where(eq(mediaAssets.id, id))
      .returning();
    return result[0];
  }

  async deleteMediaAsset(id: string): Promise<boolean> {
    const result = await db
      .delete(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .returning();
    return result.length > 0;
  }

  // Knowledge Graph - Entity methods
  async createKnowledgeEntity(entity: InsertKnowledgeEntity): Promise<KnowledgeEntity> {
    const [created] = await db
      .insert(knowledgeEntities)
      .values(entity)
      .returning();
    return created;
  }

  async getKnowledgeEntity(userId: string, id: string): Promise<KnowledgeEntity | undefined> {
    const result = await db
      .select()
      .from(knowledgeEntities)
      .where(and(eq(knowledgeEntities.id, id), eq(knowledgeEntities.userId, userId)));
    return result[0];
  }

  async getKnowledgeEntities(
    userId: string,
    workspaceId?: string,
    type?: string
  ): Promise<KnowledgeEntity[]> {
    const conditions = [eq(knowledgeEntities.userId, userId)];
    if (workspaceId) {
      conditions.push(eq(knowledgeEntities.workspaceId, workspaceId));
    }
    if (type) {
      conditions.push(eq(knowledgeEntities.type, type));
    }
    return db
      .select()
      .from(knowledgeEntities)
      .where(and(...conditions))
      .orderBy(desc(knowledgeEntities.updatedAt));
  }

  async searchKnowledgeEntities(
    userId: string,
    query: string,
    limit = 20
  ): Promise<KnowledgeEntity[]> {
    return db
      .select()
      .from(knowledgeEntities)
      .where(
        and(
          eq(knowledgeEntities.userId, userId),
          sql`${knowledgeEntities.name} ILIKE ${`%${query}%`} OR ${knowledgeEntities.description} ILIKE ${`%${query}%`}`
        )
      )
      .limit(limit)
      .orderBy(desc(knowledgeEntities.sourceCount));
  }

  async updateKnowledgeEntity(
    userId: string,
    id: string,
    updates: Partial<InsertKnowledgeEntity>
  ): Promise<KnowledgeEntity | undefined> {
    const [updated] = await db
      .update(knowledgeEntities)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(knowledgeEntities.id, id), eq(knowledgeEntities.userId, userId)))
      .returning();
    return updated;
  }

  async incrementEntitySourceCount(id: string): Promise<void> {
    await db
      .update(knowledgeEntities)
      .set({
        sourceCount: sql`${knowledgeEntities.sourceCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeEntities.id, id));
  }

  async deleteKnowledgeEntity(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(knowledgeEntities)
      .where(and(eq(knowledgeEntities.id, id), eq(knowledgeEntities.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Knowledge Graph - Relationship methods
  async createKnowledgeRelationship(
    relationship: InsertKnowledgeRelationship
  ): Promise<KnowledgeRelationship> {
    const [created] = await db
      .insert(knowledgeRelationships)
      .values(relationship)
      .returning();
    return created;
  }

  async getKnowledgeRelationships(
    userId: string,
    entityId?: string,
    relationshipType?: string
  ): Promise<KnowledgeRelationship[]> {
    const conditions = [eq(knowledgeRelationships.userId, userId)];
    if (entityId) {
      conditions.push(
        sql`${knowledgeRelationships.sourceEntityId} = ${entityId} OR ${knowledgeRelationships.targetEntityId} = ${entityId}`
      );
    }
    if (relationshipType) {
      conditions.push(eq(knowledgeRelationships.relationshipType, relationshipType));
    }
    return db
      .select()
      .from(knowledgeRelationships)
      .where(and(...conditions))
      .orderBy(desc(knowledgeRelationships.updatedAt));
  }

  async updateKnowledgeRelationship(
    userId: string,
    id: string,
    updates: Partial<InsertKnowledgeRelationship>
  ): Promise<KnowledgeRelationship | undefined> {
    const [updated] = await db
      .update(knowledgeRelationships)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(knowledgeRelationships.id, id), eq(knowledgeRelationships.userId, userId)))
      .returning();
    return updated;
  }

  async deleteKnowledgeRelationship(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(knowledgeRelationships)
      .where(and(eq(knowledgeRelationships.id, id), eq(knowledgeRelationships.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Knowledge Graph - Fact methods
  async createKnowledgeFact(fact: InsertKnowledgeFact): Promise<KnowledgeFact> {
    const [created] = await db
      .insert(knowledgeFacts)
      .values(fact)
      .returning();
    return created;
  }

  async getKnowledgeFacts(
    userId: string,
    entityId?: string,
    factType?: string
  ): Promise<KnowledgeFact[]> {
    const conditions = [eq(knowledgeFacts.userId, userId)];
    if (entityId) {
      conditions.push(eq(knowledgeFacts.entityId, entityId));
    }
    if (factType) {
      conditions.push(eq(knowledgeFacts.factType, factType));
    }
    return db
      .select()
      .from(knowledgeFacts)
      .where(and(...conditions))
      .orderBy(desc(knowledgeFacts.updatedAt));
  }

  async searchKnowledgeFacts(
    userId: string,
    query: string,
    limit = 20
  ): Promise<KnowledgeFact[]> {
    return db
      .select()
      .from(knowledgeFacts)
      .where(
        and(
          eq(knowledgeFacts.userId, userId),
          sql`${knowledgeFacts.subject} ILIKE ${`%${query}%`} OR ${knowledgeFacts.predicate} ILIKE ${`%${query}%`} OR ${knowledgeFacts.object} ILIKE ${`%${query}%`}`
        )
      )
      .limit(limit)
      .orderBy(desc(knowledgeFacts.sourceCount));
  }

  async updateKnowledgeFact(
    userId: string,
    id: string,
    updates: Partial<InsertKnowledgeFact>
  ): Promise<KnowledgeFact | undefined> {
    const [updated] = await db
      .update(knowledgeFacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(knowledgeFacts.id, id), eq(knowledgeFacts.userId, userId)))
      .returning();
    return updated;
  }

  async deleteKnowledgeFact(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(knowledgeFacts)
      .where(and(eq(knowledgeFacts.id, id), eq(knowledgeFacts.userId, userId)))
      .returning();
    return result.length > 0;
  }

  // Memory Source methods
  async createMemorySource(source: InsertMemorySource): Promise<MemorySource> {
    const [created] = await db
      .insert(memorySources)
      .values(source)
      .returning();
    return created;
  }

  async getMemorySources(
    userId: string,
    sourceType?: string
  ): Promise<MemorySource[]> {
    const conditions = [eq(memorySources.userId, userId)];
    if (sourceType) {
      conditions.push(eq(memorySources.sourceType, sourceType));
    }
    return db
      .select()
      .from(memorySources)
      .where(and(...conditions))
      .orderBy(desc(memorySources.extractedAt));
  }

  // Memory Link methods
  async createMemoryLink(link: InsertMemoryLink): Promise<MemoryLink> {
    const [created] = await db
      .insert(memoryLinks)
      .values(link)
      .returning();
    return created;
  }

  async getMemoryLinks(sourceId: string): Promise<MemoryLink[]> {
    return db
      .select()
      .from(memoryLinks)
      .where(eq(memoryLinks.sourceId, sourceId))
      .orderBy(desc(memoryLinks.createdAt));
  }

  // Memory Version methods
  async createMemoryVersion(version: InsertMemoryVersion): Promise<MemoryVersion> {
    const [created] = await db
      .insert(memoryVersions)
      .values(version)
      .returning();
    return created;
  }

  async getMemoryVersions(
    userId: string,
    entityId?: string,
    relationshipId?: string,
    factId?: string
  ): Promise<MemoryVersion[]> {
    const conditions = [eq(memoryVersions.userId, userId)];
    if (entityId) {
      conditions.push(eq(memoryVersions.entityId, entityId));
    }
    if (relationshipId) {
      conditions.push(eq(memoryVersions.relationshipId, relationshipId));
    }
    if (factId) {
      conditions.push(eq(memoryVersions.factId, factId));
    }
    return db
      .select()
      .from(memoryVersions)
      .where(and(...conditions))
      .orderBy(desc(memoryVersions.createdAt));
  }

  // Get relevant knowledge for a query (for memory retrieval)
  async getRelevantKnowledge(
    userId: string,
    query: string,
    limit = 10
  ): Promise<{
    entities: KnowledgeEntity[];
    relationships: KnowledgeRelationship[];
    facts: KnowledgeFact[];
  }> {
    const entities = await this.searchKnowledgeEntities(userId, query, limit);
    const facts = await this.searchKnowledgeFacts(userId, query, limit);
    
    // Get relationships for found entities
    const entityIds = entities.map((e) => e.id);
    const relationships = entityIds.length > 0
      ? await db
          .select()
          .from(knowledgeRelationships)
          .where(
            and(
              eq(knowledgeRelationships.userId, userId),
              sql`${knowledgeRelationships.sourceEntityId} = ANY(${entityIds}) OR ${knowledgeRelationships.targetEntityId} = ANY(${entityIds})`
            )
          )
          .limit(limit)
      : [];

    return { entities, relationships, facts };
  }
}

export const storage = new DatabaseStorage();
