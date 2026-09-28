import { env } from "@/lib/env";
import { logger } from "@/lib/logging";
import { ActivityLog } from "@/models/ActivityLog";
import nodemailer from "nodemailer";
import mongoose from "mongoose";

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
  leadId?: string;
  workspaceId?: mongoose.Types.ObjectId;
}

// Known test/dummy domains used in seed fixtures and documentation
// Delivery to these domains is simulated to prevent mailer-daemon bounce errors
const DUMMY_DOMAINS = new Set([
  "growthscale.io",
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "invalid",
  "apexlogistics.io",
  "synthetixhealth.com",
  "nordiccommerce.se",
  "leadflow.ai",
]);

/**
 * Checks whether an email address belongs to a mock or documentation dummy domain.
 */
export function isDummyOrDemoEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return Boolean(domain && DUMMY_DOMAINS.has(domain));
}

/**
 * Formats the RFC 5322 From header cleanly.
 * e.g. "LeadFlow AI <notifications@leadflow.ai>"
 */
export function getFromAddress(): string {
  const raw = env.EMAIL_FROM || env.SMTP_FROM || "LeadFlow AI <notifications@leadflow.ai>";
  if (raw.includes("<") && raw.includes(">")) {
    return raw;
  }
  return `"LeadFlow AI" <${raw}>`;
}

/**
 * Checks if a live email transport provider is configured.
 */
export function isEmailConfigured(): boolean {
  const hasResend = Boolean(env.RESEND_API_KEY && !env.RESEND_API_KEY.includes("placeholder"));
  const hasSmtp = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
  return hasResend || hasSmtp;
}

/**
 * Gets or creates the nodemailer SMTP transporter when SMTP is configured.
 */
function getSmtpTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

/**
 * Core email sender supporting Resend API, custom SMTP, and dummy-domain bounce protection.
 */
