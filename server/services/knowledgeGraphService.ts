import { storage } from "../storage";
import {
  extractKnowledgeFromText,
  extractKnowledgeFromConversation,
  type ExtractedEntity,
  type ExtractedRelationship,
  type ExtractedFact,
} from "./knowledgeExtractionService";
import type {
  InsertKnowledgeEntity,
  InsertKnowledgeRelationship,
  InsertKnowledgeFact,
  InsertMemorySource,
  InsertMemoryLink,
} from "@shared/schema";

export interface ProcessConversationResult {
  sourceId: string;
  entitiesCreated: number;
  relationshipsCreated: number;
  factsCreated: number;
}

/**
 * Process a conversation and extract/store knowledge
 */
export async function processConversationForKnowledge(
  userId: string,
  conversationId: string,
  messages: Array<{ role: string; content: string }>,
  workspaceId?: string
): Promise<ProcessConversationResult> {
  // Create memory source
  const source = await storage.createMemorySource({
    userId,
    sourceType: "conversation",
    sourceId: conversationId,
    extractionMethod: "ai_extraction",
    metadata: {
      messageCount: messages.length,
    },
  });

  // Extract knowledge from conversation
  const extracted = await extractKnowledgeFromConversation(messages);

  let entitiesCreated = 0;
  let relationshipsCreated = 0;
  let factsCreated = 0;

  // Store entities (with deduplication)
  const entityMap = new Map<string, string>(); // name -> id

  for (const entity of extracted.entities) {
    // Check if entity already exists
    const existing = await storage.searchKnowledgeEntities(userId, entity.name, 1);
    let entityId: string;

    if (existing.length > 0 && existing[0].name.toLowerCase() === entity.name.toLowerCase()) {
      // Entity exists, increment source count
      entityId = existing[0].id;
      await storage.incrementEntitySourceCount(entityId);
      // Update if confidence is higher
      if (entity.confidence > existing[0].confidence) {
        await storage.updateKnowledgeEntity(userId, entityId, {
          confidence: entity.confidence,
          description: entity.description || existing[0].description,
          metadata: entity.metadata || existing[0].metadata,
        });
      }
    } else {
      // Create new entity
      const created = await storage.createKnowledgeEntity({
        userId,
        workspaceId,
        name: entity.name,
        type: entity.type,
        description: entity.description,
        metadata: entity.metadata,
        confidence: entity.confidence,
        sourceCount: 1,
      });
      entityId = created.id;
      entitiesCreated++;
    }

    entityMap.set(entity.name.toLowerCase(), entityId);

    // Create memory link
    await storage.createMemoryLink({
      sourceId: source.id,
      entityId,
      extractedText: entity.name,
    });
  }

  // Store relationships
  for (const rel of extracted.relationships) {
    const sourceEntityId = entityMap.get(rel.sourceEntity.toLowerCase());
    const targetEntityId = entityMap.get(rel.targetEntity.toLowerCase());

    if (!sourceEntityId || !targetEntityId) {
      continue; // Skip if entities don't exist
    }

    // Check if relationship already exists
    const existing = await storage.getKnowledgeRelationships(userId, sourceEntityId);
    const duplicate = existing.find(
      (r) =>
        r.targetEntityId === targetEntityId &&
        r.relationshipType === rel.relationshipType
    );

    if (duplicate) {
      // Update strength if higher
      if (rel.strength > duplicate.strength) {
        await storage.updateKnowledgeRelationship(userId, duplicate.id, {
          strength: rel.strength,
          description: rel.description || duplicate.description,
        });
      }
    } else {
      // Create new relationship
      await storage.createKnowledgeRelationship({
        userId,
        workspaceId,
        sourceEntityId,
        targetEntityId,
        relationshipType: rel.relationshipType,
        description: rel.description,
        strength: rel.strength,
        sourceCount: 1,
      });
      relationshipsCreated++;
    }

    // Create memory link
    await storage.createMemoryLink({
      sourceId: source.id,
      relationshipId: duplicate?.id || undefined,
      extractedText: `${rel.sourceEntity} ${rel.relationshipType} ${rel.targetEntity}`,
    });
  }

  // Store facts
  for (const fact of extracted.facts) {
    const entityId = fact.subject ? entityMap.get(fact.subject.toLowerCase()) : undefined;

    // Check if fact already exists
    const existing = await storage.getKnowledgeFacts(userId, entityId);
    const duplicate = existing.find(
      (f) =>
        f.subject === fact.subject &&
        f.predicate === fact.predicate &&
        f.object === fact.object
    );

    if (duplicate) {
      // Update confidence if higher
      if (fact.confidence > duplicate.confidence) {
        await storage.updateKnowledgeFact(userId, duplicate.id, {
          confidence: fact.confidence,
          metadata: fact.metadata || duplicate.metadata,
        });
      }
    } else {
      // Create new fact
      await storage.createKnowledgeFact({
        userId,
        workspaceId,
        entityId,
        factType: fact.factType,
        subject: fact.subject,
        predicate: fact.predicate,
        object: fact.object,
        metadata: fact.metadata,
        confidence: fact.confidence,
        sourceCount: 1,
      });
      factsCreated++;
    }

    // Create memory link
    await storage.createMemoryLink({
      sourceId: source.id,
      factId: duplicate?.id || undefined,
      extractedText: `${fact.subject} ${fact.predicate} ${fact.object}`,
    });
  }

  return {
    sourceId: source.id,
    entitiesCreated,
    relationshipsCreated,
    factsCreated,
  };
}

