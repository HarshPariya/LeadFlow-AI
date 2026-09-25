import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { AutomationRun } from "@/models/AutomationRun";
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
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const status = searchParams.get("status")?.trim();

    // Strictly scoped to the authenticated workspace
    const query: Record<string, unknown> = {
      workspaceId: ctx.workspaceId,
    };
    if (status && status !== "ALL") query.status = status;

    const runs = await AutomationRun.find(query).sort({ createdAt: -1 }).limit(limit);

    // Aggregate overall execution stats scoped to workspace
    const [totalRuns, successRuns, failedRuns] = await Promise.all([
      AutomationRun.countDocuments({ workspaceId: ctx.workspaceId }),
      AutomationRun.countDocuments({ workspaceId: ctx.workspaceId, status: "SUCCESS" }),
      AutomationRun.countDocuments({ workspaceId: ctx.workspaceId, status: "FAILED" }),
    ]);

    const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;

    // Calculate real average duration
    const recentSample = await AutomationRun.find({
      workspaceId: ctx.workspaceId,
      durationMs: { $exists: true },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const avgDurationMs =
      recentSample.length > 0
        ? Math.round(
          recentSample.reduce((acc, r) => acc + (r.durationMs || 0), 0) /
          recentSample.length
        )
        : 0;

    return apiSuccess({
      runs,
      stats: {
        totalRuns,
        successRuns,
        failedRuns,
        successRate,
        avgDurationMs,
      },
    });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to retrieve automation runs", 500, err instanceof Error ? err.message : String(err));
  }
}
