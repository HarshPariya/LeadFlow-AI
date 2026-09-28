import { ILead } from "@/models/Lead";
import {
  canonicalAutomationEventSchema,
  CanonicalAutomationEvent,
} from "@/lib/validation/schemas";
import { env } from "@/lib/env";

export interface MapLeadOptions {
  eventId?: string;
  timestamp?: string;
  developerEmail?: string;
}

/**
 * Maps an internal LeadFlow Lead into the canonical automation payload.
 * Provides both structured nested objects (lead, qualification) and
 * flattened top-level attributes for easy Zapier Catch Hook mapping.
 */
export function mapLeadToCanonicalEvent(
  lead: ILead,
  options?: MapLeadOptions
): CanonicalAutomationEvent {
  const eventId = options?.eventId || `evt_${lead._id.toString()}_${Date.now()}`;
  const timestamp = options?.timestamp || new Date().toISOString();
  const callbackUrl = `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/zapier/status`;

  const formattedBudget = `₹${(Number(lead.budget) || 0).toLocaleString("en-IN")}`;
  const priority = lead.priority || "MEDIUM";
  const priorityLower = priority.toLowerCase();
  const developerEmail = options?.developerEmail || env.SALES_NOTIFICATION_EMAIL || "leadflow.ai.notifier@gmail.com";
  const parsedSenderEmail = env.EMAIL_FROM.includes("<")
    ? env.EMAIL_FROM.match(/<([^>]+)>/)?.[1] || "notifications@leadflow.ai"
    : env.EMAIL_FROM || "notifications@leadflow.ai";
  const subject = `[${priority} PRIORITY LEAD] ${lead.firstName} ${lead.lastName} — ${lead.company || "Independent"}`;
  const customerSubject = `Thanks for contacting LeadFlow AI — Next Steps for ${lead.company || lead.firstName}`;

  const emailBody = `🔥 ${priority}-PRIORITY LEAD ALERT

Prospect: ${lead.firstName} ${lead.lastName}
Company: ${lead.company || "Independent"}
Email: ${lead.email}
AI Score: ${lead.aiScore || 0}/100
Budget: ${formattedBudget}
Requirement: ${lead.requirement}

⚡ RECOMMENDED ACTION: ${lead.aiRecommendedAction || "Follow up immediately."}

Timestamp: ${timestamp}`;

  const customerEmailBody = `Hi ${lead.firstName},

Thank you for contacting LeadFlow AI! We have reviewed your inquiry for ${lead.company || "your team"} and would love to learn more about your goals.

Inquiry Requirement:
${lead.requirement}

Our technical automation team is reviewing your project requirements and will connect with you shortly.

Best regards,
The LeadFlow AI Team`;

  const badgeColor = priority === "HIGH" ? "#DC2626" : priority === "MEDIUM" ? "#D97706" : "#4B5563";
  const badgeBg = priority === "HIGH" ? "#FEF2F2" : priority === "MEDIUM" ? "#FFFBEB" : "#F3F4F6";

  const alertEmailHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ECE7DE; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
  <div style="background: #1C1B18; padding: 20px 24px; border-bottom: 3px solid #8D5B28;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <span style="font-size: 19px; font-weight: 800; color: #FAF8F5; letter-spacing: -0.5px;">⚡ LeadFlow AI Alerts</span>
        </td>
        <td align="right">
          <span style="background: ${badgeBg}; color: ${badgeColor}; padding: 5px 12px; border-radius: 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; border: 1px solid ${badgeColor};">
            ${priority} PRIORITY
          </span>
        </td>
      </tr>
    </table>
  </div>
  <div style="padding: 24px 24px 16px 24px;">
    <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #1C1B18; font-weight: 700;">
      New Qualified Prospect Alert
    </h2>
    <table width="100%" cellpadding="9" cellspacing="0" style="border-collapse: collapse; font-size: 13px; color: #374151;">
      <tr style="background: #F9F8F6; border-bottom: 1px solid #ECE7DE;">
        <td style="font-weight: 600; width: 35%;">Prospect Name</td>
        <td><strong>${lead.firstName} ${lead.lastName}</strong></td>
      </tr>
      <tr style="border-bottom: 1px solid #ECE7DE;">
        <td style="font-weight: 600;">Company</td>
        <td>${lead.company || "Independent"}</td>
      </tr>
      <tr style="background: #F9F8F6; border-bottom: 1px solid #ECE7DE;">
        <td style="font-weight: 600;">Email Address</td>
        <td><a href="mailto:${lead.email}" style="color: #8D5B28; text-decoration: none; font-weight: 600;">${lead.email}</a></td>
      </tr>
      <tr style="border-bottom: 1px solid #ECE7DE;">
        <td style="font-weight: 600;">Budget</td>
        <td><strong style="color: #047857; font-size: 14px;">${formattedBudget}</strong></td>
      </tr>
      <tr style="background: #F9F8F6; border-bottom: 1px solid #ECE7DE;">
        <td style="font-weight: 600;">AI Qualification Score</td>
        <td><strong style="color: ${priority === 'HIGH' ? '#DC2626' : '#D97706'}; font-size: 14px;">${lead.aiScore || 0}/100</strong> (${priority})</td>
      </tr>
      <tr>
        <td style="font-weight: 600; vertical-align: top;">Requirement</td>
        <td>${lead.requirement}</td>
      </tr>
    </table>
    ${lead.aiRecommendedAction ? `<div style="margin-top: 18px; padding: 14px 16px; background: #FEF3C7; border-left: 4px solid #D97706; border-radius: 6px;">
      <div style="font-size: 11px; font-weight: 700; color: #92400E; text-transform: uppercase;">Recommended Next Step</div>
      <div style="font-size: 13px; color: #78350F; margin-top: 4px; font-weight: 500;">${lead.aiRecommendedAction}</div>
    </div>` : ""}
  </div>
  <div style="background: #FAF8F5; padding: 14px 24px; border-top: 1px solid #ECE7DE; font-size: 11px; color: #8C867B;">
    Sent automatically by LeadFlow AI Sales & CRM Automation Platform
  </div>
</div>`;

  const customerEmailHtml = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ECE7DE; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
  <div style="background: #1C1B18; padding: 22px 24px; border-bottom: 3px solid #8D5B28;">
    <span style="font-size: 20px; font-weight: 800; color: #FAF8F5; letter-spacing: -0.5px;">⚡ LeadFlow AI</span>
  </div>
  <div style="padding: 28px 24px; color: #1C1B18; font-size: 14px; line-height: 1.6;">
    <p style="margin-top: 0; font-size: 15px; font-weight: 600;">Hi ${lead.firstName},</p>
    <p>Thank you for contacting <strong>LeadFlow AI</strong>. We have received your inquiry for <strong>${lead.company || "your team"}</strong> and our automation specialists have already initiated review.</p>
    <div style="background: #F9F8F6; padding: 14px 16px; border-radius: 8px; border: 1px solid #ECE7DE; margin: 18px 0;">
      <div style="font-size: 11px; font-weight: 700; color: #5C5850; text-transform: uppercase;">Your Inquiry Requirement</div>
      <div style="font-size: 13px; color: #1C1B18; margin-top: 4px;">${lead.requirement}</div>
    </div>
    <p>A member of our solutions engineering team will reach out to you shortly to schedule an initial consultation and live demonstration.</p>
    <p style="margin-bottom: 0;">Best regards,<br><strong>The LeadFlow AI Team</strong><br><span style="font-size: 12px; color: #8C867B;">Intelligent Sales & CRM Automation</span></p>
  </div>
  <div style="background: #FAF8F5; padding: 14px 24px; border-top: 1px solid #ECE7DE; font-size: 11px; color: #8C867B;">
    LeadFlow AI · Next-Generation Sales Intelligence
  </div>
</div>`;

  const rawPayload = {
    event: "lead.qualified" as const,
    eventId,
    timestamp,
    lead: {
      id: lead._id.toString(),
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone || "",
      company: lead.company || "",
      jobTitle: lead.jobTitle || "",
      requirement: lead.requirement,
      budget: Number(lead.budget) || 0,
      budgetFormatted: formattedBudget,
      budgetRupees: formattedBudget,
      currency: "INR",
      currencySymbol: "₹",
      timeline: lead.timeline || "",
      industry: lead.industry || "",
      source: lead.source || "website",
    },
    qualification: {
      score: Number(lead.aiScore) || 0,
      priority: lead.priority,
      category: lead.aiCategory || "General Inbound",
      summary: lead.aiSummary || "",
      recommendedAction: lead.aiRecommendedAction || "Follow up with lead",
      signals: lead.aiSignals || [],
    },
    // Top-level convenience fields for Zapier Paths & Gmail step mapping
    leadId: lead._id.toString(),
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone || "",
    company: lead.company || "",
    jobTitle: lead.jobTitle || "",
    requirement: lead.requirement,
    budget: Number(lead.budget) || 0,
    budgetFormatted: formattedBudget,
    budgetRupees: formattedBudget,
    currency: "INR",
    currencySymbol: "₹",
    timeline: lead.timeline || "",
    source: lead.source || "website",
    score: Number(lead.aiScore) || 0,
    priority: lead.priority,
    priorityLower,
    priorityUpper: priority,
    isHigh: priority === "HIGH",
    isMedium: priority === "MEDIUM",
    isLow: priority === "LOW",
    category: lead.aiCategory || "General Inbound",
    summary: lead.aiSummary || "",
    recommendedAction: lead.aiRecommendedAction || "Follow up with lead",
    callbackUrl,
    fromName: "LeadFlow AI Alerts",
    senderName: "LeadFlow AI",
    senderEmail: parsedSenderEmail,
    developerEmail,
    notificationRecipient: developerEmail,
    alertSubject: subject,
    emailSubject: subject,
    customerSubject,
    emailBody,
    alertEmailBody: emailBody,
    customerEmailBody,
    emailHtml: alertEmailHtml,
    alertEmailHtml,
    customerEmailHtml,
  };

  return canonicalAutomationEventSchema.parse(rawPayload);
}
