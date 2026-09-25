export interface StructuredLogPayload {
  event: string;
  level?: "info" | "warn" | "error" | "debug";
  userId?: string;
  leadId?: string;
  source?: string;
  status?: "success" | "failure" | "running" | "retrying";
  durationMs?: number;
  message?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// Redact known sensitive keys to prevent credential leaks in log streams
const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "apikey",
  "api_key",
  "auth_secret",
  "groq_api_key",
  "twenty_api_key",
  "webhook_secret",
]);

function sanitizeMetadata(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(sanitizeMetadata);

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      clean[key] = sanitizeMetadata(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const logger = {
  info(payload: StructuredLogPayload) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: "info",
      ...payload,
      metadata: payload.metadata ? sanitizeMetadata(payload.metadata) : undefined,
    };
    console.log(JSON.stringify(entry));
  },

  warn(payload: StructuredLogPayload) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: "warn",
      ...payload,
      metadata: payload.metadata ? sanitizeMetadata(payload.metadata) : undefined,
    };
    console.warn(JSON.stringify(entry));
  },

  error(payload: StructuredLogPayload) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: "error",
      ...payload,
      metadata: payload.metadata ? sanitizeMetadata(payload.metadata) : undefined,
    };
    console.error(JSON.stringify(entry));
  },

  debug(payload: StructuredLogPayload) {
    if (process.env.NODE_ENV !== "production") {
      const entry = {
        timestamp: new Date().toISOString(),
        level: "debug",
        ...payload,
        metadata: payload.metadata ? sanitizeMetadata(payload.metadata) : undefined,
      };
      console.debug(JSON.stringify(entry));
    }
  },
};
