import { env } from "@/lib/env";
import { logger } from "@/lib/logging";
import { ActivityLog } from "@/models/ActivityLog";
import nodemailer from "nodemailer";
import mongoose from "mongoose";

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  leadId?: string;
  workspaceId?: mongoose.Types.ObjectId;
}

const isEmailConfigured = Boolean(
  env.GMAIL_ENABLED && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
);

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })
  : null;

async function sendEmailAndLog(payload: EmailPayload, source: string, actionDesc: string) {
  // If no configured email provider exists, truthfully report not configured
  if (!isEmailConfigured || !transporter) {
    logger.warn({
      event: "email.not_configured",
      leadId: payload.leadId,
      message: `Email integration not configured. Skipped sending ${actionDesc} to ${payload.to}`,
    });

    if (payload.leadId && payload.workspaceId) {
      await ActivityLog.create({
        workspaceId: payload.workspaceId,
        eventType: "EMAIL_SEND_FAILED",
        entityType: "lead",
        entityId: payload.leadId,
        source: source,
        status: "FAILED",
        message: `Email integration not configured — skipped ${actionDesc} to ${payload.to}`,
        metadata: { subject: payload.subject, error: "Email provider not configured" },
      });
    }

    return { success: false, configured: false, error: "Email integration not configured" };
  }

  // Provider is configured: record EMAIL_SEND_STARTED
  logger.info({
    event: "email.send_started",
    leadId: payload.leadId,
    message: `${actionDesc} queued to: ${payload.to}`,
  });

  if (payload.leadId && payload.workspaceId) {
    await ActivityLog.create({
      workspaceId: payload.workspaceId,
      eventType: "EMAIL_SEND_STARTED",
      entityType: "lead",
      entityId: payload.leadId,
      source: source,
      status: "RUNNING",
      message: `Sending ${actionDesc} to ${payload.to}`,
      metadata: { subject: payload.subject },
    });
  }

  try {
    const fromAddress = env.SMTP_FROM
      ? (env.SMTP_FROM.includes("<") ? env.SMTP_FROM : `"LeadFlow AI" <${env.SMTP_FROM}>`)
      : `"LeadFlow AI" <notifications@leadflow.ai>`;

    await transporter.sendMail({
      from: fromAddress,
      to: payload.to,
      subject: payload.subject,
      text: payload.body,
    });

    if (payload.leadId && payload.workspaceId) {
      await ActivityLog.create({
        workspaceId: payload.workspaceId,
        eventType: "EMAIL_SEND_SUCCESS",
        entityType: "lead",
        entityId: payload.leadId,
        source: source,
        status: "SUCCESS",
        message: `${actionDesc} successfully delivered to ${payload.to}`,
        metadata: { subject: payload.subject },
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
        metadata: { subject: payload.subject, error: errorMsg },
      });
    }

    return { success: false, configured: true, error: errorMsg };
  }
}

export async function sendLeadWelcomeEmail(payload: EmailPayload) {
  return sendEmailAndLog(payload, "website", "Welcome email");
}

export async function sendHighPriorityNotification(payload: EmailPayload) {
  return sendEmailAndLog(payload, "system", "High-priority internal notification");
}
