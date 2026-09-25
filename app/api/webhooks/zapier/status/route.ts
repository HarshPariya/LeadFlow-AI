import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Lead } from "@/models/Lead";
import { ActivityLog } from "@/models/ActivityLog";
import { AutomationRun } from "@/models/AutomationRun";
import { zapierStatusWebhookSchema } from "@/lib/validation/schemas";
import { verifyAndRecordWebhookEvent, apiSuccess, apiError } from "@/lib/security";
import { env } from "@/lib/env";
import { logger } from "@/lib/logging";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "LeadFlow AI — Zapier Status Callback Webhook",
    endpoint: "/api/webhooks/zapier/status",
    acceptedMethod: "POST",
    description: "Webhook callback receiver for Zapier automation execution status and updates.",
    ready: true,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validate Content-Type
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return apiError("INVALID_CONTENT_TYPE", "Content-Type must be application/json", 415);
    }

    // 2. Extract Authorization Bearer token
    const authHeader = req.headers.get("authorization");
    const providedSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : req.headers.get("x-webhook-secret")?.trim();

    const body = await req.json().catch(() => null);
    if (!body) {
      return apiError("EMPTY_PAYLOAD", "JSON payload is required", 400);
    }

    // 3. Schema validation with Zod
    const parsed = zapierStatusWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid Zapier callback payload schema", 422, parsed.error.flatten());
    }

    const {
      eventId,
      status,
      leadId,
      automation,
      message,
      zapierExecutionId,
      twentyPersonId,
      twentyCompanyId,
      metadata,
    } = parsed.data;

    await connectToDatabase();

    // 4. Verify Secret & Idempotency / Replay Protection
    const verification = await verifyAndRecordWebhookEvent(
      eventId,
      "zapier",
      "automation.status",
      providedSecret,
      env.ZAPIER_STATUS_WEBHOOK_SECRET
    );

    if (!verification.valid) {
      return apiError("UNAUTHORIZED", verification.error || "Invalid webhook secret", 401);
    }

    if (verification.isDuplicate) {
      logger.info({
        event: "webhook.idempotent_duplicate",
        message: `Duplicate Zapier status callback ignored idempotently (${eventId})`,
      });
      return apiSuccess({
        status: "IGNORED_DUPLICATE",
        message: "Event already processed previously",
        eventId,
      }, 200);
    }

    // 5. Update Lead Status
    const lead = await Lead.findById(leadId);
    if (lead) {
      lead.lastZapierStatus = status;
      lead.automationStatus = status;
      if (zapierExecutionId) lead.zapierExecutionId = zapierExecutionId;
      if (twentyPersonId) lead.twentyPersonId = twentyPersonId;
      if (twentyCompanyId) lead.twentyCompanyId = twentyCompanyId;
      if (status === "FAILED") lead.lastZapierError = message || "Zapier execution failed";
      await lead.save();
    }

    // 6. Record Audit Activity Log
    await ActivityLog.create({
      workspaceId: lead?.workspaceId,
      eventType: status === "FAILED" ? "ZAPIER_FAILED" : "ZAPIER_COMPLETED",
      entityType: "lead",
      entityId: leadId,
      source: "zapier",
      status: status === "FAILED" ? "FAILED" : "SUCCESS",
      message: `Zapier callback reported: ${status}${message ? ` — ${message}` : ""}`,
      metadata: {
        eventId,
        automation,
        zapierExecutionId,
        twentyPersonId,
        metadata,
      },
    });

    // 7. Update recent AutomationRun steps if found
    await AutomationRun.findOneAndUpdate(
      { leadId, zapierExecutionId: { $exists: true } },
      {
        status: status === "FAILED" ? "PARTIAL" : "SUCCESS",
        $push: {
          steps: {
            name: `Zapier Callback (${automation})`,
            status: status === "FAILED" ? "FAILED" : "SUCCESS",
            completedAt: new Date(),
            durationMs: 50,
            outputSummary: message || `Status: ${status}`,
          },
        },
      },
      { sort: { createdAt: -1 } }
    );

    logger.info({
      event: "webhook.zapier_status_processed",
      leadId,
      status: status === "FAILED" ? "failure" : "success",
      message: `Successfully processed Zapier webhook status callback (${eventId})`,
    });

    return apiSuccess({
      received: true,
      status,
      eventId,
      leadId,
    });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to process webhook event", 500, err instanceof Error ? err.message : String(err));
  }
}
