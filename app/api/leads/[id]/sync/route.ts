import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Lead } from "@/models/Lead";
import { syncLeadToTwenty } from "@/lib/integrations/twenty/sync";
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

    const syncResult = await syncLeadToTwenty(lead);
    const updatedLead = await Lead.findById(id);

    return apiSuccess({
      lead: updatedLead,
      syncResult,
    });
  } catch (err) {
    return apiError(
      "TWENTY_SYNC_FAILED",
      err instanceof Error ? err.message : "Twenty CRM synchronization failed",
      500
    );
  }
}
