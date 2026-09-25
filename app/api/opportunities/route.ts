import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Opportunity } from "@/models/Opportunity";
import { ActivityLog } from "@/models/ActivityLog";
import { opportunityCreateSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/security";
import { getCurrentWorkspace } from "@/lib/auth/workspace";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage")?.trim();
    const search = searchParams.get("search")?.trim();

    const query: Record<string, unknown> = {
      workspaceId: ctx.workspaceId,
    };

    if (stage && stage !== "ALL") {
      query.stage = stage;
    }
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { companyName: regex }, { primaryContact: regex }];
    }

    const opportunities = await Opportunity.find(query).sort({ createdAt: -1 });

    // Aggregate summary metrics scoped to this workspace
    const totalPipelineValue = opportunities
      .filter((o) => o.stage !== "LOST")
      .reduce((sum, o) => sum + (o.value || 0), 0);
    const wonValue = opportunities
      .filter((o) => o.stage === "WON")
      .reduce((sum, o) => sum + (o.value || 0), 0);

    return apiSuccess({
      opportunities,
      metrics: {
        totalOpportunities: opportunities.length,
        totalPipelineValue,
        wonValue,
      },
    });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to retrieve opportunities", 500, err instanceof Error ? err.message : String(err));
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json().catch(() => null);
    const parsed = opportunityCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid opportunity payload", 400, parsed.error.flatten());
    }

    await connectToDatabase();

    const currentUser = ctx.user.name || "User";
    const opp = await Opportunity.create({
      ...parsed.data,
      workspaceId: ctx.workspaceId,
      createdBy: ctx.userId,
      owner: parsed.data.owner || currentUser,
    });

    await ActivityLog.create({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      actor: currentUser,
      eventType: "OPPORTUNITY_CREATED",
      entityType: "opportunity",
      entityId: opp._id.toString(),
      user: currentUser,
      source: "website",
      status: "SUCCESS",
      message: `Commercial deal created: ${opp.name} ($${(opp.value || 0).toLocaleString()})`,
    });

    return apiSuccess({ opportunity: opp }, 201);
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to create opportunity", 500, err instanceof Error ? err.message : String(err));
  }
}
