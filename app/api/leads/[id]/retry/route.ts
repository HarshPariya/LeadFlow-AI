import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Lead } from "@/models/Lead";
import { ActivityLog } from "@/models/ActivityLog";
import { AutomationRun } from "@/models/AutomationRun";
import { qualifyLeadWithAI } from "@/services/ai/lead-qualification";
import { calculatePriority } from "@/lib/scoring";
import { triggerZapierLeadWorkflow } from "@/lib/integrations/zapier/client";
import { mapLeadToCanonicalEvent } from "@/lib/integrations/zapier/mapper";
import { triggerTwentyWorkflow } from "@/lib/integrations/twenty/client";
import { syncLeadToTwenty } from "@/lib/integrations/twenty/sync";
import { apiSuccess, apiError } from "@/lib/security";
import { getCurrentWorkspace } from "@/lib/auth/workspace";
import { env } from "@/lib/env";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const target = (searchParams.get("target") || body?.target || "all").toLowerCase();

    await connectToDatabase();

    const lead = await Lead.findOne({
      _id: id,
      workspaceId: ctx.workspaceId,
      isArchived: false,
    });

    if (!lead) {
      return apiError("NOT_FOUND", "Lead not found in this workspace", 404);
    }

    lead.retryCount = (lead.retryCount || 0) + 1;
    lead.automationStatus = "RETRYING";
    lead.updatedBy = ctx.userId;
    await lead.save();

    await ActivityLog.create({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      actor: ctx.user.name,
      eventType: "AUTOMATION_RETRIED",
      entityType: "lead",
      entityId: lead._id.toString(),
      source: "website",
      status: "RUNNING",
      message: `Automation retry triggered for target: ${target.toUpperCase()} (Attempt #${lead.retryCount})`,
    });

    const steps = [];

    // 1. Retry AI Qualification
    if (target === "ai" || target === "all") {
      try {
        const aiResult = await qualifyLeadWithAI({
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          company: lead.company,
          jobTitle: lead.jobTitle,
          requirement: lead.requirement,
          budget: lead.budget,
          timeline: lead.timeline,
          industry: lead.industry,
          country: lead.country,
        });

        lead.aiScore = aiResult.data.score;
        lead.priority = calculatePriority(aiResult.data.score);
        lead.aiCategory = aiResult.data.category;
        lead.aiSummary = aiResult.data.summary;
        lead.aiReasoning = aiResult.data.reasoning;
        lead.aiRecommendedAction = aiResult.data.recommendedAction;
        lead.aiSignals = aiResult.data.signals;
        lead.aiModel = aiResult.model;
        lead.aiQualifiedAt = new Date();
        await lead.save();

        steps.push({
          name: "Groq AI Qualification (Retry)",
          status: "SUCCESS" as const,
          completedAt: new Date(),
          outputSummary: `Re-scored ${lead.aiScore}/100 (${lead.priority})`,
        });
      } catch (aiErr) {
        steps.push({
          name: "Groq AI Qualification (Retry)",
          status: "FAILED" as const,
          completedAt: new Date(),
          error: aiErr instanceof Error ? aiErr.message : String(aiErr),
        });
      }
    }

    const eventId = `retry_evt_${lead._id.toString()}_${Date.now()}`;
    const canonicalEvent = mapLeadToCanonicalEvent(lead, { eventId });

    // 2. Retry Twenty CRM
    if (target === "twenty" || target === "all") {
      if (env.TWENTY_WORKFLOW_WEBHOOK_URL && !env.TWENTY_WORKFLOW_WEBHOOK_URL.includes("placeholder")) {
        const twentyRes = await triggerTwentyWorkflow(canonicalEvent);
        steps.push({
          name: "Twenty CRM Workflow (Retry)",
          status: twentyRes.success ? ("SUCCESS" as const) : ("FAILED" as const),
          completedAt: new Date(),
          outputSummary: twentyRes.statusText,
          error: twentyRes.error,
        });
      } else {
        try {
          const syncRes = await syncLeadToTwenty(lead);
          steps.push({
            name: "Twenty CRM Sync (Retry Direct)",
            status: "SUCCESS" as const,
            completedAt: new Date(),
            outputSummary: `Synced to Person (${syncRes.personId || "OK"})`,
          });
        } catch (err) {
          steps.push({
            name: "Twenty CRM Sync (Retry Direct)",
            status: "FAILED" as const,
            completedAt: new Date(),
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    // 3. Retry Zapier
    if (target === "zapier" || target === "all") {
      const zapRes = await triggerZapierLeadWorkflow(lead, { customPayload: canonicalEvent });
      steps.push({
        name: "Zapier Catch Hook Dispatch (Retry)",
        status: zapRes.success ? ("SUCCESS" as const) : ("FAILED" as const),
        completedAt: new Date(),
        outputSummary: zapRes.statusText,
        error: zapRes.error,
      });
    }

    const isAllSuccess = steps.every((s) => s.status === "SUCCESS");
    lead.automationStatus = isAllSuccess ? "SUCCESS" : "FAILED";
    await lead.save();

    await AutomationRun.create({
      workspaceId: ctx.workspaceId,
      leadId: lead._id,
      leadName: `${lead.firstName} ${lead.lastName}`,
      leadEmail: lead.email,
      workflowName: `Manual Retry (${target.toUpperCase()}) #${lead.retryCount}`,
      status: isAllSuccess ? "SUCCESS" : "FAILED",
      triggerSource: `retry_${target}`,
      steps,
      retryCount: lead.retryCount,
    });

    const updatedLead = await Lead.findById(id);

    return apiSuccess({
      lead: updatedLead,
      target,
      retrySuccess: isAllSuccess,
      steps,
    });
  } catch (err) {
    return apiError("RETRY_FAILED", "Failed to retry automation", 500, err instanceof Error ? err.message : String(err));
  }
}
