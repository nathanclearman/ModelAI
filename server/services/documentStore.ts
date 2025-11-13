import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export interface DocumentStoreResult {
  storageKey: string;
  publicUrl: string;
}

/**
 * Sanitize filename to prevent path traversal
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.+/g, '.')
    .slice(0, 255);
}

/**
 * Store document file in temporary storage
 * Similar to imageStore but for documents
 */
export async function storeDocument(
  buffer: Buffer,
  userId: string,
  fileName: string
): Promise<DocumentStoreResult> {
  try {
    // Create storage directory if it doesn't exist
    const storageDir = join(process.cwd(), "tmp", "documents");
    if (!existsSync(storageDir)) {
      await mkdir(storageDir, { recursive: true });
    }

    // Sanitize filename and generate unique storage key
    const sanitizedName = sanitizeFilename(fileName);
    const fileExtension = sanitizedName.split(".").pop() || "bin";
    const storageKey = `${userId}_${randomUUID()}.${fileExtension}`;
    const filePath = join(storageDir, storageKey);

    // Write file to storage
    await writeFile(filePath, buffer);

    // Generate public URL (relative to app root)
    const publicUrl = `/api/documents/files/${storageKey}`;

    return {
      storageKey: `tmp/documents/${storageKey}`,
      publicUrl,
    };
  } catch (error: any) {
    console.error("Document storage error:", error);
    throw new Error(`Failed to store document: ${error.message}`);
  }
}

/**
 * Delete document from storage
 */
export async function deleteDocument(storageKey: string): Promise<void> {
  try {
    const { unlink } = await import("fs/promises");
    // storageKey format: "tmp/documents/userId_uuid.ext"
    const filePath = join(process.cwd(), storageKey);
    console.log(`[DocumentStore] Deleting file: ${filePath}`);
    await unlink(filePath);
    console.log(`[DocumentStore] File deleted successfully: ${filePath}`);
  } catch (error: any) {
    console.error(`[DocumentStore] Delete failed for ${storageKey}:`, error);
    // Rethrow to ensure caller knows deletion failed
    throw new Error(`Failed to delete document from storage: ${error.message}`);
  }
}
