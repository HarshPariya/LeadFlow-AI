export interface ScoringInput {
  budget?: number;
  requirement: string;
  timeline?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
}

export interface ScoringWeights {
  budgetWeight: number; // e.g. 30%
  clarityWeight: number; // e.g. 25%
  urgencyWeight: number; // e.g. 20%
  companyFitWeight: number; // e.g. 15%
  intentWeight: number; // e.g. 10%
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  budgetWeight: 30,
  clarityWeight: 25,
  urgencyWeight: 20,
  companyFitWeight: 15,
  intentWeight: 10,
};

export interface DeterministicScoreResult {
  totalScore: number; // 0 - 100
  priority: "HIGH" | "MEDIUM" | "LOW";
  breakdown: {
    budgetScore: number;
    clarityScore: number;
    urgencyScore: number;
    companyFitScore: number;
    intentScore: number;
  };
  signals: string[];
}

/**
 * Deterministic priority mapping after scoring.
 * HIGH:   80–100
 * MEDIUM: 50–79
 * LOW:    0–49
 */
export function calculatePriority(score: number): "HIGH" | "MEDIUM" | "LOW" {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  if (clamped >= 80) return "HIGH";
  if (clamped >= 50) return "MEDIUM";
  return "LOW";
}

/**
 * Calculates a reproducible, deterministic lead score based on configurable business weights.
 */
export function calculateDeterministicScore(
  input: ScoringInput,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): DeterministicScoreResult {
  const signals: string[] = [];

  // 1. Budget Score (0 - 100)
  let budgetRaw = 0;
  const budget = input.budget || 0;
  if (budget >= 100000) {
    budgetRaw = 100;
    signals.push("Enterprise budget (₹1,00,000+)");
  } else if (budget >= 50000) {
    budgetRaw = 85;
    signals.push("Strong commercial budget (₹50,000 - ₹1,00,000)");
  } else if (budget >= 20000) {
    budgetRaw = 70;
    signals.push("Mid-market budget (₹20,000 - ₹50,000)");
  } else if (budget >= 5000) {
    budgetRaw = 50;
    signals.push("Standard SMB budget (₹5,000 - ₹20,000)");
  } else if (budget > 0) {
    budgetRaw = 25;
    signals.push("Entry level budget (<₹5,000)");
  } else {
    budgetRaw = 10;
    signals.push("Budget unstated or zero");
  }

  // 2. Requirement Clarity Score (0 - 100)
  let clarityRaw = 0;
  const reqLen = input.requirement?.trim().length || 0;
  const reqText = (input.requirement || "").toLowerCase();

  if (reqLen > 200) {
    clarityRaw += 60;
  } else if (reqLen > 80) {
    clarityRaw += 40;
  } else {
    clarityRaw += 20;
  }

  // Key actionable terms
  const highIntentTerms = [
    "crm",
    "integration",
    "automate",
    "automation",
    "pipeline",
    "sales",
    "scale",
    "replace",
    "migration",
    "api",
    "deploy",
    "team",
  ];
  const matchedTerms = highIntentTerms.filter((term) => reqText.includes(term));
  if (matchedTerms.length >= 3) {
    clarityRaw += 40;
    signals.push(`Specific technical requirements noted (${matchedTerms.slice(0, 3).join(", ")})`);
  } else if (matchedTerms.length >= 1) {
    clarityRaw += 25;
    signals.push(`Clear business keywords present`);
  }
  clarityRaw = Math.min(100, clarityRaw);

  // 3. Urgency / Timeline Score (0 - 100)
  let urgencyRaw = 30; // default moderate
  const timeline = (input.timeline || "").toLowerCase();
  if (
    timeline.includes("immediate") ||
    timeline.includes("urgent") ||
    timeline.includes("asap") ||
    timeline.includes("15 days") ||
    timeline.includes("this month")
  ) {
    urgencyRaw = 100;
    signals.push("High urgency timeline (<30 days / ASAP)");
  } else if (
    timeline.includes("30") ||
    timeline.includes("month") ||
    timeline.includes("q1") ||
    timeline.includes("q2") ||
    timeline.includes("soon")
  ) {
    urgencyRaw = 75;
    signals.push("Standard project horizon (1-3 months)");
  } else if (timeline.includes("evaluating") || timeline.includes("future")) {
    urgencyRaw = 40;
    signals.push("Exploratory stage");
  }

  // 4. Company Fit (0 - 100)
  let companyFitRaw = 20;
  if (input.company && input.company.trim().length > 1) {
    companyFitRaw += 40;
    signals.push(`Identified company: ${input.company}`);
  }
  const title = (input.jobTitle || "").toLowerCase();
  if (
    title.includes("vp") ||
    title.includes("director") ||
    title.includes("chief") ||
    title.includes("head") ||
    title.includes("founder") ||
    title.includes("ceo") ||
    title.includes("coo") ||
    title.includes("cro")
  ) {
    companyFitRaw += 40;
    signals.push(`Executive decision maker (${input.jobTitle})`);
  } else if (title.includes("manager") || title.includes("lead")) {
    companyFitRaw += 25;
    signals.push(`Operational leadership role (${input.jobTitle})`);
  }
  companyFitRaw = Math.min(100, companyFitRaw);

  // 5. Business Intent Score (0 - 100)
  let intentRaw = 50;
  const source = (input.source || "").toLowerCase();
  if (source.includes("referral") || source.includes("inbound_demo")) {
    intentRaw = 95;
    signals.push("High-intent inbound referral/demo request");
  } else if (source.includes("website") || source.includes("pricing")) {
    intentRaw = 80;
    signals.push("Direct product inquiry");
  }

  // Weighted aggregation
  const totalWeight =
    weights.budgetWeight +
    weights.clarityWeight +
    weights.urgencyWeight +
    weights.companyFitWeight +
    weights.intentWeight;

  const totalWeighted =
    budgetRaw * weights.budgetWeight +
    clarityRaw * weights.clarityWeight +
    urgencyRaw * weights.urgencyWeight +
    companyFitRaw * weights.companyFitWeight +
    intentRaw * weights.intentWeight;

  const totalScore = Math.min(100, Math.max(0, Math.round(totalWeighted / totalWeight)));
  const priority = calculatePriority(totalScore);

  return {
    totalScore,
    priority,
    breakdown: {
      budgetScore: budgetRaw,
      clarityScore: clarityRaw,
      urgencyScore: urgencyRaw,
      companyFitScore: companyFitRaw,
      intentScore: intentRaw,
    },
    signals,
  };
}
