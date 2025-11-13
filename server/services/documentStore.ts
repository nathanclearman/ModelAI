import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export interface DocumentStoreResult {
  storageKey: string;
  publicUrl: string;
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

    // Generate unique storage key
    const fileExtension = fileName.split(".").pop() || "bin";
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
