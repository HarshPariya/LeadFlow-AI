import { NextRequest } from "next/server";
import { runSeed } from "@/scripts/seed";
import { apiSuccess, apiError } from "@/lib/security";

export async function POST() {
  try {
    await runSeed();
    return apiSuccess({
      message: "Database successfully seeded with realistic enterprise CRM demo data",
      demoUser: {
        email: "admin@leadflow.ai",
        password: "LeadFlowDemo2026!",
      },
    });
  } catch (err) {
    return apiError(
      "SEED_FAILED",
      "Failed to seed database. Verify MONGODB_URI is accessible.",
      500,
      err instanceof Error ? err.message : String(err)
    );
  }
}
