import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedEntity {
  name: string;
  type: "person" | "organization" | "concept" | "location" | "event" | "product" | "other";
  description?: string;
  metadata?: Record<string, any>;
  confidence: number;
}

export interface ExtractedRelationship {
  sourceEntity: string;
  targetEntity: string;
  relationshipType: string;
  description?: string;
  strength: number;
}

export interface ExtractedFact {
  factType: "preference" | "skill" | "contact_info" | "attribute" | "event" | "other";
  subject: string;
  predicate: string;
  object: string;
  metadata?: Record<string, any>;
  confidence: number;
}

export interface ExtractedKnowledge {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
  facts: ExtractedFact[];
}

/**
 * Extract knowledge from conversation text using AI
 */
export async function extractKnowledgeFromText(
  text: string,
  context?: string
): Promise<ExtractedKnowledge> {
  const systemPrompt = `You are a knowledge extraction system. Extract structured knowledge from the given text.

Extract:
1. **Entities**: People, organizations, concepts, locations, events, products mentioned
2. **Relationships**: Connections between entities (e.g., "works_at", "located_in", "related_to")
3. **Facts**: Specific pieces of information (preferences, skills, attributes, events)

Return a JSON object with:
- entities: Array of {name, type, description?, metadata?, confidence (0-100)}
- relationships: Array of {sourceEntity, targetEntity, relationshipType, description?, strength (0-100)}
- facts: Array of {factType, subject, predicate, object, metadata?, confidence (0-100)}

Entity types: person, organization, concept, location, event, product, other
Relationship types: works_at, located_in, related_to, created_by, owns, manages, knows, prefers, etc.
Fact types: preference, skill, contact_info, attribute, event, other

Be thorough but accurate. Only extract information that is clearly stated or strongly implied.`;

  const userPrompt = context
    ? `Context: ${context}\n\nText to analyze:\n${text}`
    : `Text to analyze:\n${text}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using cheaper model for extraction
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const extracted = JSON.parse(content) as ExtractedKnowledge;

    // Validate and normalize the extracted knowledge
    return {
      entities: (extracted.entities || []).map((e) => ({
        ...e,
        confidence: Math.max(0, Math.min(100, e.confidence || 50)),
      })),
      relationships: (extracted.relationships || []).map((r) => ({
        ...r,
        strength: Math.max(0, Math.min(100, r.strength || 50)),
      })),
      facts: (extracted.facts || []).map((f) => ({
        ...f,
        confidence: Math.max(0, Math.min(100, f.confidence || 50)),
      })),
    };
  } catch (error) {
    console.error("[KnowledgeExtraction] Error extracting knowledge:", error);
    // Return empty knowledge on error
    return {
      entities: [],
      relationships: [],
      facts: [],
    };
  }
}

/**
 * Extract knowledge from a conversation
 */
export async function extractKnowledgeFromConversation(
  messages: Array<{ role: string; content: string }>
): Promise<ExtractedKnowledge> {
  // Combine all messages into a single text
  const conversationText = messages
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n\n");

  return extractKnowledgeFromText(conversationText, "This is a conversation between a user and an AI assistant.");
}

/**
 * Extract knowledge from a single message
 */
export async function extractKnowledgeFromMessage(
  message: string,
  previousContext?: string
): Promise<ExtractedKnowledge> {
  return extractKnowledgeFromText(message, previousContext);
}

