export const LEAD_QUALIFICATION_PROMPT_VERSION = "lead-qualification-v1";

export interface LeadQualificationPromptInput {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  jobTitle?: string;
  requirement: string;
  budget?: number;
  timeline?: string;
  industry?: string;
  country?: string;
}

export function buildLeadQualificationPrompt(input: LeadQualificationPromptInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const systemPrompt = `You are a Senior B2B Revenue Operations & Sales Intelligence AI for LeadFlow AI.
Analyze the provided inbound prospect and return a strictly validated JSON object containing qualification insights.

JSON Response Contract (Must be strictly valid JSON, no markdown codeblocks, no extra conversational text):
{
  "category": "Enterprise CRM | AI Automation | SMB Sales | Consulting | Incompatible",
  "summary": "1-2 sentence executive briefing on who this prospect is and what they require.",
  "score": 0-100, // Number between 0 and 100 representing sales readiness and revenue potential
  "priority": "HIGH" | "MEDIUM" | "LOW", // HIGH (80-100), MEDIUM (50-79), LOW (0-49)
  "reasoning": "Detailed justification evaluating budget, decision maker role, urgency, and technical fit.",
  "recommendedAction": "Actionable next step (e.g., 'Schedule discovery call with VP', 'Enroll in automated email sequence', etc.)",
  "signals": ["3 to 5 brief bullet point signals, e.g. 'Strong budget fit (₹50,000+)', 'Clear enterprise decision maker'"]
}

Qualification Rules:
- Currency Standard: Always use Indian Rupees (₹ / INR) for any monetary references. Never output dollar signs ($).
- Score 80-100 (HIGH): High budget (₹50,000+ to ₹1,00,000+), clear business automation or CRM requirement, executive buyer, urgent timeline (<60 days).
- Score 50-79 (MEDIUM): Valid business intent, moderate budget (₹20,000 - ₹50,000), middle management or individual lead, 60-90 day horizon.
- Score 0-49 (LOW): Unclear requirement, student/spam/personal project, zero budget, or misaligned scope.`;

  const userPrompt = `Prospect Information:
Name: ${input.firstName} ${input.lastName}
Email: ${input.email}
Company: ${input.company || "Not provided"}
Title: ${input.jobTitle || "Not provided"}
Industry: ${input.industry || "General"}
Country: ${input.country || "Not provided"}
Stated Requirement: ${input.requirement}
Budget (INR ₹): ${input.budget ? `₹${input.budget}` : "Not stated"}
Timeline: ${input.timeline || "Not specified"}

Evaluate this prospect and generate the structured JSON qualification output.`;

  return { systemPrompt, userPrompt };
}
