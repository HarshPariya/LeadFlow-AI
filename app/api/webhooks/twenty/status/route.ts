import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Lead } from "@/models/Lead";
import { ActivityLog } from "@/models/ActivityLog";
import { AutomationRun } from "@/models/AutomationRun";
import { Opportunity } from "@/models/Opportunity";
import { Task } from "@/models/Task";
import { twentyStatusWebhookSchema } from "@/lib/validation/schemas";
import { verifyAndRecordWebhookEvent, apiSuccess, apiError } from "@/lib/security";
import { env } from "@/lib/env";
import { logger } from "@/lib/logging";
import { getOpportunityStageForPriority, getTaskDueDateForPriority } from "@/lib/integrations/twenty/mapper";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "LeadFlow AI — Twenty CRM Status Callback Webhook",
    endpoint: "/api/webhooks/twenty/status",
    acceptedMethod: "POST",
    description: "Webhook callback receiver for Twenty CRM workflow automations.",
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

    // 2. Extract Authorization Bearer token or header secret
    const authHeader = req.headers.get("authorization");
    const providedSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : req.headers.get("x-webhook-secret")?.trim();

    const body = await req.json().catch(() => null);
    if (!body) {
      return apiError("EMPTY_PAYLOAD", "JSON payload is required", 400);
    }

    // 3. Schema validation with Zod
    const parsed = twentyStatusWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid Twenty callback payload schema", 422, parsed.error.flatten());
    }

    const payload = parsed.data;
    const { eventId, leadId, status, event } = payload;

    await connectToDatabase();

    // 4. Verify Secret & Idempotency / Replay Protection
    const verification = await verifyAndRecordWebhookEvent(
      eventId,
      "twenty",
      event,
      providedSecret,
      env.WEBHOOK_SECRET
    );

    if (!verification.valid) {
      return apiError("UNAUTHORIZED", verification.error || "Invalid webhook secret", 401);
    }

    if (verification.isDuplicate) {
      logger.info({
        event: "webhook.twenty_duplicate",
        message: `Duplicate Twenty status callback ignored idempotently (${eventId})`,
      });
      return apiSuccess({
        status: "IGNORED_DUPLICATE",
        message: "Event already processed previously",
        eventId,
      }, 200);
    }

    // 5. Update Lead Status
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return apiError("NOT_FOUND", `Lead with ID ${leadId} not found`, 404);
    }

    if (status === "SUCCESS") {
      if (payload.personId) lead.twentyPersonId = payload.personId;
      if (payload.companyId) lead.twentyCompanyId = payload.companyId;
      if (payload.opportunityId) lead.twentyOpportunityId = payload.opportunityId;
      if (payload.taskId) lead.twentyTaskId = payload.taskId;
      lead.syncStatus = "SYNCED";
      lead.lastSyncedAt = new Date();
      lead.syncError = undefined;
      await lead.save();

      // Record Activity Log for Twenty Sync Completion
      await ActivityLog.create({
        workspaceId: lead.workspaceId,
        userId: lead.createdBy,
        eventType: "TWENTY_SYNC_COMPLETED",
        entityType: "lead",
        entityId: leadId,
        source: "twenty",
        status: "SUCCESS",
        message: `Twenty CRM workflow completed: Person (${payload.personId || "Synced"}), Company (${payload.companyId || "Synced"})`,
        metadata: {
          eventId,
          personId: payload.personId,
          companyId: payload.companyId,
          opportunityId: payload.opportunityId,
          taskId: payload.taskId,
        },
      });

      // If an Opportunity was created by Twenty, persist/update locally
      if (payload.opportunityId) {
        const stage = getOpportunityStageForPriority(lead.priority);
        await Opportunity.findOneAndUpdate(
          { workspaceId: lead.workspaceId, leadId: lead._id },
          {
            workspaceId: lead.workspaceId,
            createdBy: lead.createdBy,
            name: `${lead.company || lead.firstName} — Enterprise Deal`,
            companyName: lead.company || "Independent",
            leadId: lead._id,
            primaryContact: `${lead.firstName} ${lead.lastName}`,
            value: lead.budget || 25000,
            stage,
            probability: lead.priority === "HIGH" ? 70 : 40,
            twentyOpportunityId: payload.opportunityId,
          },
          { upsert: true, new: true }
        );

        await ActivityLog.create({
          workspaceId: lead.workspaceId,
          userId: lead.createdBy,
          eventType: "OPPORTUNITY_CREATED",
          entityType: "opportunity",
          entityId: payload.opportunityId,
          source: "twenty",
          status: "SUCCESS",
          message: `Twenty CRM created Opportunity (${stage} Stage)`,
          metadata: { opportunityId: payload.opportunityId, priority: lead.priority },
        });
      }

      // If a Task was created by Twenty, persist/update locally
      if (payload.taskId) {
        const dueDate = getTaskDueDateForPriority(lead.priority);
        await Task.findOneAndUpdate(
          { workspaceId: lead.workspaceId, leadId: lead._id },
          {
            workspaceId: lead.workspaceId,
            createdBy: lead.createdBy,
            title: `Follow up with ${lead.firstName} ${lead.lastName} (${lead.priority} Priority)`,
            description: lead.aiRecommendedAction || `Requirement: ${lead.requirement}`,
            leadId: lead._id,
            leadName: `${lead.firstName} ${lead.lastName}`,
            companyName: lead.company,
            priority: lead.priority,
            dueDate,
            status: "TODO",
            assignee: "Sales Rep",
          },
          { upsert: true, new: true }
        );

        await ActivityLog.create({
          workspaceId: lead.workspaceId,
          userId: lead.createdBy,
          eventType: "TASK_CREATED",
          entityType: "task",
          entityId: payload.taskId,
          source: "twenty",
          status: "SUCCESS",
          message: `Twenty CRM created Follow-up Task due ${dueDate.toLocaleDateString()}`,
          metadata: { taskId: payload.taskId, priority: lead.priority },
        });
      }

      // Update recent AutomationRun
      await AutomationRun.findOneAndUpdate(
        { leadId },
        {
          twentyPersonId: payload.personId,
          $push: {
            steps: {
              name: "Twenty Workflow Callback",
              status: "SUCCESS",
              completedAt: new Date(),
              durationMs: 45,
              outputSummary: `CRM Workflow completed: Person ${payload.personId || "OK"}`,
            },
          },
        },
        { sort: { createdAt: -1 } }
      );
    } else {
      // Status is FAILED
      const errorMsg = payload.message || payload.errorCode || "Twenty workflow execution failed";
      lead.syncStatus = "FAILED";
      lead.syncError = errorMsg;
      await lead.save();

      await ActivityLog.create({
        workspaceId: lead.workspaceId,
        userId: lead.createdBy,
        eventType: "TWENTY_SYNC_FAILED",
        entityType: "lead",
        entityId: leadId,
        source: "twenty",
        status: "FAILED",
        message: `Twenty CRM workflow reported failure: ${errorMsg}`,
        metadata: {
          eventId,
          errorCode: payload.errorCode,
          message: errorMsg,
        },
      });

      await AutomationRun.findOneAndUpdate(
        { leadId },
        {
          $push: {
            steps: {
              name: "Twenty Workflow Callback",
              status: "FAILED",
              completedAt: new Date(),
              durationMs: 45,
              outputSummary: `Failed: ${errorMsg}`,
              error: errorMsg,
            },
          },
        },
        { sort: { createdAt: -1 } }
      );
    }

    logger.info({
      event: "webhook.twenty_status_processed",
      leadId,
      status: status === "SUCCESS" ? "success" : "failure",
      message: `Processed Twenty CRM status callback (${eventId})`,
    });

    return apiSuccess({
      received: true,
      status,
      eventId,
      leadId,
    });
  } catch (err) {
    return apiError(
      "INTERNAL_ERROR",
      "Failed to process Twenty webhook callback",
      500,
      err instanceof Error ? err.message : String(err)
    );
  }
}
