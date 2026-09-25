import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Lead } from "@/models/Lead";
import { Task } from "@/models/Task";
import { Opportunity } from "@/models/Opportunity";
import { ActivityLog } from "@/models/ActivityLog";
import { AutomationRun } from "@/models/AutomationRun";
import { leadUpdateSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/security";
import { getCurrentWorkspace } from "@/lib/auth/workspace";

export async function GET(
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

    // Verify ownership in current workspace
    const lead = await Lead.findOne({
      _id: id,
      workspaceId: ctx.workspaceId,
      isArchived: false,
    });

    if (!lead) {
      return apiError("NOT_FOUND", "Lead not found in this workspace", 404);
    }

    // Fetch related records scoped to this workspace
    const [tasks, opportunities, activities, automationRuns] = await Promise.all([
      Task.find({ workspaceId: ctx.workspaceId, leadId: lead._id }).sort({ createdAt: -1 }),
      Opportunity.find({ workspaceId: ctx.workspaceId, leadId: lead._id }).sort({ createdAt: -1 }),
      ActivityLog.find({ workspaceId: ctx.workspaceId, entityId: lead._id.toString() })
        .sort({ timestamp: -1 })
        .limit(50),
      AutomationRun.find({ workspaceId: ctx.workspaceId, leadId: lead._id })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return apiSuccess({
      lead,
      related: {
        tasks,
        opportunities,
        activities,
        automationRuns,
      },
    });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to retrieve lead details", 500, err instanceof Error ? err.message : String(err));
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = leadUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid update payload", 400, parsed.error.flatten());
    }

    await connectToDatabase();

    const lead = await Lead.findOne({
      _id: id,
      workspaceId: ctx.workspaceId,
      isArchived: false,
    });

    if (!lead) {
      return apiError("NOT_FOUND", "Lead not found in this workspace", 404);
    }

    const previousStatus = lead.status;
    Object.assign(lead, parsed.data);
    lead.updatedBy = ctx.userId;
    lead.updatedAt = new Date();
    await lead.save();

    const currentUser = ctx.user.name || "Authenticated User";
    await ActivityLog.create({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      actor: currentUser,
      eventType: "LEAD_UPDATED",
      entityType: "lead",
      entityId: lead._id.toString(),
      user: currentUser,
      source: "website",
      status: "SUCCESS",
      message: `Lead updated by ${currentUser}${previousStatus !== lead.status ? ` (Status changed from ${previousStatus} to ${lead.status})` : ""}`,
      metadata: { changedFields: Object.keys(parsed.data) },
    });

    return apiSuccess({ lead });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to update lead", 500, err instanceof Error ? err.message : String(err));
  }
}

export async function DELETE(
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
    });

    if (!lead) {
      return apiError("NOT_FOUND", "Lead not found in this workspace", 404);
    }

    lead.isArchived = true;
    lead.updatedBy = ctx.userId;
    await lead.save();

    const currentUser = ctx.user.name || "Authenticated User";
    await ActivityLog.create({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      actor: currentUser,
      eventType: "LEAD_UPDATED",
      entityType: "lead",
      entityId: lead._id.toString(),
      user: currentUser,
      source: "website",
      status: "INFO",
      message: `Lead archived by ${currentUser}`,
    });

    return apiSuccess({ message: "Lead archived successfully" });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to archive lead", 500, err instanceof Error ? err.message : String(err));
  }
}
