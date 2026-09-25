import { env } from "@/lib/env";
import { logger } from "@/lib/logging";
import { ActivityLog } from "@/models/ActivityLog";
import { CanonicalAutomationEvent } from "@/lib/validation/schemas";
import { TwentyIntegrationError } from "./errors";
import {
  TwentyPersonInput,
  TwentyCompanyInput,
  TwentyOpportunityInput,
  TwentyTaskInput,
  TwentyWorkflowTriggerResult,
} from "./types";

/**
 * Dispatches the canonical lead automation event to the Twenty CRM Workflow Webhook.
 * Server-side execution only.
 */
export async function triggerTwentyWorkflow(
  payload: CanonicalAutomationEvent
): Promise<TwentyWorkflowTriggerResult> {
  const eventId = payload.eventId;
  const leadId = payload.lead.id;
  const isMock =
    env.INTEGRATION_MODE === "mock" ||
    !env.TWENTY_WORKFLOW_WEBHOOK_URL ||
    env.TWENTY_WORKFLOW_WEBHOOK_URL.includes("placeholder");

  if (isMock) {
    logger.info({
      event: "twenty.workflow_simulated",
      leadId,
      message: `Simulated Twenty CRM workflow webhook trigger (${payload.qualification.priority})`,
      metadata: { eventId, priority: payload.qualification.priority },
    });

    await ActivityLog.create({
      eventType: "TWENTY_SYNC_STARTED",
      entityType: "lead",
      entityId: leadId,
      source: "twenty",
      status: "SUCCESS",
      message: `Twenty CRM Workflow Webhook triggered (Simulated) [Priority: ${payload.qualification.priority}]`,
      metadata: { eventId, isMock: true },
    });

    return {
      success: true,
      isMock: true,
      statusText: "Simulated Twenty workflow trigger dispatched",
      eventId,
      payload,
    };
  }

  try {
    logger.info({
      event: "twenty.workflow_started",
      leadId,
      message: `Dispatching canonical event to Twenty CRM Workflow Webhook`,
      metadata: { eventId },
    });

    await ActivityLog.create({
      eventType: "TWENTY_SYNC_STARTED",
      entityType: "lead",
      entityId: leadId,
      source: "website",
      status: "RUNNING",
      message: `Dispatching canonical event to Twenty Workflow Webhook`,
      metadata: { eventId, isMock: false },
    });

    const res = await fetch(env.TWENTY_WORKFLOW_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "LeadFlow-AI/2.0",
        ...(env.WEBHOOK_SECRET ? { "x-webhook-secret": env.WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      throw new TwentyIntegrationError(
        `Twenty Workflow Webhook returned HTTP ${res.status}`,
        res.status
      );
    }

    return {
      success: true,
      isMock: false,
      statusText: "Successfully dispatched to Twenty Workflow Webhook",
      eventId,
      statusCode: res.status,
      payload,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error({
      event: "twenty.workflow_failed",
      leadId,
      error: errorMsg,
      message: "Failed to dispatch event to Twenty Workflow Webhook",
      metadata: { eventId },
    });

    await ActivityLog.create({
      eventType: "TWENTY_SYNC_FAILED",
      entityType: "lead",
      entityId: leadId,
      source: "twenty",
      status: "FAILED",
      message: `Twenty CRM Workflow trigger failed: ${errorMsg}`,
      metadata: { error: errorMsg, eventId },
    });

    return {
      success: false,
      isMock: false,
      statusText: "Failed to dispatch to Twenty Workflow",
      eventId,
      error: errorMsg,
      payload,
    };
  }
}

/**
 * Direct REST API client for Twenty CRM operations (health checks, test connections, fallback sync).
 */
export class TwentyClient {
  private baseUrl: string;
  private apiKey: string;
  private isMock: boolean;

  constructor() {
    this.baseUrl = env.TWENTY_API_URL.replace(/\/+$/, "");
    this.apiKey = env.TWENTY_API_KEY || "";
    // If explicitly in mock mode or API key is not configured, operate in mock mode
    this.isMock =
      env.INTEGRATION_MODE === "mock" ||
      !this.apiKey ||
      this.apiKey.includes("placeholder");
  }

  public isSimulated(): boolean {
    return this.isMock;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg =
          data?.message ||
          (Array.isArray(data?.messages) ? data.messages.join(", ") : undefined) ||
          `Twenty API error HTTP ${res.status}`;
        throw new TwentyIntegrationError(
          errorMsg,
          res.status,
          data
        );
      }

      return data as T;
    } catch (err) {
      if (err instanceof TwentyIntegrationError) throw err;
      throw new TwentyIntegrationError(
        err instanceof Error ? err.message : "Network error contacting Twenty CRM",
        500,
        err
      );
    }
  }

  // ==========================================
  // People Operations
  // ==========================================
  async findPersonByEmail(email: string): Promise<{ id: string; name: unknown } | null> {
    if (this.isMock) {
      return null;
    }

    try {
      const cleanEmail = email.toLowerCase().trim();
      const res = await this.request<{
        data: { people: Array<{ id: string; name: unknown; emails?: { primaryEmail?: string } }> };
      }>(`/rest/people`);

      const people = res?.data?.people;
      if (people && people.length > 0) {
        const found = people.find(
          (p) => p.emails?.primaryEmail?.toLowerCase().trim() === cleanEmail
        );
        if (found) return found;
      }
      return null;
    } catch (err) {
      logger.warn({
        event: "twenty.search_person_failed",
        error: err instanceof Error ? err.message : String(err),
        message: "Failed to search Twenty CRM for person by email",
      });
      return null;
    }
  }

  async createPerson(input: TwentyPersonInput): Promise<{ id: string }> {
    if (this.isMock) {
      const mockId = `twenty_person_sim_${Date.now().toString(36)}`;
      logger.info({
        event: "twenty.person_created_simulated",
        message: `Simulated Twenty person creation: ${mockId}`,
      });
      return { id: mockId };
    }

    const res = await this.request<{ data: { createPerson: { id: string } } }>(
      "/rest/people",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );

    return { id: res.data.createPerson.id };
  }

  async updatePerson(id: string, input: Partial<TwentyPersonInput>): Promise<{ id: string }> {
    if (this.isMock) {
      return { id };
    }

    const res = await this.request<{ data: { updatePerson: { id: string } } }>(
      `/rest/people/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      }
    );

    return { id: res.data.updatePerson.id };
  }

  // ==========================================
  // Company Operations
  // ==========================================
  async findCompanyByName(name: string): Promise<{ id: string } | null> {
    if (this.isMock) return null;

    try {
      const cleanName = name.trim().toLowerCase();
      const res = await this.request<{
        data: { companies: Array<{ id: string; name: string }> };
      }>(`/rest/companies`);

      const companies = res?.data?.companies;
      if (companies && companies.length > 0) {
        const found = companies.find(
          (c) => c.name?.trim().toLowerCase() === cleanName
        );
        if (found) return found;
      }
      return null;
    } catch {
      return null;
    }
  }

  async createCompany(input: TwentyCompanyInput): Promise<{ id: string }> {
    if (this.isMock) {
      const mockId = `twenty_comp_sim_${Date.now().toString(36)}`;
      return { id: mockId };
    }

    const res = await this.request<{ data: { createCompany: { id: string } } }>(
      "/rest/companies",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );

    return { id: res.data.createCompany.id };
  }

  // ==========================================
  // Opportunity Operations
  // ==========================================
  async createOpportunity(input: TwentyOpportunityInput): Promise<{ id: string }> {
    if (this.isMock) {
      const mockId = `twenty_opp_sim_${Date.now().toString(36)}`;
      return { id: mockId };
    }

    const res = await this.request<{
      data: { createOpportunity: { id: string } };
    }>("/rest/opportunities", {
      method: "POST",
      body: JSON.stringify(input),
    });

    return { id: res.data.createOpportunity.id };
  }

  // ==========================================
  // Task Operations
  // ==========================================
  async createTask(input: TwentyTaskInput): Promise<{ id: string }> {
    if (this.isMock) {
      const mockId = `twenty_task_sim_${Date.now().toString(36)}`;
      return { id: mockId };
    }

    const res = await this.request<{ data: { createTask: { id: string } } }>(
      "/rest/tasks",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );

    return { id: res.data.createTask.id };
  }

  // ==========================================
  // Connection Test
  // ==========================================
  async testConnection(): Promise<{ success: boolean; isMock: boolean; message: string }> {
    if (this.isMock) {
      return {
        success: true,
        isMock: true,
        message: "Twenty CRM connection simulated successfully in mock demo mode",
      };
    }

    try {
      // Test ping /rest/people with limit=1
      await this.request("/rest/people?limit=1");
      return {
        success: true,
        isMock: false,
        message: "Successfully verified live connection to Twenty CRM REST API",
      };
    } catch (err) {
      return {
        success: false,
        isMock: false,
        message: err instanceof Error ? err.message : "Failed to connect to Twenty CRM API",
      };
    }
  }
}

export const twentyClient = new TwentyClient();
