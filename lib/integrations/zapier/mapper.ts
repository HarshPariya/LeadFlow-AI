import { ILead } from "@/models/Lead";
import {
  canonicalAutomationEventSchema,
  CanonicalAutomationEvent,
} from "@/lib/validation/schemas";
import { env } from "@/lib/env";

export interface MapLeadOptions {
  eventId?: string;
  timestamp?: string;
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
  const developerEmail = (env.SALES_NOTIFICATION_EMAIL && env.SALES_NOTIFICATION_EMAIL !== "sales@leadflow.ai")
    ? env.SALES_NOTIFICATION_EMAIL
    : "hpariya195@gmail.com";
  const subject = `[${priority} PRIORITY LEAD] ${lead.firstName} ${lead.lastName} — ${lead.company || "Independent"}`;

  const emailBody = `🔥 ${priority}-PRIORITY LEAD ALERT

Prospect: ${lead.firstName} ${lead.lastName}
Company: ${lead.company || "Independent"}
Email: ${lead.email}
AI Score: ${lead.aiScore || 0}/100
Budget: ${formattedBudget}
Requirement: ${lead.requirement}

⚡ RECOMMENDED ACTION: ${lead.aiRecommendedAction || "Follow up immediately."}

Timestamp: ${timestamp}`;

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
    fromName: "LeadFlow AI",
    senderName: "LeadFlow AI",
    senderEmail: "notifications@leadflow.ai",
    developerEmail,
    notificationRecipient: developerEmail,
    alertSubject: subject,
    emailSubject: subject,
    emailBody,
    alertEmailBody: emailBody,
  };

  return canonicalAutomationEventSchema.parse(rawPayload);
}
