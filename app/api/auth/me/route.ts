import { NextRequest } from "next/server";
import { getCurrentWorkspace } from "@/lib/auth/workspace";
import { apiSuccess, apiError } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    const { user, workspace, membership } = ctx;

    return apiSuccess({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        googleId: user.googleId,
        role: membership.role || user.role,
        lastLoginAt: user.lastLoginAt,
      },
      workspace: {
        id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
      },
    });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to retrieve session", 500, err instanceof Error ? err.message : String(err));
  }
}
