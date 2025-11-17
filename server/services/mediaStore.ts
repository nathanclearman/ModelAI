import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { MediaAsset, InsertMediaAsset } from "../../shared/schema";
import { storage } from "../storage";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export interface MediaStoreResult {
  publicUrl: string;
  storageKey: string;
  mimeType: string;
  byteSize: number;
}

export interface IMediaStore {
  store(
    mediaData: string | Buffer,
    userId: string,
    mediaType: "audio" | "video",
    mimeType: string,
    conversationId?: string
  ): Promise<MediaStoreResult>;
  delete(storageKey: string): Promise<void>;
  cleanup(): Promise<void>;
}

export class LocalTempMediaStore implements IMediaStore {
  private basePath = "/tmp/model-ai-media";
  private baseUrl: string;

      constructor() {
        // Supports: BASE_URL, DOMAIN, REPLIT_DOMAINS, REPLIT_DEV_DOMAIN
        if (process.env.BASE_URL) {
          this.baseUrl = process.env.BASE_URL.replace(/\/$/, '');
        } else if (process.env.DOMAIN) {
          const protocol = process.env.DOMAIN.includes('localhost') ? 'http' : 'https';
          this.baseUrl = `${protocol}://${process.env.DOMAIN}`;
        } else if (process.env.REPLIT_DOMAINS) {
          const domains = process.env.REPLIT_DOMAINS.split(',');
          this.baseUrl = `https://${domains[0].trim()}`;
        } else if (process.env.REPLIT_DEV_DOMAIN) {
          this.baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
        } else {
          this.baseUrl = "http://localhost:5000";
        }
        console.log("[MediaStore] Using base URL:", this.baseUrl);
      }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      console.error("Failed to create media directory:", error);
    }
  }

  async store(
    mediaData: string | Buffer,
    userId: string,
    mediaType: "audio" | "video",
    mimeType: string,
    conversationId?: string
  ): Promise<MediaStoreResult> {
    await this.ensureDirectory();

    let buffer: Buffer;
    if (typeof mediaData === "string") {
      // Handle base64 data URL
      if (mediaData.startsWith("data:")) {
        const match = mediaData.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) {
          throw new Error("Invalid data URL format");
        }
        buffer = Buffer.from(match[2], "base64");
      } else {
        buffer = Buffer.from(mediaData, "base64");
      }
    } else {
      buffer = mediaData;
    }

    const byteSize = buffer.length;
    const maxSize = mediaType === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for audio
    if (byteSize > maxSize) {
      throw new Error(`Media too large: ${byteSize} bytes (max ${maxSize} bytes)`);
    }

    const ext = mimeType.split("/")[1]?.split(";")[0] || (mediaType === "audio" ? "mp3" : "mp4");
    const filename = `${userId}_${Date.now()}_${crypto.randomBytes(8).toString("hex")}.${ext}`;
    const storageKey = path.join(this.basePath, filename);

    await fs.writeFile(storageKey, buffer);

    const publicUrl = `${this.baseUrl}/tmp-media/${filename}`;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiration

    await storage.createMediaAsset({
      userId,
      conversationId: conversationId || null,
      mediaType,
      contentType: mimeType,
      storageKey,
      publicUrl,
      byteSize,
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
      console.error(`Failed to delete media ${storageKey}:`, error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      const expiredAssets = await storage.getExpiredMediaAssets();
      for (const asset of expiredAssets) {
        await this.delete(asset.storageKey);
        await storage.deleteMediaAsset(asset.id);
      }
    } catch (error) {
      console.error("Failed to cleanup expired media:", error);
    }
  }
}

export class CloudflareR2MediaStore implements IMediaStore {
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
    if (publicDomain) {
      this.publicUrl = publicDomain.startsWith('http') ? publicDomain : `https://${publicDomain}`;
      console.log("[MediaStore] Using R2 custom domain:", this.publicUrl);
    } else {
      this.publicUrl = `https://${accountId}.r2.dev/${bucketName}`;
      console.warn("[MediaStore] WARNING: Using default R2 URL. Make sure your bucket has public access enabled, or set R2_PUBLIC_DOMAIN with a custom domain.");
    }

    try {
      this.s3Client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      console.log("[MediaStore] R2 S3Client initialized successfully");
      console.log("[MediaStore] Bucket:", this.bucketName);
      console.log("[MediaStore] Endpoint:", `https://${accountId}.r2.cloudflarestorage.com`);
      console.log("[MediaStore] Public URL:", this.publicUrl);
    } catch (error: any) {
      console.error("[MediaStore] Failed to create S3Client:", error);
      throw new Error(`Failed to initialize R2 client: ${error.message}`);
    }
  }

  async store(
    mediaData: string | Buffer,
    userId: string,
    mediaType: "audio" | "video",
    mimeType: string,
    conversationId?: string
  ): Promise<MediaStoreResult> {
    let buffer: Buffer;
    if (typeof mediaData === "string") {
      if (mediaData.startsWith("data:")) {
        const match = mediaData.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) {
          throw new Error("Invalid data URL format");
        }
        buffer = Buffer.from(match[2], "base64");
      } else {
        buffer = Buffer.from(mediaData, "base64");
      }
    } else {
      buffer = mediaData;
    }

    const byteSize = buffer.length;
    const maxSize = mediaType === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (byteSize > maxSize) {
      throw new Error(`Media too large: ${byteSize} bytes (max ${maxSize} bytes)`);
    }

    const ext = mimeType.split("/")[1]?.split(";")[0] || (mediaType === "audio" ? "mp3" : "mp4");
    const filename = `${userId}/${Date.now()}_${crypto.randomBytes(8).toString("hex")}.${ext}`;
    const storageKey = `media/${filename}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    const publicUrl = `${this.publicUrl}/${storageKey}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day expiration

    await storage.createMediaAsset({
      userId,
      conversationId: conversationId || null,
      mediaType,
      contentType: mimeType,
      storageKey,
      publicUrl,
      byteSize,
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
      const key = storageKey.startsWith("media/") ? storageKey : `media/${storageKey}`;
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
    } catch (error) {
      console.error(`Failed to delete media ${storageKey} from R2:`, error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      const expiredAssets = await storage.getExpiredMediaAssets();
      for (const asset of expiredAssets) {
        await this.delete(asset.storageKey);
        await storage.deleteMediaAsset(asset.id);
      }
    } catch (error) {
      console.error("Failed to cleanup expired media from R2:", error);
    }
  }
}

function getMediaStore(): IMediaStore {
  const hasR2Config = 
    process.env.R2_ACCOUNT_ID?.trim() &&
    process.env.R2_ACCESS_KEY_ID?.trim() &&
    process.env.R2_SECRET_ACCESS_KEY?.trim() &&
    process.env.R2_BUCKET_NAME?.trim();

  if (hasR2Config) {
    try {
      console.log("[MediaStore] Attempting to initialize Cloudflare R2...");
      const store = new CloudflareR2MediaStore();
      console.log("[MediaStore] ✅ R2 initialized successfully");
      return store;
    } catch (error: any) {
      console.error("[MediaStore] ❌ Failed to initialize R2:");
      console.error("[MediaStore] Error:", error.message || error);
      console.error("[MediaStore] Stack:", error.stack);
      console.error("[MediaStore] Falling back to local temp storage");
      return new LocalTempMediaStore();
    }
  }

  console.log("[MediaStore] R2 not configured, using local temp storage");
  return new LocalTempMediaStore();
}

export const mediaStore: IMediaStore = getMediaStore();

