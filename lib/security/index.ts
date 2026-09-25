import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { ProcessedWebhookEvent } from "@/models/ProcessedWebhookEvent";
import { logger } from "@/lib/logging";

// ==========================================
// Standard API Response Helpers
// ==========================================
export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details: details || null,
      },
    },
    { status }
  );
}

// ==========================================
// In-Memory Rate Limiting (Production-ready fallback)
// ==========================================
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}

// Clean up stale rate limit entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 120_000);
}

// ==========================================
// Webhook Idempotency & Security Verification
// ==========================================
export async function verifyAndRecordWebhookEvent(
  eventId: string,
  source: string,
  eventType: string,
  providedSecret?: string | null,
  expectedSecret: string = env.ZAPIER_STATUS_WEBHOOK_SECRET
): Promise<{ valid: boolean; isDuplicate: boolean; error?: string }> {
  // 1. Verify Secret
  if (providedSecret !== expectedSecret) {
    logger.warn({
      event: "webhook.unauthorized_attempt",
      source,
      message: `Invalid webhook authorization secret provided for event: ${eventId}`,
    });
    return {
      valid: false,
      isDuplicate: false,
      error: "Unauthorized: Invalid webhook secret token",
    };
  }

  // 2. Check Idempotency via ProcessedWebhookEvent
  try {
    const existing = await ProcessedWebhookEvent.findOne({ eventId });
    if (existing) {
      logger.info({
        event: "webhook.duplicate_ignored",
        source,
        message: `Ignoring duplicate webhook event: ${eventId}`,
        metadata: { eventId },
      });
      return {
        valid: true,
        isDuplicate: true,
      };
    }

    // Record as processed
    await ProcessedWebhookEvent.create({
      eventId,
      source,
      eventType,
      status: "PROCESSED",
      receivedAt: new Date(),
      processedAt: new Date(),
    });

    return {
      valid: true,
      isDuplicate: false,
    };
  } catch (err) {
    // Handle race condition unique key error
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return { valid: true, isDuplicate: true };
    }
    throw err;
  }
}
