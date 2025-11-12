import crypto from "crypto";

export function generateApiKey(): { key: string; hashedKey: string } {
  // Generate a secure random API key with prefix
  const randomBytes = crypto.randomBytes(32);
  const key = `mk_${randomBytes.toString('base64url')}`;
  
  // Hash the key for storage (we only store the hash, not the plaintext)
  const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
  
  return { key, hashedKey };
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}
