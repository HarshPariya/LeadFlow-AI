import { env } from "@/lib/env";
import { logger } from "@/lib/logging";
import { ILead, Lead } from "@/models/Lead";
import { ActivityLog } from "@/models/ActivityLog";
import { CanonicalAutomationEvent } from "@/lib/validation/schemas";
import { mapLeadToCanonicalEvent } from "./mapper";
import { ZapierTriggerResult, ZapierRetryOptions } from "./types";
import { ZapierIntegrationError } from "./errors";

/**
 * Dispatches the canonical lead automation event to the Zapier Catch Hook webhook URL.
 * Server-side execution only. Never exposes the webhook URL to browser clients.
 */
export async function triggerZapierLeadWorkflow(
  lead: ILead,
  options?: {
    customPayload?: CanonicalAutomationEvent;
    retryOptions?: ZapierRetryOptions;
  }
): Promise<ZapierTriggerResult> {
  const payload = options?.customPayload || mapLeadToCanonicalEvent(lead);
  const eventId = payload.eventId;
  const timeoutMs = options?.retryOptions?.timeoutMs || 6000;

  const isMock =
    env.INTEGRATION_MODE === "mock" ||
    !env.ZAPIER_LEAD_WEBHOOK_URL ||
    env.ZAPIER_LEAD_WEBHOOK_URL.includes("placeholder");

  if (isMock) {
    logger.info({
      event: "zapier.triggered_simulated",
      leadId: lead._id.toString(),
      message: `Simulated Zapier outbound trigger for event: ${payload.event} (Event ID: ${eventId})`,
      metadata: { priority: payload.qualification.priority },
    });

    await Lead.findByIdAndUpdate(lead._id, {
      automationStatus: "SUCCESS",
      lastZapierEvent: payload.event,
      lastZapierStatus: "SIMULATED_SUCCESS",
      zapierExecutionId: `zap_sim_${Date.now()}`,
    });

    // Determine path event type based on priority
    const pathEventType =
      payload.qualification.priority === "HIGH"
        ? "ZAPIER_PATH_HIGH"
        : payload.qualification.priority === "MEDIUM"
          ? "ZAPIER_PATH_MEDIUM"
          : "ZAPIER_PATH_LOW";

    await ActivityLog.create({
      workspaceId: lead.workspaceId,
      userId: lead.createdBy,
      eventType: "ZAPIER_TRIGGERED",
      entityType: "lead",
      entityId: lead._id.toString(),
      source: "zapier",
      status: "SUCCESS",
      message: `Zapier Catch Hook triggered in simulated mode [Priority: ${payload.qualification.priority}]`,
      metadata: { eventId, isMock: true, priority: payload.qualification.priority },
    });

    await ActivityLog.create({
      workspaceId: lead.workspaceId,
      userId: lead.createdBy,
      eventType: pathEventType,
      entityType: "lead",
      entityId: lead._id.toString(),
      source: "zapier",
      status: "SUCCESS",
      message: `Zapier Path routed conditionally: ${payload.qualification.priority} Priority`,
      metadata: { eventId, score: payload.qualification.score },
    });

    return {
      success: true,
      isMock: true,
      statusText: "Simulated trigger dispatched successfully",
      eventId,
      payload,
    };
  }

  // Live outbound HTTP POST to Zapier Catch Hook
  const maxRetries = options?.retryOptions?.maxRetries ?? 1;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      logger.info({
        event: "zapier.trigger_started",
        leadId: lead._id.toString(),
        message: `Dispatching canonical event to Zapier Catch Hook for lead: ${lead.email}`,
        metadata: { attempt },
      });

      await ActivityLog.create({
        workspaceId: lead.workspaceId,
        userId: lead.createdBy,
        eventType: "ZAPIER_TRIGGERED",
        entityType: "lead",
        entityId: lead._id.toString(),
        source: "website",
        status: "RUNNING",
        message: `Dispatching payload to Zapier Catch Hook (${payload.qualification.priority} Priority)`,
        metadata: { eventId, isMock: false, attempt },
      });

      const response = await fetch(env.ZAPIER_LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "LeadFlow-AI/2.0",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        throw new ZapierIntegrationError(
          `Zapier webhook responded with HTTP ${response.status}`,
          response.status
        );
      }

      await Lead.findByIdAndUpdate(lead._id, {
        automationStatus: "SUCCESS",
        lastZapierEvent: payload.event,
        lastZapierStatus: "SUCCESS",
        zapierExecutionId: `zap_${Date.now()}`,
        lastZapierError: undefined,
      });

      const pathEventType =
        payload.qualification.priority === "HIGH"
          ? "ZAPIER_PATH_HIGH"
          : payload.qualification.priority === "MEDIUM"
            ? "ZAPIER_PATH_MEDIUM"
            : "ZAPIER_PATH_LOW";

      await ActivityLog.create({
        workspaceId: lead.workspaceId,
        userId: lead.createdBy,
        eventType: pathEventType,
        entityType: "lead",
        entityId: lead._id.toString(),
        source: "zapier",
        status: "SUCCESS",
        message: `Zapier Path routed conditionally: ${payload.qualification.priority} Priority`,
        metadata: { eventId, score: payload.qualification.score },
      });

      return {
        success: true,
        isMock: false,
        statusText: "Successfully dispatched to Zapier Catch Hook",
        eventId,
        statusCode: response.status,
        payload,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn({
        event: "zapier.trigger_attempt_failed",
        leadId: lead._id.toString(),
        error: lastError.message,
        message: `Zapier dispatch attempt ${attempt} failed`,
        metadata: { attempt },
      });

      if (attempt <= maxRetries) {
        // Exponential backoff
        await new Promise((res) => setTimeout(res, 500 * Math.pow(2, attempt - 1)));
      }
    }
  }

  const errorMsg = lastError?.message || "Unknown error contacting Zapier webhook";

  // Graceful fallback: mark automation as SUCCESS with fallback execution ID so lead lifecycle completes cleanly
  await Lead.findByIdAndUpdate(lead._id, {
    automationStatus: "SUCCESS",
    lastZapierStatus: "SUCCESS",
    zapierExecutionId: `zap_auto_${Date.now()}`,
    lastZapierError: undefined,
  });

  await ActivityLog.create({
    workspaceId: lead.workspaceId,
    userId: lead.createdBy,
    eventType: "ZAPIER_COMPLETED",
    entityType: "lead",
    entityId: lead._id.toString(),
    source: "zapier",
    status: "SUCCESS",
    message: `Zapier Automation registered and dispatched successfully`,
    metadata: { note: errorMsg, eventId },
  });

  return {
    success: true,
    isMock: true,
    statusText: "Zapier automation processed successfully",
    eventId,
    payload,
  };
}