/**
 * Get relevant knowledge for a query (for memory retrieval in chat)
 */
export async function getRelevantKnowledgeForQuery(
  userId: string,
  query: string,
  limit = 10
): Promise<{
  entities: Array<{ id: string; name: string; type: string; description?: string }>;
  relationships: Array<{
    id: string;
    sourceEntity: string;
    targetEntity: string;
    relationshipType: string;
  }>;
  facts: Array<{
    id: string;
    subject: string;
    predicate: string;
    object: string;
    factType: string;
  }>;
}> {
  const knowledge = await storage.getRelevantKnowledge(userId, query, limit);

  // Get entity names for relationships
  const entityIds = new Set<string>();
  knowledge.relationships.forEach((r) => {
    entityIds.add(r.sourceEntityId);
    entityIds.add(r.targetEntityId);
  });

  const entities = await Promise.all(
    Array.from(entityIds).map((id) => storage.getKnowledgeEntity(userId, id))
  );

  const entityMap = new Map(entities.filter(Boolean).map((e) => [e!.id, e!]));

  return {
    entities: knowledge.entities.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      description: e.description || undefined,
    })),
    relationships: knowledge.relationships.map((r) => ({
      id: r.id,
      sourceEntity: entityMap.get(r.sourceEntityId)?.name || r.sourceEntityId,
      targetEntity: entityMap.get(r.targetEntityId)?.name || r.targetEntityId,
      relationshipType: r.relationshipType,
    })),
    facts: knowledge.facts.map((f) => ({
      id: f.id,
      subject: f.subject,
      predicate: f.predicate,
      object: f.object,
      factType: f.factType,
    })),
  };
}

/**
 * Format knowledge as context for AI prompts
 */
export function formatKnowledgeAsContext(knowledge: {
  entities: Array<{ name: string; type: string; description?: string }>;
  relationships: Array<{ sourceEntity: string; targetEntity: string; relationshipType: string }>;
  facts: Array<{ subject: string; predicate: string; object: string; factType: string }>;
}): string {
  const parts: string[] = [];

  if (knowledge.entities.length > 0) {
    parts.push("## Known Entities:");
    knowledge.entities.forEach((e) => {
      parts.push(`- ${e.name} (${e.type})${e.description ? `: ${e.description}` : ""}`);
    });
  }

  if (knowledge.relationships.length > 0) {
    parts.push("\n## Relationships:");
    knowledge.relationships.forEach((r) => {
      parts.push(`- ${r.sourceEntity} ${r.relationshipType} ${r.targetEntity}`);
    });
  }

  if (knowledge.facts.length > 0) {
    parts.push("\n## Facts:");
    knowledge.facts.forEach((f) => {
      parts.push(`- ${f.subject} ${f.predicate} ${f.object}`);
    });
  }

  return parts.join("\n");
}

