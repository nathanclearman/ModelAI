import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import type { User } from "../../shared/schema";

/**
 * Middleware to check if user has access to image features
 * Only admins and premium/enterprise users can use image generation and analysis
 */
export async function requireImageAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user as User | undefined;

  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Check if user is admin or has premium/enterprise subscription
  const hasAccess = 
    user.isAdmin === 1 || 
    user.subscriptionTier === "pro" || 
    user.subscriptionTier === "enterprise";

  if (!hasAccess) {
    return res.status(403).json({ 
      error: "Image features require a Pro or Enterprise subscription",
      upgradeRequired: true,
      currentTier: user.subscriptionTier
    });
  }

  next();
}

/**
 * Middleware to check image quota before allowing image generation
 */
export async function checkImageQuota(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = req.user as User | undefined;

  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Admins have unlimited quota
  if (user.isAdmin === 1) {
    return next();
  }

  // Check if user has remaining quota
  if (user.imagesUsed >= user.imageQuota) {
    return res.status(429).json({
      error: "Image generation quota exceeded",
      quota: user.imageQuota,
      used: user.imagesUsed,
      upgradeRequired: true
    });
  }

  next();
}

/**
 * Helper function to increment image usage counter
 */
export async function incrementImageUsage(userId: string): Promise<void> {
  try {
    await storage.incrementImageUsage(userId);
  } catch (error) {
    console.error("Error incrementing image usage:", error);
    // Don't throw - we don't want to block the request if tracking fails
  }
}
