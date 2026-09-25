import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Lead } from "@/models/Lead";
import { ActivityLog } from "@/models/ActivityLog";
import { qualifyLeadWithAI } from "@/services/ai/lead-qualification";
import { apiSuccess, apiError } from "@/lib/security";
import { getCurrentWorkspace } from "@/lib/auth/workspace";

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
    await connectToDatabase();

    const lead = await Lead.findOne({
      _id: id,
      workspaceId: ctx.workspaceId,
      isArchived: false,
    });

    if (!lead) {
      return apiError("NOT_FOUND", "Lead not found in this workspace", 404);
    }

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
    lead.priority = aiResult.data.priority;
    lead.aiCategory = aiResult.data.category;
    lead.aiSummary = aiResult.data.summary;
    lead.aiReasoning = aiResult.data.reasoning;
    lead.aiRecommendedAction = aiResult.data.recommendedAction;
    lead.aiSignals = aiResult.data.signals;
    lead.aiModel = aiResult.model;
    lead.aiQualifiedAt = new Date();
    lead.updatedBy = ctx.userId;
    await lead.save();

    await ActivityLog.create({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      actor: ctx.user.name,
      eventType: "AI_QUALIFICATION_COMPLETED",
      entityType: "lead",
      entityId: lead._id.toString(),
      source: "website",
      status: "SUCCESS",
      message: `Manual AI qualification executed (Score: ${lead.aiScore}/100, Priority: ${lead.priority})`,
      metadata: {
        score: lead.aiScore,
        priority: lead.priority,
        model: aiResult.model,
        source: aiResult.source,
      },
    });

    return apiSuccess({ lead, qualification: aiResult });
  } catch (err) {
    return apiError("AI_QUALIFY_FAILED", "Failed to qualify lead", 500, err instanceof Error ? err.message : String(err));
  }
}
