import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { ImageAsset, InsertImageAsset } from "../../shared/schema";
import { storage } from "../storage";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

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
    // Supports: BASE_URL, IMAGE_BASE_URL, DOMAIN, REPLIT_DOMAINS, REPLIT_DEV_DOMAIN
    // Fallback to localhost for local development
    if (process.env.BASE_URL) {
      this.baseUrl = process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash
    } else if (process.env.IMAGE_BASE_URL) {
      this.baseUrl = process.env.IMAGE_BASE_URL.replace(/\/$/, '');
    } else if (process.env.DOMAIN) {
      const protocol = process.env.DOMAIN.includes('localhost') ? 'http' : 'https';
      this.baseUrl = `${protocol}://${process.env.DOMAIN}`;
    } else if (process.env.REPLIT_DOMAINS) {
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

/**
 * Cloudflare R2 image store (S3-compatible)
 * Production-ready cloud storage with CDN
 */
export class CloudflareR2ImageStore implements IImageStore {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID?.trim();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
    const bucketName = process.env.R2_BUCKET_NAME?.trim();
    const publicDomain = process.env.R2_PUBLIC_DOMAIN?.trim();

    // Validate all required credentials
    if (!accountId) {
      throw new Error("R2_ACCOUNT_ID is missing or empty");
    }
    if (!accessKeyId) {
      throw new Error("R2_ACCESS_KEY_ID is missing or empty");
    }
    if (!secretAccessKey) {
      throw new Error("R2_SECRET_ACCESS_KEY is missing or empty");
    }
    if (!bucketName) {
      throw new Error("R2_BUCKET_NAME is missing or empty");
    }

    this.bucketName = bucketName;
    
    // Construct public URL
    // IMPORTANT: R2 buckets are NOT public by default
    // You need either:
    // 1. A custom domain connected to the bucket (set R2_PUBLIC_DOMAIN)
    // 2. Or enable public access on the bucket and use the R2 public URL
    if (publicDomain) {
      // Custom domain (recommended)
      this.publicUrl = publicDomain.startsWith('http') ? publicDomain : `https://${publicDomain}`;
      console.log("[ImageStore] Using R2 custom domain:", this.publicUrl);
    } else {
      // Default R2 public URL (requires bucket to be public)
      // Format: https://pub-<hash>.r2.dev or https://<account-id>.r2.dev/<bucket-name>
      // Note: This only works if the bucket has public access enabled
      this.publicUrl = `https://${accountId}.r2.dev/${bucketName}`;
      console.warn("[ImageStore] WARNING: Using default R2 URL. Make sure your bucket has public access enabled, or set R2_PUBLIC_DOMAIN with a custom domain.");
    }

    // R2 is S3-compatible, use S3 client with R2 endpoint
    try {
      this.s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      console.log("[ImageStore] R2 S3Client initialized successfully");
      console.log("[ImageStore] Bucket:", this.bucketName);
      console.log("[ImageStore] Endpoint:", `https://${accountId}.r2.cloudflarestorage.com`);
      console.log("[ImageStore] Public URL:", this.publicUrl);
    } catch (error: any) {
      console.error("[ImageStore] Failed to create S3Client:", error);
      throw new Error(`Failed to initialize R2 client: ${error.message}`);
    }
  }

  async store(
    imageData: string,
    userId: string,
    imageType: "generated" | "upload",
    prompt?: string
  ): Promise<ImageStoreResult> {
    // Extract base64 data and mime type
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

    const buffer = Buffer.from(base64Data, "base64");
    const byteSize = buffer.length;

    // Validate size (max 10MB for R2)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (byteSize > maxSize) {
      throw new Error(`Image too large: ${byteSize} bytes (max ${maxSize} bytes)`);
    }

    // Generate unique filename
    const ext = mimeType.split("/")[1] || "png";
    const filename = `${userId}/${Date.now()}_${crypto.randomBytes(8).toString("hex")}.${ext}`;
    const storageKey = `images/${filename}`;

    // Upload to R2
    // Note: R2 doesn't support ACL, use bucket public access settings instead
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: storageKey,
          Body: buffer,
          ContentType: mimeType,
        })
      );
      console.log(`[ImageStore] Successfully uploaded to R2: ${storageKey}`);
    } catch (error: any) {
      console.error("[ImageStore] R2 upload error:", error);
      console.error("[ImageStore] Error details:", {
        code: error.Code || error.code,
        message: error.message,
        bucket: this.bucketName,
        key: storageKey,
      });
      throw new Error(`Failed to upload image to R2: ${error.message || error.Code || 'Unknown error'}`);
    }

    const publicUrl = `${this.publicUrl}/${storageKey}`;

    // Save metadata to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day expiration for cloud storage

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
      // Remove "images/" prefix if present (for backward compatibility)
      const key = storageKey.startsWith("images/") ? storageKey : `images/${storageKey}`;
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
    } catch (error) {
      console.error(`Failed to delete image ${storageKey} from R2:`, error);
    }
  }

  async cleanup(): Promise<void> {
    // R2 cleanup is handled by expiration in database
    // You can add S3 lifecycle policies in R2 dashboard for automatic cleanup
    try {
      const expiredAssets = await storage.getExpiredImageAssets();
      for (const asset of expiredAssets) {
        await this.delete(asset.storageKey);
        await storage.deleteImageAsset(asset.id);
      }
    } catch (error) {
      console.error("Failed to cleanup expired images from R2:", error);
    }
  }
}

/**
 * Get the appropriate image store based on environment
 * Uses R2 if configured, falls back to local temp storage
 */
function getImageStore(): IImageStore {
  // Check if R2 is configured
  if (
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  ) {
    try {
      return new CloudflareR2ImageStore();
    } catch (error) {
      console.error("[ImageStore] Failed to initialize R2, falling back to local:", error);
      return new LocalTempImageStore();
    }
  }

  // Fallback to local storage
  console.log("[ImageStore] R2 not configured, using local temp storage");
  return new LocalTempImageStore();
}

// Export singleton instance
export const imageStore: IImageStore = getImageStore();
