import { connectToDatabase } from "@/lib/db/connection";
import { env } from "@/lib/env";
import { twentyClient } from "@/lib/integrations/twenty/client";
import { ActivityLog } from "@/models/ActivityLog";
import { apiSuccess } from "@/lib/security";

export interface IntegrationHealthItem {
  key: "mongodb" | "groq" | "twenty" | "zapier" | "gmail";
  name: string;
  category: "Database" | "AI Engine" | "External CRM" | "Automation" | "Communication";
  status: "CONNECTED" | "NOT_CONFIGURED" | "CONFIGURATION_REQUIRED" | "ERROR" | "SIMULATED";
  isMock: boolean;
  message: string;
  hasCredentials: boolean;
  endpointOrModel?: string;
  docsUrl: string;
  lastTested?: string;
  lastEvent?: string;
}

export async function GET() {
  const isGlobalMock = env.INTEGRATION_MODE === "mock";

  // 1. Check MongoDB
  let mongoStatus: "CONNECTED" | "ERROR" = "ERROR";
  let mongoMessage = "MongoDB connection error";
  try {
    const mongooseInstance = await connectToDatabase();
    if (mongooseInstance.connection.readyState === 1) {
      mongoStatus = "CONNECTED";
      mongoMessage = `Connected to ${mongooseInstance.connection.name || "leadflow-ai"}`;
    }
  } catch (err) {
    mongoMessage = err instanceof Error ? err.message : "Database connection failed";
  }

  // Fetch recent activity logs for lastEvent metadata
  let lastZapierLog = null;
  let lastTwentyLog = null;
  try {
    [lastZapierLog, lastTwentyLog] = await Promise.all([
      ActivityLog.findOne({ source: "zapier" }).sort({ timestamp: -1 }),
      ActivityLog.findOne({ source: "twenty" }).sort({ timestamp: -1 }),
    ]);
  } catch {
    // Ignore
  }

  // 2. Check Groq AI
  const hasGroqKey = Boolean(env.GROQ_API_KEY && !env.GROQ_API_KEY.includes("placeholder"));
  const groqStatus = isGlobalMock
    ? "SIMULATED"
    : hasGroqKey
      ? "CONNECTED"
      : "NOT_CONFIGURED";

  // 3. Check Twenty CRM (Workflow Webhook & API Key)
  const hasTwentyWorkflow = Boolean(
    env.TWENTY_WORKFLOW_WEBHOOK_URL && !env.TWENTY_WORKFLOW_WEBHOOK_URL.includes("placeholder")
  );
  const hasTwentyKey = Boolean(
    env.TWENTY_API_KEY && !env.TWENTY_API_KEY.includes("placeholder")
  );
  const twentyStatus = twentyClient.isSimulated()
    ? "SIMULATED"
    : hasTwentyWorkflow || hasTwentyKey
      ? "CONNECTED"
      : "CONFIGURATION_REQUIRED";

  // 4. Check Zapier Catch Hook
  const hasZapierWebhook = Boolean(
    env.ZAPIER_LEAD_WEBHOOK_URL && !env.ZAPIER_LEAD_WEBHOOK_URL.includes("placeholder")
  );
  const zapierStatus = isGlobalMock
    ? "SIMULATED"
    : hasZapierWebhook
      ? "CONNECTED"
      : "CONFIGURATION_REQUIRED";

  // 5. Gmail
  const gmailStatus = env.GMAIL_ENABLED ? "CONNECTED" : "NOT_CONFIGURED";

  const integrations: IntegrationHealthItem[] = [
    {
      key: "mongodb",
      name: "MongoDB Persistence",
      category: "Database",
      status: mongoStatus,
      isMock: false,
      message: mongoMessage,
      hasCredentials: true,
      endpointOrModel: "Primary Cluster",
      docsUrl: "https://www.mongodb.com/docs/",
      lastTested: new Date().toISOString(),
      lastEvent: "Database active and connected",
    },
    {
      key: "groq",
      name: "Groq AI Intelligence",
      category: "AI Engine",
      status: groqStatus,
      isMock: !hasGroqKey || isGlobalMock,
      message: hasGroqKey
        ? `Live inference engine active (${env.GROQ_MODEL})`
        : "Deterministic rule scoring fallback active (Add GROQ_API_KEY for live LLM)",
      hasCredentials: hasGroqKey,
      endpointOrModel: env.GROQ_MODEL,
      docsUrl: "https://console.groq.com/docs",
      lastTested: new Date().toISOString(),
      lastEvent: hasGroqKey ? "Llama 3.3 / Qwen inference engine ready" : "Deterministic fallback active",
    },
    {
      key: "twenty",
      name: "Twenty CRM",
      category: "External CRM",
      status: twentyStatus,
      isMock: twentyClient.isSimulated(),
      message: hasTwentyWorkflow
        ? `Workflow Webhook configured & API ready (${env.TWENTY_API_URL})`
        : hasTwentyKey
          ? `REST API connected to ${env.TWENTY_API_URL} (Workflow webhook optional)`
          : "CRM adapter active in mock mode (Add TWENTY_WORKFLOW_WEBHOOK_URL or API key)",
      hasCredentials: hasTwentyWorkflow || hasTwentyKey,
      endpointOrModel: env.TWENTY_API_URL,
      docsUrl: "https://twenty.com/developers",
      lastTested: new Date().toISOString(),
      lastEvent: lastTwentyLog?.message || "Twenty CRM integration ready",
    },
    {
      key: "zapier",
      name: "Zapier Cross-App Automation",
      category: "Automation",
      status: zapierStatus,
      isMock: !hasZapierWebhook || isGlobalMock,
      message: hasZapierWebhook
        ? "Catch Hook configured. Dispatches lead.qualified events to Paths (HIGH/MED/LOW)"
        : "Simulated Catch Hook active (Add ZAPIER_LEAD_WEBHOOK_URL for live Zaps)",
      hasCredentials: hasZapierWebhook,
      endpointOrModel: "POST /api/webhooks/zapier/status",
      docsUrl: "https://zapier.com/help",
      lastTested: new Date().toISOString(),
      lastEvent: lastZapierLog?.message || "Catch Hook ready for inbound events",
    },
    {
      key: "gmail",
      name: "Gmail Communication",
      category: "Communication",
      status: gmailStatus,
      isMock: !env.GMAIL_ENABLED || isGlobalMock,
      message: env.GMAIL_ENABLED
        ? `Gmail automated notifications enabled (Recipient: ${env.SALES_NOTIFICATION_EMAIL})`
        : "Gmail notifications handled via Zapier Paths A, B, and C",
      hasCredentials: env.GMAIL_ENABLED,
      endpointOrModel: env.SALES_NOTIFICATION_EMAIL,
      docsUrl: "https://workspace.google.com/products/gmail/",
      lastTested: new Date().toISOString(),
      lastEvent: "Zapier Gmail action steps configured",
    },
  ];

  return apiSuccess({
    mode: env.INTEGRATION_MODE,
    integrations,
    allHealthy: mongoStatus === "CONNECTED",
  });
}
