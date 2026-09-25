import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { apiSuccess } from "@/lib/security";
import { getCurrentWorkspace } from "@/lib/auth/workspace";
import { ActivityLog } from "@/models/ActivityLog";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (ctx) {
      await ActivityLog.create({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        actor: ctx.user.name,
        user: ctx.user.name,
        source: "auth",
        eventType: "LOGOUT",
        entityType: "security",
        entityId: ctx.user._id.toString(),
        status: "SUCCESS",
        message: `User ${ctx.user.email} signed out of session`,
      });
    }
  } catch {
    // Non-blocking logout audit failure
  }

  const res = apiSuccess({ message: "Successfully logged out" });
  res.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });
  return res;
}
