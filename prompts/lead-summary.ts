export const LEAD_SUMMARY_PROMPT_VERSION = "lead-summary-v1";

export function buildLeadSummaryPrompt(data: {
  leadName: string;
  company: string;
  requirement: string;
  budget?: number;
}): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an AI sales assistant. Summarize incoming lead notes into a crisp 2-sentence CRM note for the sales team. Always use Indian Rupees (₹ / INR) for monetary amounts. Return only plain text.`;
  const userPrompt = `Lead: ${data.leadName} (${data.company})
Requirement: ${data.requirement}
Budget (INR ₹): ${data.budget ? `₹${data.budget}` : "Not stated"}`;

  return { systemPrompt, userPrompt };
}
