import { describe, it, expect } from "vitest";
import {
  leadCreateSchema,
  aiQualificationSchema,
  zapierStatusWebhookSchema,
} from "@/lib/validation/schemas";

describe("Validation Schemas", () => {
  it("should validate a valid lead payload", () => {
    const validLead = {
      firstName: "Marcus",
      lastName: "Sterling",
      email: "marcus@apexlogistics.io",
      requirement: "Need CRM integration for enterprise shipments.",
      budget: 120000,
    };

    const parsed = leadCreateSchema.safeParse(validLead);
    expect(parsed.success).toBe(true);
  });

  it("should reject invalid lead missing required requirement", () => {
    const invalidLead = {
      firstName: "Marcus",
      lastName: "Sterling",
      email: "marcus@apexlogistics.io",
      requirement: "abc", // less than min 5 chars
    };

    const parsed = leadCreateSchema.safeParse(invalidLead);
    expect(parsed.success).toBe(false);
  });

  it("should validate AI qualification structured output", () => {
    const validAIOutput = {
      category: "Enterprise CRM",
      summary: "High value enterprise inquiry.",
      score: 92,
      priority: "HIGH",
      reasoning: "Strong budget and clear need.",
      recommendedAction: "Schedule discovery call.",
      signals: ["High budget ($100k+)"],
    };

    const parsed = aiQualificationSchema.safeParse(validAIOutput);
    expect(parsed.success).toBe(true);
  });

  it("should validate Zapier status webhook payload", () => {
    const validWebhook = {
      eventId: "zap_evt_12345",
      status: "SUCCESS",
      leadId: "65f01234567890abcdef1234",
      message: "Lead processed by Zapier",
    };

    const parsed = zapierStatusWebhookSchema.safeParse(validWebhook);
    expect(parsed.success).toBe(true);
  });
});
