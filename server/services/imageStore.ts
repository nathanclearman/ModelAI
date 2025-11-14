import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { ImageAsset, InsertImageAsset } from "../../shared/schema";
import { storage } from "../storage";

export interface ImageStoreResult {
  publicUrl: string;
  storageKey: string;
  mimeType: string;
  byteSize: number;
}

/**
 * Abstract interface for image storage
 * Implementations can use local temp storage, Replit Object Storage, S3, etc.
 */
export interface IImageStore {
  /**
   * Store an image and return its public URL
   * @param imageData - Base64 encoded image data
   * @param userId - User ID for tracking
   * @param imageType - "generated" or "upload"
   * @param prompt - Optional prompt for generated images
   * @returns Public URL and metadata
   */
  store(
    imageData: string,
    userId: string,
    imageType: "generated" | "upload",
    prompt?: string
  ): Promise<ImageStoreResult>;

  /**
   * Delete an image from storage
   * @param storageKey - The storage key/path
   */
  delete(storageKey: string): Promise<void>;

  /**
   * Clean up expired temporary images
   */
  cleanup(): Promise<void>;
}

/**
 * Local temporary image store
 * Stores images in /tmp with 24-hour expiration
 * TODO: Replace with Replit Object Storage for production
 */
export class LocalTempImageStore implements IImageStore {
  private basePath = "/tmp/model-ai-images";
  private baseUrl: string;

  constructor() {
    // Use the server's base URL for accessing images
    // In production (published), use REPLIT_DOMAINS (first domain from the list)
    // In development, use REPLIT_DEV_DOMAIN
    // Fallback to localhost for local development
    if (process.env.REPLIT_DOMAINS) {
      // Published site - use the first domain from the comma-separated list
      const domains = process.env.REPLIT_DOMAINS.split(',');
      this.baseUrl = `https://${domains[0].trim()}`;
    } else if (process.env.REPLIT_DEV_DOMAIN) {
      // Development site
      this.baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    } else {
      // Local development
      this.baseUrl = "http://localhost:5000";
    }
    console.log("[ImageStore] Using base URL:", this.baseUrl);
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      console.error("Failed to create images directory:", error);
    }
  }

  async store(
    imageData: string,
    userId: string,
    imageType: "generated" | "upload",
    prompt?: string
  ): Promise<ImageStoreResult> {
    await this.ensureDirectory();

    // Extract base64 data and mime type from data URL
    let base64Data: string;
    let mimeType = "image/png";

    if (imageData.startsWith("data:")) {
      const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        throw new Error("Invalid data URL format");
      }
      mimeType = match[1];
      base64Data = match[2];
    } else {
      base64Data = imageData;
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");
    const byteSize = buffer.length;

    // Validate size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (byteSize > maxSize) {
      throw new Error(`Image too large: ${byteSize} bytes (max ${maxSize} bytes)`);
    }

    // Generate unique filename
    const ext = mimeType.split("/")[1] || "png";
    const filename = `${userId}_${Date.now()}_${crypto.randomBytes(8).toString("hex")}.${ext}`;
    const storageKey = path.join(this.basePath, filename);

    // Write file
    await fs.writeFile(storageKey, buffer);

    // Create public URL (served via static middleware)
    const publicUrl = `${this.baseUrl}/tmp-images/${filename}`;

    // Save metadata to database
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiration

    await storage.createImageAsset({
      userId,
      storageKey,
      publicUrl,
      mimeType,
      byteSize,
      imageType,
      prompt,
      expiresAt,
    });

    return {
      publicUrl,
      storageKey,
      mimeType,
      byteSize,
    };
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await fs.unlink(storageKey);
    } catch (error) {
      console.error(`Failed to delete image ${storageKey}:`, error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      const expiredAssets = await storage.getExpiredImageAssets();
      for (const asset of expiredAssets) {
        await this.delete(asset.storageKey);
        await storage.deleteImageAsset(asset.id);
      }
    } catch (error) {
      console.error("Failed to cleanup expired images:", error);
    }
  }
}

// Export singleton instance
// TODO: Replace with ReplitObjectStore when credentials are configured
export const imageStore: IImageStore = new LocalTempImageStore();
