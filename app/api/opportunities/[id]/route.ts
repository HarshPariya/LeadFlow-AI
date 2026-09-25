import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Opportunity } from "@/models/Opportunity";
import { ActivityLog } from "@/models/ActivityLog";
import { opportunityCreateSchema } from "@/lib/validation/schemas";
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
    const opp = await Opportunity.findOne({ _id: id, workspaceId: ctx.workspaceId });
    if (!opp) return apiError("NOT_FOUND", "Opportunity not found in this workspace", 404);
    return apiSuccess({ opportunity: opp });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to retrieve opportunity", 500, err instanceof Error ? err.message : String(err));
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
    const parsed = opportunityCreateSchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid update data", 400, parsed.error.flatten());
    }

    await connectToDatabase();
    const opp = await Opportunity.findOneAndUpdate(
      { _id: id, workspaceId: ctx.workspaceId },
      parsed.data,
      { new: true }
    );
    if (!opp) return apiError("NOT_FOUND", "Opportunity not found in this workspace", 404);

    await ActivityLog.create({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      actor: ctx.user.name,
      user: ctx.user.name,
      eventType: "OPPORTUNITY_UPDATED",
      entityType: "opportunity",
      entityId: opp._id.toString(),
      source: "website",
      status: "SUCCESS",
      message: `Updated opportunity: "${opp.name}" [Stage: ${opp.stage}]`,
      metadata: parsed.data,
    });

    return apiSuccess({ opportunity: opp });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to update opportunity", 500, err instanceof Error ? err.message : String(err));
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
    const opp = await Opportunity.findOneAndDelete({ _id: id, workspaceId: ctx.workspaceId });
    if (!opp) return apiError("NOT_FOUND", "Opportunity not found in this workspace", 404);

    await ActivityLog.create({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      actor: ctx.user.name,
      user: ctx.user.name,
      eventType: "SETTINGS_UPDATED",
      entityType: "opportunity",
      entityId: id,
      source: "website",
      status: "SUCCESS",
      message: `Deleted opportunity: "${opp.name}"`,
    });

    return apiSuccess({ message: "Opportunity deleted successfully" });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to delete opportunity", 500, err instanceof Error ? err.message : String(err));
  }
}
