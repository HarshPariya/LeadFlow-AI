export const FOLLOW_UP_PROMPT_VERSION = "follow-up-v1";

export function buildFollowUpPrompt(data: {
  leadName: string;
  priority: string;
  requirement: string;
  company?: string;
}): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a personalized sales copywriter. Generate a concise, high-converting follow-up email draft tailored to the prospect's stated requirement and urgency level. Return JSON with 'subject' and 'body'.`;
  const userPrompt = `Prospect: ${data.leadName} at ${data.company || "their company"}
Priority: ${data.priority}
Need: ${data.requirement}`;

  return { systemPrompt, userPrompt };
}