export async function sendEmailAndLog(
  payload: EmailPayload,
  source: string,
  actionDesc: string
): Promise<{ success: boolean; configured: boolean; simulated?: boolean; error?: string }> {
  const fromAddress = getFromAddress();
  const isDummy = isDummyOrDemoEmail(payload.to);
  const isMock = env.INTEGRATION_MODE === "mock";
  const configured = isEmailConfigured();

  // 1. Safeguard against dummy / test domains to prevent Google Mailer-Daemon bounce emails
  if (isDummy || isMock || !configured) {
    const reason = isDummy
      ? `Demo recipient domain (${payload.to.split("@")[1]}) — simulated to prevent mailer-daemon bounce`
      : !configured
        ? "No live email provider (Resend or SMTP) configured — simulated execution"
        : "Mock integration mode active";

    logger.info({
      event: "email.send_simulated",
      leadId: payload.leadId,
      message: `${actionDesc} simulated for ${payload.to}`,
      metadata: {
        to: payload.to,
        from: fromAddress,
        subject: payload.subject,
        reason,
      },
    });

    if (payload.leadId && payload.workspaceId) {
      await ActivityLog.create({
        workspaceId: payload.workspaceId,
        eventType: "EMAIL_SEND_SUCCESS",
        entityType: "lead",
        entityId: payload.leadId,
        source: source,
        status: "SUCCESS",
        message: `${actionDesc} processed (Simulated delivery to ${payload.to})`,
        metadata: {
          from: fromAddress,
          subject: payload.subject,
          simulated: true,
          reason,
        },
      });
    }

    return {
      success: true,
      configured,
      simulated: true,
    };
  }

  // 2. Provider is configured: record EMAIL_SEND_STARTED
  logger.info({
    event: "email.send_started",
    leadId: payload.leadId,
    message: `${actionDesc} dispatching to: ${payload.to} from: ${fromAddress}`,
  });

  if (payload.leadId && payload.workspaceId) {
    await ActivityLog.create({
      workspaceId: payload.workspaceId,
      eventType: "EMAIL_SEND_STARTED",
      entityType: "lead",
      entityId: payload.leadId,
      source: source,
      status: "RUNNING",
      message: `Sending ${actionDesc} to ${payload.to} via ${fromAddress}`,
      metadata: { from: fromAddress, subject: payload.subject },
    });
  }

  try {
    // 3A. Option 1: Modern Transactional Email via Resend API
    if (env.RESEND_API_KEY && !env.RESEND_API_KEY.includes("placeholder")) {
      const htmlBody = payload.html || payload.body.replace(/\n/g, "<br>");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: payload.to,
          subject: payload.subject,
          text: payload.body,
          html: htmlBody,
          reply_to: env.EMAIL_REPLY_TO || undefined,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          `Resend API error (${res.status}): ${errorData.message || JSON.stringify(errorData)}`
        );
      }
    } else {
      // 3B. Option 2: SMTP Transport (Nodemailer)
      const transporter = getSmtpTransporter();
      if (!transporter) {
        throw new Error("SMTP transporter could not be initialized");
      }

      await transporter.sendMail({
        from: fromAddress,
        to: payload.to,
        replyTo: env.EMAIL_REPLY_TO || undefined,
        subject: payload.subject,
        text: payload.body,
        html: payload.html || payload.body.replace(/\n/g, "<br>"),
      });
    }

    if (payload.leadId && payload.workspaceId) {
      await ActivityLog.create({
        workspaceId: payload.workspaceId,
        eventType: "EMAIL_SEND_SUCCESS",
        entityType: "lead",
        entityId: payload.leadId,
        source: source,
        status: "SUCCESS",
        message: `${actionDesc} successfully delivered to ${payload.to}`,
        metadata: { from: fromAddress, subject: payload.subject },
      });
    }

    return { success: true, configured: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error({
      event: "email.send_failed",
      leadId: payload.leadId,
      message: `Failed to send ${actionDesc} to ${payload.to}`,
      error: errorMsg,
    });

    if (payload.leadId && payload.workspaceId) {
      await ActivityLog.create({
        workspaceId: payload.workspaceId,
        eventType: "EMAIL_SEND_FAILED",
        entityType: "lead",
        entityId: payload.leadId,
        source: source,
        status: "FAILED",
        message: `Failed to send ${actionDesc} to ${payload.to}: ${errorMsg}`,
        metadata: { from: fromAddress, subject: payload.subject, error: errorMsg },
      });
    }

    return { success: false, configured: true, error: errorMsg };
  }
}

/**
 * Sends a welcome email to an incoming prospect.
 */
export async function sendLeadWelcomeEmail(payload: EmailPayload) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1C1B18;">
      <div style="border-bottom: 2px solid #D97706; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #1C1B18; font-size: 20px;">LeadFlow AI</h2>
      </div>
      <div style="font-size: 15px; line-height: 1.6; color: #374151;">
        ${payload.html || payload.body.replace(/\n/g, "<br>")}
      </div>
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 12px; color: #9CA3AF;">
        Sent securely by LeadFlow AI Sales Automation.
      </div>
    </div>
  `;

  return sendEmailAndLog({ ...payload, html }, "website", "Welcome email");
}

/**
 * Sends internal high-priority alert to sales engineering and developers.
 */
export async function sendHighPriorityNotification(payload: EmailPayload) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1C1B18;">
      <div style="background: #FEF3C7; border-left: 4px solid #D97706; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
        <strong style="color: #92400E; font-size: 14px;">🔥 HIGH PRIORITY DEAL ALERT</strong>
      </div>
      <div style="font-size: 14px; line-height: 1.6; color: #374151;">
        ${payload.html || payload.body.replace(/\n/g, "<br>")}
      </div>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF;">
        LeadFlow AI Automated Pipeline Notification.
      </div>
    </div>
  `;

  return sendEmailAndLog({ ...payload, html }, "system", "High-priority internal notification");
}
