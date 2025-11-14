/**
 * Content filtering utility to block inappropriate image generation
 */

// Keywords and patterns for sexual content detection
const SEXUAL_KEYWORDS = [
  'nude', 'naked', 'porn', 'nsfw', 'xxx', 'sex', 'sexual', 'erotic',
  'topless', 'bottomless', 'lingerie', 'underwear', 'bikini',
  'seductive', 'provocative', 'sensual', 'arousing', 'intimate',
  'orgasm', 'masturbat', 'penis', 'vagina', 'breast', 'nipple',
  'genitals', 'genitalia', 'explicit', 'adult content', 'fetish',
  'bdsm', 'bondage', 'dominatrix', 'submissive', 'kinky',
  'orgy', 'threesome', 'hookup', 'makeout', 'kissing',
  'strip', 'undress', 'revealing', 'scanty', 'scantily',
  'thong', 'g-string', 'bra', 'panties', 'cleavage',
  'suggestive', 'risque', 'racy', 'lewd', 'obscene',
  'pornographic', 'x-rated', 'r-rated', 'mature content'
];

// Regex patterns for more sophisticated detection
const SEXUAL_PATTERNS = [
  /\b(no|without|off)\s+(clothes?|clothing|shirt|pants|dress|top)\b/i,
  /\b(sexy|hot|attractive)\s+(woman|women|man|men|person|people|girl|guy)\b/i,
  /\bsexy\s+pose\b/i,
  /\bmake\s+love\b/i,
  /\badult\s+entertainment\b/i,
];

export interface ContentFilterResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if a text prompt contains sexual content
 * @param prompt - The text prompt to check
 * @returns Object indicating if content is allowed and reason if blocked
 */
export function checkImagePrompt(prompt: string): ContentFilterResult {
  const lowerPrompt = prompt.toLowerCase();

  // Check keywords
  for (const keyword of SEXUAL_KEYWORDS) {
    if (lowerPrompt.includes(keyword)) {
      return {
        allowed: false,
        reason: `Content blocked: Prompt contains inappropriate content. Sexual imagery is not allowed.`
      };
    }
  }

  // Check patterns
  for (const pattern of SEXUAL_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        allowed: false,
        reason: `Content blocked: Prompt contains inappropriate content. Sexual imagery is not allowed.`
      };
    }
  }

  return { allowed: true };
}
