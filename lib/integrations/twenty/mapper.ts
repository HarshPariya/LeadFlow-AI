import { ILead } from "@/models/Lead";
import { ICompany } from "@/models/Company";
import { IOpportunity } from "@/models/Opportunity";
import { ITask } from "@/models/Task";
import {
  TwentyPersonInput,
  TwentyCompanyInput,
  TwentyOpportunityInput,
  TwentyTaskInput,
} from "./types";

const TWENTY_VALID_STAGES: Record<string, string> = {
  NEW: "NEW",
  QUALIFIED: "NEW",
  DISCOVERY: "SCREENING",
  SCREENING: "SCREENING",
  MEETING: "MEETING",
  PROPOSAL: "PROPOSAL",
  NEGOTIATION: "PROPOSAL",
  WON: "CUSTOMER",
  CUSTOMER: "CUSTOMER",
  LOST: "NEW",
};

export function getOpportunityStageForPriority(priority: "HIGH" | "MEDIUM" | "LOW"): string {
  switch (priority) {
    case "HIGH":
      return "SCREENING";
    case "MEDIUM":
      return "NEW";
    case "LOW":
      return "NEW";
  }
}

export function getTaskDueDateForPriority(priority: "HIGH" | "MEDIUM" | "LOW"): Date {
  const now = Date.now();
  switch (priority) {
    case "HIGH":
      return new Date(now + 24 * 60 * 60 * 1000); // 24 hours
    case "MEDIUM":
      return new Date(now + 48 * 60 * 60 * 1000); // 48 hours
    case "LOW":
      return new Date(now + 5 * 24 * 60 * 60 * 1000); // 5 days
  }
}

export function mapLeadToTwentyPerson(
  lead: ILead,
  twentyCompanyId?: string
): TwentyPersonInput {
  const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9+]/g, "") : undefined;
  return {
    name: {
      firstName: lead.firstName || "Inbound",
      lastName: lead.lastName || "Lead",
    },
    emails: {
      primaryEmail: lead.email.toLowerCase().trim(),
    },
    phones: cleanPhone
      ? {
        primaryPhoneNumber: cleanPhone,
        primaryPhoneCallingCode: "",
        primaryPhoneCountryCode: "",
      }
      : undefined,
    jobTitle: lead.jobTitle || undefined,
    companyId: twentyCompanyId || lead.twentyCompanyId || undefined,
  };
}

export function mapCompanyToTwentyCompany(company: Partial<ICompany>): TwentyCompanyInput {
  return {
    name: company.name || "Default Company",
    address: company.country ? { addressCountry: company.country } : undefined,
  };
}

export function mapOpportunityToTwentyOpportunity(
  opp: Partial<IOpportunity>,
  twentyCompanyId?: string,
  twentyPersonId?: string,
  priority: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM"
): TwentyOpportunityInput {
  // Convert dollars to micros (Twenty CRM stores amounts in micros: 1 USD = 1,000,000 micros)
  const amountMicros = Math.round((opp.value || 25000) * 1_000_000);
  const rawStage = opp.stage || getOpportunityStageForPriority(priority);
  const stage = TWENTY_VALID_STAGES[rawStage.toUpperCase()] || "SCREENING";

  return {
    name: opp.name || "Commercial Opportunity",
    amount: {
      amountMicros,
      currencyCode: "USD",
    },
    stage,
    closeDate: opp.expectedCloseDate
      ? new Date(opp.expectedCloseDate).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    companyId: twentyCompanyId || undefined,
    pointOfContactId: twentyPersonId || undefined,
  };
}

export function mapTaskToTwentyTask(
  task: Partial<ITask>,
  _twentyTargetableId?: string,
  priority: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM"
): TwentyTaskInput {
  const dueAt = task.dueDate
    ? new Date(task.dueDate).toISOString()
    : getTaskDueDateForPriority(priority).toISOString();

  return {
    title: task.title || "Follow-up Task",
    status: "TODO",
    dueAt,
  };
}

function cleanDomain(url: string): string {
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}

function parseCompanySize(sizeStr: string): number {
  if (sizeStr.includes("500+")) return 500;
  if (sizeStr.includes("201-500") || sizeStr.includes("200")) return 200;
  if (sizeStr.includes("51-200") || sizeStr.includes("50")) return 50;
  if (sizeStr.includes("11-50") || sizeStr.includes("10")) return 10;
  const num = parseInt(sizeStr, 10);
  return isNaN(num) ? 10 : num;
}
