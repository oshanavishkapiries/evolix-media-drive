import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  // Ensure key is 32 bytes (256 bits) for AES-256
  return Buffer.from(key.padEnd(32, "0").slice(0, 32));
}

/**
 * Encrypt a string (e.g., Google Drive file ID)
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combine IV + encrypted data + auth tag
  return iv.toString("hex") + encrypted + authTag.toString("hex");
}

/**
 * Decrypt an encrypted string back to original
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();

  // Extract IV (first 32 hex chars = 16 bytes)
  const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), "hex");

  // Extract auth tag (last 32 hex chars = 16 bytes)
  const authTag = Buffer.from(encryptedText.slice(-AUTH_TAG_LENGTH * 2), "hex");

  // Extract encrypted data (middle part)
  const encrypted = encryptedText.slice(IV_LENGTH * 2, -AUTH_TAG_LENGTH * 2);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Safely encrypt - returns null on error
 */
export function safeEncrypt(text: string): string | null {
  try {
    return encrypt(text);
  } catch {
    return null;
  }
}

/**
 * Safely decrypt - returns null on error
 */
export function safeDecrypt(encryptedText: string): string | null {
  try {
    return decrypt(encryptedText);
  } catch {
    return null;
  }
}
