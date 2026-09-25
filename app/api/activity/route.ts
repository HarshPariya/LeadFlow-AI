import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { ActivityLog } from "@/models/ActivityLog";
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
    const eventType = searchParams.get("eventType")?.trim();
    const entityType = searchParams.get("entityType")?.trim();
    const entityId = searchParams.get("entityId")?.trim();
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    // Strictly scoped to the authenticated workspace
    const query: Record<string, unknown> = {
      workspaceId: ctx.workspaceId,
    };

    if (eventType && eventType !== "ALL") query.eventType = eventType;
    if (entityType && entityType !== "ALL") query.entityType = entityType;
    if (entityId) query.entityId = entityId;

    const activities = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);

    return apiSuccess({ activities });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to retrieve activity stream", 500, err instanceof Error ? err.message : String(err));
  }
}
