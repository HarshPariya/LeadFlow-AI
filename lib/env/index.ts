import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Integration Mode: 'mock' allows full local execution & demonstration without external credentials
  INTEGRATION_MODE: z.enum(["mock", "live"]).default("mock"),

  // Database
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/leadflow-ai"),

  // Authentication & Security
  AUTH_SECRET: z.string().default("development_fallback_secret_leadflow_ai_2026"),
  INTEGRATION_ENCRYPTION_KEY: z.string().default("leadflow_encryption_key_change_in_production_32b"),

  // Google OAuth 2.0
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),

  // AI Lead Qualification (Groq)
  GROQ_API_KEY: z.string().optional().default(""),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),

  // Twenty CRM
  TWENTY_API_URL: z.string().default("https://api.twenty.com"),
  TWENTY_API_KEY: z.string().optional().default(""),
  TWENTY_WORKSPACE_ID: z.string().optional().default(""),
  TWENTY_WORKFLOW_WEBHOOK_URL: z.string().optional().default(""),

  // Zapier Webhooks
  ZAPIER_LEAD_WEBHOOK_URL: z.string().optional().default(""),
  ZAPIER_STATUS_WEBHOOK_SECRET: z.string().default("leadflow_zapier_secret_callback_token_2026"),

  // Webhook Security
  WEBHOOK_SECRET: z.string().default("leadflow_general_inbound_webhook_secret_2026"),

  // Sales Notification & Email
  SALES_NOTIFICATION_EMAIL: z.string().default("sales@leadflow.ai"),
  GMAIL_ENABLED: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),

  // SMTP Mail (Optional fallback)
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.string().optional().default(""),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default(""),

  // Optional Monitoring
  NEXT_PUBLIC_ANALYTICS_ENABLED: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env;

try {
  parsedEnv = envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    INTEGRATION_MODE: process.env.INTEGRATION_MODE,
    MONGODB_URI: process.env.MONGODB_URI,
    AUTH_SECRET: process.env.AUTH_SECRET,
    INTEGRATION_ENCRYPTION_KEY: process.env.INTEGRATION_ENCRYPTION_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL,
    TWENTY_API_URL: process.env.TWENTY_API_URL,
    TWENTY_API_KEY: process.env.TWENTY_API_KEY,
    TWENTY_WORKSPACE_ID: process.env.TWENTY_WORKSPACE_ID,
    TWENTY_WORKFLOW_WEBHOOK_URL: process.env.TWENTY_WORKFLOW_WEBHOOK_URL,
    ZAPIER_LEAD_WEBHOOK_URL: process.env.ZAPIER_LEAD_WEBHOOK_URL,
    ZAPIER_STATUS_WEBHOOK_SECRET: process.env.ZAPIER_STATUS_WEBHOOK_SECRET,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    SALES_NOTIFICATION_EMAIL: process.env.SALES_NOTIFICATION_EMAIL,
    GMAIL_ENABLED: process.env.GMAIL_ENABLED,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED,
  });
} catch (error) {
  console.warn("⚠️ Warning: Environment variable parsing encountered fallback defaults:", error);
  parsedEnv = envSchema.parse({});
}

export const env = parsedEnv;
