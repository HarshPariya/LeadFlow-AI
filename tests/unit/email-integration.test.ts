import { describe, it, expect, vi } from "vitest";
import {
  isDummyOrDemoEmail,
  getFromAddress,
  sendEmailAndLog,
} from "@/lib/integrations/email";

describe("Email Integration & Bounce Prevention", () => {
  describe("isDummyOrDemoEmail", () => {
    it("identifies known documentation and test fixture dummy domains", () => {
      expect(isDummyOrDemoEmail("priya.patel@growthscale.io")).toBe(true);
      expect(isDummyOrDemoEmail("user@example.com")).toBe(true);
      expect(isDummyOrDemoEmail("test@test.com")).toBe(true);
      expect(isDummyOrDemoEmail("ops@apexlogistics.io")).toBe(true);
      expect(isDummyOrDemoEmail("evelyn.chen@synthetixhealth.com")).toBe(true);
      expect(isDummyOrDemoEmail("procurement@nordiccommerce.se")).toBe(true);
      expect(isDummyOrDemoEmail("team@leadflow.ai")).toBe(true);
    });

    it("allows real commercial and consumer email addresses", () => {
      expect(isDummyOrDemoEmail("founder@startup.co")).toBe(false);
      expect(isDummyOrDemoEmail("client@gmail.com")).toBe(false);
      expect(isDummyOrDemoEmail("sarah@enterprise-corp.com")).toBe(false);
    });

    it("handles edge cases gracefully", () => {
      expect(isDummyOrDemoEmail("")).toBe(false);
      expect(isDummyOrDemoEmail("invalid-email")).toBe(false);
    });
  });

  describe("getFromAddress", () => {
    it("returns formatted sender string with LeadFlow AI branding", () => {
      const from = getFromAddress();
      expect(from).toContain("LeadFlow AI");
      expect(from).toContain("<");
      expect(from).toContain(">");
    });
  });

  describe("sendEmailAndLog dummy domain protection", () => {
    it("safely intercepts dummy domains and simulates delivery to prevent mailer-daemon bounce", async () => {
      const result = await sendEmailAndLog(
        {
          to: "priya.patel@growthscale.io",
          subject: "Test Subject",
          body: "Test Body",
        },
        "test",
        "Test email"
      );

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });
  });
});
