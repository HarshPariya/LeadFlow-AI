import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/security";
import { env } from "@/lib/env";

export async function POST(_req: NextRequest) {
  if (env.GMAIL_ENABLED) {
    return apiSuccess({
      success: true,
      message: `Direct Gmail notifications active. Target address: ${env.SALES_NOTIFICATION_EMAIL}`,
    });
  }

  return apiSuccess({
    success: true,
    message: `Gmail automated actions configured via Zapier Paths A, B, and C. Notification target: ${env.SALES_NOTIFICATION_EMAIL}`,
  });
}
