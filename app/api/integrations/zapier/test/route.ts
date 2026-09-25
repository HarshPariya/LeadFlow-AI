import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/security";
import { env } from "@/lib/env";

export async function POST(_req: NextRequest) {
  try {
    const hasWebhook = Boolean(
      env.ZAPIER_LEAD_WEBHOOK_URL && !env.ZAPIER_LEAD_WEBHOOK_URL.includes("placeholder")
    );

    if (!hasWebhook || env.INTEGRATION_MODE === "mock") {
      return apiSuccess({
        success: true,
        isMock: true,
        message: "Zapier Catch Hook integration verified in simulated mode.",
      });
    }

    // Ping Zapier Catch Hook with a test ping
    const testPingPayload = {
      event: "ping.test",
      eventId: `test_ping_${Date.now()}`,
      timestamp: new Date().toISOString(),
      message: "LeadFlow AI Zapier connection verification ping",
    };

    const res = await fetch(env.ZAPIER_LEAD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "LeadFlow-AI/2.0-Test",
      },
      body: JSON.stringify(testPingPayload),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      return apiSuccess({
        success: true,
        message: "Successfully reached Zapier Catch Hook URL (HTTP " + res.status + ")",
      });
    } else {
      return apiSuccess({
        success: false,
        message: `Zapier webhook returned HTTP ${res.status}`,
      });
    }
  } catch (err) {
    return apiError(
      "ZAPIER_TEST_FAILED",
      err instanceof Error ? err.message : "Failed to contact Zapier Catch Hook",
      500
    );
  }
}
