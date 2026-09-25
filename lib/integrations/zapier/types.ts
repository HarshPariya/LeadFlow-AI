import { CanonicalAutomationEvent } from "@/lib/validation/schemas";

export type ZapierEventName = "lead.qualified" | "lead.created" | "lead.updated";

export type ZapierLeadPayload = CanonicalAutomationEvent;

export interface ZapierTriggerResult {
  success: boolean;
  isMock: boolean;
  statusText: string;
  eventId: string;
  statusCode?: number;
  error?: string;
  payload?: ZapierLeadPayload;
}

export interface ZapierRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  timeoutMs?: number;
}
