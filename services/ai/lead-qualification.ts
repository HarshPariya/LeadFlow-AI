import Groq from "groq-sdk";
import { env } from "@/lib/env";
import { logger } from "@/lib/logging";
import {
  aiQualificationSchema,
  type AIQualificationResult,
} from "@/lib/validation/schemas";
import {
  buildLeadQualificationPrompt,
  type LeadQualificationPromptInput,
} from "@/prompts/lead-qualification";
import { calculateDeterministicScore, calculatePriority } from "@/lib/scoring";

export interface AIQualificationServiceResult {
  data: AIQualificationResult;
  model: string;
  source: "groq" | "deterministic_fallback" | "mock_simulation";
  durationMs: number;
}

// Singleton Groq client (server-side only)
let groqClientInstance: Groq | null = null;

function getGroqClient(): Groq | null {
  if (groqClientInstance) return groqClientInstance;
  if (!env.GROQ_API_KEY || env.GROQ_API_KEY.includes("placeholder")) {
    return null;
  }
  try {
    groqClientInstance = new Groq({ apiKey: env.GROQ_API_KEY });
    return groqClientInstance;
  } catch (err) {
    logger.error({
      event: "ai.client_init_failed",
      error: err instanceof Error ? err.message : String(err),
      message: "Failed to initialize Groq client instance",
    });
    return null;
  }
}

/**
 * Extracts and cleans JSON string from an LLM response even if surrounded by markdown fences.
 */
function extractJSONString(raw: string): string {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1].trim();
  }
  return trimmed;
}

/**
 * Executes AI lead qualification with Groq API, with schema validation, retry logic, and deterministic fallback.
 */
export async function qualifyLeadWithAI(
  input: LeadQualificationPromptInput,
  options?: { forceDeterministic?: boolean }
): Promise<AIQualificationServiceResult> {
  const startTime = Date.now();
  const { systemPrompt, userPrompt } = buildLeadQualificationPrompt(input);
  const client = getGroqClient();

  // If in mock mode or forceDeterministic or no Groq key configured, use deterministic scoring
  if (options?.forceDeterministic || env.INTEGRATION_MODE === "mock" || !client) {
    const fallbackScore = calculateDeterministicScore({
      budget: input.budget,
      requirement: input.requirement,
      timeline: input.timeline,
      company: input.company,
      jobTitle: input.jobTitle,
    });

    const isMock = env.INTEGRATION_MODE === "mock";
    const recommendedAction =
      fallbackScore.priority === "HIGH"
        ? "Schedule an executive discovery call with VP of Sales immediately."
        : fallbackScore.priority === "MEDIUM"
          ? "Enroll in personalized automated product demo sequence."
          : "Add to quarterly marketing nurture campaign.";

    const category =
      fallbackScore.priority === "HIGH"
        ? "Enterprise Sales & CRM Automation"
        : fallbackScore.priority === "MEDIUM"
          ? "Commercial Workflow Optimization"
          : "General Inbound Inquiry";

    const summary = `${input.firstName} ${input.lastName} from ${input.company || "an independent organization"
      } is seeking solutions for: "${input.requirement.slice(0, 120)}..."`;

    const result: AIQualificationResult = {
      category,
      summary,
      score: Math.min(100, Math.max(0, fallbackScore.totalScore)),
      priority: fallbackScore.priority,
      reasoning: `Evaluated across commercial parameters: Budget Strength (${fallbackScore.breakdown.budgetScore}/100), Requirement Clarity (${fallbackScore.breakdown.clarityScore}/100), Urgency (${fallbackScore.breakdown.urgencyScore}/100).`,
      recommendedAction,
      signals: fallbackScore.signals,
    };

    return {
      data: result,
      model: isMock ? "mock-rule-engine-v1" : "deterministic-scoring-v1",
      source: isMock ? "mock_simulation" : "deterministic_fallback",
      durationMs: Date.now() - startTime,
    };
  }

  // Attempt live call to Groq with 1 retry for transient network / rate limit issues
  let lastError: unknown = null;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.info({
        event: "ai.qualification_started",
        message: `Calling Groq API (model: ${env.GROQ_MODEL}, attempt: ${attempt})`,
      });

      const response = await client.chat.completions.create({
        model: env.GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2, // low temperature for consistent evaluation
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) {
        throw new Error("Empty response received from Groq API");
      }

      const jsonString = extractJSONString(rawContent);
      const parsedJSON = JSON.parse(jsonString);

      const score = Math.min(100, Math.max(0, Number(parsedJSON.score) || 0));
      const priority = calculatePriority(score);

      // Validate against strict Zod schema with deterministic priority
      const validated = aiQualificationSchema.parse({
        ...parsedJSON,
        score,
        priority,
      });

      logger.info({
        event: "ai.qualification_completed",
        message: `Groq qualification completed successfully (Score: ${validated.score}, Priority: ${validated.priority})`,
        durationMs: Date.now() - startTime,
      });

      return {
        data: validated,
        model: env.GROQ_MODEL,
        source: "groq",
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      lastError = err;
      logger.warn({
        event: "ai.qualification_attempt_failed",
        error: err instanceof Error ? err.message : String(err),
        message: `Groq qualification attempt ${attempt} failed`,
      });

      if (attempt < maxAttempts) {
        // Capped backoff
        await new Promise((res) => setTimeout(res, 800));
      }
    }
  }

  // If Groq completely fails, gracefully fallback to deterministic scoring so business flow never halts
  logger.error({
    event: "ai.qualification_fallback_triggered",
    error: lastError instanceof Error ? lastError.message : String(lastError),
    message: "Falling back to deterministic rule scoring due to Groq service unavailability",
  });

  const fallback = calculateDeterministicScore({
    budget: input.budget,
    requirement: input.requirement,
    timeline: input.timeline,
    company: input.company,
    jobTitle: input.jobTitle,
  });

  return {
    data: {
      category: "Automated Inbound Lead",
      summary: `Lead from ${input.firstName} ${input.lastName} regarding ${input.requirement.slice(0, 100)}`,
      score: fallback.totalScore,
      priority: fallback.priority,
      reasoning: `Deterministic fallback analysis applied due to external AI provider timeout. Signals: ${fallback.signals.join(", ")}`,
      recommendedAction: fallback.priority === "HIGH" ? "Immediate sales outreach" : "Standard nurture sequence",
      signals: fallback.signals,
    },
    model: `${env.GROQ_MODEL}-fallback-engine`,
    source: "deterministic_fallback",
    durationMs: Date.now() - startTime,
  };
}
