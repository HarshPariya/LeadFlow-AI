import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/security";
import { env } from "@/lib/env";
import Groq from "groq-sdk";

export async function POST(_req: NextRequest) {
  try {
    const hasKey = Boolean(
      env.GROQ_API_KEY && !env.GROQ_API_KEY.includes("placeholder")
    );

    if (!hasKey || env.INTEGRATION_MODE === "mock") {
      return apiSuccess({
        success: true,
        isMock: true,
        message: "Groq AI qualification verified with deterministic scoring engine.",
      });
    }

    const client = new Groq({ apiKey: env.GROQ_API_KEY });
    const response = await client.chat.completions.create({
      model: env.GROQ_MODEL,
      messages: [
        { role: "user", content: "Reply with the single word: OK" },
      ],
      max_tokens: 10,
    });

    const reply = response.choices[0]?.message?.content?.trim();
    return apiSuccess({
      success: true,
      message: `Groq AI (${env.GROQ_MODEL}) connection verified successfully. Response: "${reply}"`,
    });
  } catch (err) {
    return apiError(
      "GROQ_TEST_FAILED",
      err instanceof Error ? err.message : "Failed to contact Groq API",
      500
    );
  }
}
