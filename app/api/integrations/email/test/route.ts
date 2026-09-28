import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/security";
import { getCurrentWorkspace } from "@/lib/auth/workspace";
import { sendEmailAndLog, getFromAddress, isEmailConfigured } from "@/lib/integrations/email";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getCurrentWorkspace(req);
    const body = await req.json().catch(() => ({}));
    const recipient =
      body.to?.trim() ||
      ctx?.user?.email ||
      (env.SALES_NOTIFICATION_EMAIL !== "sales@leadflow.ai" ? env.SALES_NOTIFICATION_EMAIL : "") ||
      "admin@leadflow.ai";

    const fromAddress = getFromAddress();
    const isConfigured = isEmailConfigured();

    const result = await sendEmailAndLog(
      {
        to: recipient,
        subject: "LeadFlow AI — Integration Test Email",
        body: `Hello! This is a test email sent from LeadFlow AI.\n\nFrom: ${fromAddress}\nProvider Status: ${isConfigured ? "Live Provider Active" : "Simulated Mode"
          }\nTimestamp: ${new Date().toISOString()}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1C1B18; border: 1px solid #ECE7DE; border-radius: 8px;">
            <div style="border-bottom: 2px solid #D97706; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="margin: 0; color: #1C1B18; font-size: 18px;">LeadFlow AI — Email Delivery Verified</h2>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #4B5563;">
              This test confirms that your LeadFlow AI email service is configured correctly.
            </p>
            <div style="background: #F9FAFB; padding: 12px 16px; border-radius: 6px; font-size: 13px; margin: 16px 0; border: 1px solid #E5E7EB;">
              <div><strong>Sender:</strong> ${fromAddress}</div>
              <div><strong>Recipient:</strong> ${recipient}</div>
              <div><strong>Status:</strong> ${isConfigured ? "Live Delivery" : "Simulated Delivery"}</div>
              <div><strong>Timestamp:</strong> ${new Date().toLocaleString()}</div>
            </div>
            <p style="font-size: 12px; color: #9CA3AF; margin-top: 24px;">
              LeadFlow AI Enterprise Pipeline Engine
            </p>
          </div>
        `,
        workspaceId: ctx?.workspaceId,
      },
      "system",
      "Email Integration Verification"
    );

    return apiSuccess({
      success: result.success,
      from: fromAddress,
      to: recipient,
      configured: result.configured,
      simulated: result.simulated ?? false,
      message: result.simulated
        ? `Test email simulated for ${recipient}. To send live emails, configure RESEND_API_KEY or SMTP credentials.`
        : `Test email successfully dispatched to ${recipient} from ${fromAddress}`,
    });
  } catch (err) {
    return apiError(
      "EMAIL_TEST_FAILED",
      err instanceof Error ? err.message : "Failed to dispatch test email",
      500
    );
  }
}
