// OpenAI pricing as of 2025 (per 1M tokens)
// Source: https://openai.com/pricing
const PRICING: Record<string, { input: number; output: number }> = {
  // GPT-4o models
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  
  // GPT-4 Turbo
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "gpt-4-turbo-preview": { input: 10.0, output: 30.0 },
  
  // GPT-4
  "gpt-4": { input: 30.0, output: 60.0 },
  "gpt-4-32k": { input: 60.0, output: 120.0 },
  
  // GPT-3.5 Turbo
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "gpt-3.5-turbo-16k": { input: 3.0, output: 4.0 },
  
  // o1 models
  "o1-preview": { input: 15.0, output: 60.0 },
  "o1-mini": { input: 3.0, output: 12.0 },
};

/**
 * Calculate the cost in USD for a given model and token usage
 * @param model - The OpenAI model name
 * @param promptTokens - Number of input/prompt tokens
 * @param completionTokens - Number of output/completion tokens
 * @returns Cost in USD as a string with 6 decimal places
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): string {
  // Get pricing for the model, default to gpt-4o-mini if not found
  const pricing = PRICING[model] || PRICING["gpt-4o-mini"];
  
  // Calculate cost: (tokens / 1,000,000) * price_per_million
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;
  
  // Return as string with 6 decimal places for precision
  return totalCost.toFixed(6);
}

/**
 * Get the pricing information for a given model
 * @param model - The OpenAI model name
 * @returns Pricing info or null if not found
 */
export function getModelPricing(model: string) {
  return PRICING[model] || null;
}
