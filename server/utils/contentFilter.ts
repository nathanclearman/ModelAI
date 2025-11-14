/**
 * Content filtering utility to block inappropriate image generation
 * Blocks: Sexual content, hate speech, racism, homophobia
 * Allows: Political expression, social advocacy (e.g., Palestine support), violence/action
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

// Hate speech and discriminatory content (racial slurs, homophobic terms)
// Note: Contains offensive terms for detection purposes only
const HATE_KEYWORDS = [
  // Racial slurs (various spellings to catch evasion)
  'n1gger', 'n1gga', 'nigger', 'nigga', 'n1gg3r', 'n!gger',
  // Other racial slurs
  'ch1nk', 'chink', 'sp1c', 'spic', 'k1ke', 'kike', 'wetback',
  'raghead', 'towelhead', 'sand nigger', 'jungle bunny', 'coon',
  // Homophobic slurs
  'f4ggot', 'faggot', 'f4g', 'fag ', 'dyke', 'tr4nny', 'tranny',
  // Nazi/supremacist imagery
  'swastika', 'nazi salute', 'hitler salute', 'white power',
  'white supremacy', 'master race', '1488', 'heil hitler',
  // Antisemitic
  'jew rat', 'jewish conspiracy', 'greedy jew',
  // General hate/violence targeting groups
  'race war', 'racial purity', 'inferior race',
];

// Regex patterns for sexual content
const SEXUAL_PATTERNS = [
  /\b(no|without|off)\s+(clothes?|clothing|shirt|pants|dress|top)\b/i,
  /\b(sexy|hot|attractive)\s+(woman|women|man|men|person|people|girl|guy)\b/i,
  /\bsexy\s+pose\b/i,
  /\bmake\s+love\b/i,
  /\badult\s+entertainment\b/i,
];

// Hate speech patterns - targeting specific groups with violence or dehumanization
const HATE_PATTERNS = [
  // Violence against groups
  /\b(kill|murder|hang|lynch|shoot|burn)\s+(all\s+)?(blacks?|jews?|muslims?|gays?|trans|lgbtq|asians?|hispanics?|latinos?|arabs?)\b/i,
  /\b(blacks?|jews?|muslims?|gays?|trans|lgbtq|asians?|hispanics?)\s+(are|is)\s+(inferior|subhuman|animals?|scum|trash|vermin)\b/i,
  /\bgas\s+(the\s+)?(jews?|blacks?|muslims?|gays?|trans)\b/i,
  /\b(white|aryan)\s+supremacy\b/i,
  /\bexterminate\s+(the\s+)?(blacks?|jews?|muslims?|gays?|trans|lgbtq)\b/i,
];

export interface ContentFilterResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if a text prompt contains inappropriate content
 * @param prompt - The text prompt to check
 * @returns Object indicating if content is allowed and reason if blocked
 */
export function checkImagePrompt(prompt: string): ContentFilterResult {
  const lowerPrompt = prompt.toLowerCase();

  // Check for hate speech keywords first (highest priority)
  for (const keyword of HATE_KEYWORDS) {
    if (lowerPrompt.includes(keyword)) {
      return {
        allowed: false,
        reason: `Content blocked: Hate speech and discriminatory content are not allowed.`
      };
    }
  }

  // Check hate speech patterns
  for (const pattern of HATE_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        allowed: false,
        reason: `Content blocked: Hate speech and discriminatory content are not allowed.`
      };
    }
  }

  // Check sexual content keywords
  for (const keyword of SEXUAL_KEYWORDS) {
    if (lowerPrompt.includes(keyword)) {
      return {
        allowed: false,
        reason: `Content blocked: Sexual imagery is not allowed.`
      };
    }
  }

  // Check sexual content patterns
  for (const pattern of SEXUAL_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        allowed: false,
        reason: `Content blocked: Sexual imagery is not allowed.`
      };
    }
  }

  // Content is allowed (including political expression, violence/action, social advocacy)
  return { allowed: true };
}
