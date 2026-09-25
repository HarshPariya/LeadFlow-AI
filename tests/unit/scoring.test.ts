import { describe, it, expect } from "vitest";
import { calculateDeterministicScore, calculatePriority } from "@/lib/scoring";

describe("Deterministic Lead Scoring Engine", () => {
  it("should correctly map priority by deterministic rules", () => {
    expect(calculatePriority(100)).toBe("HIGH");
    expect(calculatePriority(92)).toBe("HIGH");
    expect(calculatePriority(80)).toBe("HIGH");

    expect(calculatePriority(79)).toBe("MEDIUM");
    expect(calculatePriority(65)).toBe("MEDIUM");
    expect(calculatePriority(50)).toBe("MEDIUM");

    expect(calculatePriority(49)).toBe("LOW");
    expect(calculatePriority(25)).toBe("LOW");
    expect(calculatePriority(0)).toBe("LOW");
  });

  it("should score high enterprise leads with high budget and urgent timeline", () => {
    const result = calculateDeterministicScore({
      budget: 120000,
      requirement: "Need urgent CRM integration and enterprise sales automation to scale pipeline.",
      timeline: "Immediate (<30 days)",
      company: "Apex Global",
      jobTitle: "VP of Operations",
      source: "website",
    });

    expect(result.totalScore).toBeGreaterThanOrEqual(80);
    expect(result.priority).toBe("HIGH");
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.breakdown.budgetScore).toBe(100);
  });

  it("should score moderate budget leads as MEDIUM priority", () => {
    const result = calculateDeterministicScore({
      budget: 25000,
      requirement: "Looking to screen incoming client case inquiries with standard automation.",
      timeline: "60 days",
      company: "Mendez Legal",
      jobTitle: "Partner",
      source: "website",
    });

    expect(result.totalScore).toBeGreaterThanOrEqual(50);
    expect(result.totalScore).toBeLessThan(80);
    expect(result.priority).toBe("MEDIUM");
  });

  it("should score zero budget and personal test inquiries as LOW priority", () => {
    const result = calculateDeterministicScore({
      budget: 0,
      requirement: "Testing student project coursework.",
      timeline: "None",
      company: "Personal",
      source: "website",
    });

    expect(result.totalScore).toBeLessThan(50);
    expect(result.priority).toBe("LOW");
  });
});
