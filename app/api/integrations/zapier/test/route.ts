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

    // Send a complete canonical lead test event so Zapier captures all fields (developerEmail, score, etc.)
    const testLeadPayload = {
      event: "lead.qualified",
      eventId: `test_lead_${Date.now()}`,
      timestamp: new Date().toISOString(),
      developerEmail: env.SALES_NOTIFICATION_EMAIL || "team@leadflow.ai",
      notificationRecipient: env.SALES_NOTIFICATION_EMAIL || "team@leadflow.ai",
      firstName: "Alex",
      lastName: "Rivera",
      email: env.SALES_NOTIFICATION_EMAIL || "team@leadflow.ai",
      company: "Apex Global Solutions",
      jobTitle: "VP Operations",
      requirement: "Automated CRM lead qualification and instant dispatch",
      budget: 75000,
      budgetFormatted: "₹75,000",
      budgetRupees: "₹75,000",
      currency: "INR",
      currencySymbol: "₹",
      timeline: "30 days",
      industry: "Technology",
      source: "website",
      score: 92,
      priority: "HIGH",
      priorityLower: "high",
      priorityUpper: "HIGH",
      isHigh: true,
      isMedium: false,
      isLow: false,
      category: "Enterprise Sales Automation",
      summary: "High-value lead seeking automated CRM qualification and routing.",
      recommendedAction: "Schedule technical discovery call within 24 hours.",
      fromName: "LeadFlow AI",
      senderName: "LeadFlow AI",
      senderEmail: "notifications@leadflow.ai",
      alertSubject: "[HIGH PRIORITY LEAD] Alex Rivera — Apex Global Solutions",
      emailSubject: "Your LeadFlow AI inquiry has been received",
      emailBody: "🔥 HIGH-PRIORITY LEAD ALERT\n\nProspect: Alex Rivera\nCompany: Apex Global Solutions\nAI Score: 92/100\nBudget: ₹75,000\nRequirement: Automated CRM lead qualification and instant dispatch",
      lead: {
        id: `lead_test_${Date.now()}`,
        firstName: "Alex",
        lastName: "Rivera",
        email: env.SALES_NOTIFICATION_EMAIL || "team@leadflow.ai",
        company: "Apex Global Solutions",
        budget: 75000,
        budgetFormatted: "₹75,000",
        budgetRupees: "₹75,000",
        currency: "INR",
        currencySymbol: "₹",
      },
      qualification: {
        score: 92,
        priority: "HIGH",
      },
    };

    const res = await fetch(env.ZAPIER_LEAD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "LeadFlow-AI/2.0-Test",
      },
      body: JSON.stringify(testLeadPayload),
      signal: AbortSignal.timeout(6000),
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
