import { CanonicalAutomationEvent } from "@/lib/validation/schemas";

export interface TwentyPersonInput {
  name: {
    firstName: string;
    lastName: string;
  };
  emails: {
    primaryEmail: string;
    additionalEmails?: string[];
  };
  phones?: {
    primaryPhoneNumber?: string;
    primaryPhoneCallingCode?: string;
    primaryPhoneCountryCode?: string;
  };
  jobTitle?: string;
  companyId?: string;
  city?: string;
  // Custom tracking fields where supported in Twenty workspace
  leadflowLeadId?: string;
  leadScore?: number;
  leadPriority?: "HIGH" | "MEDIUM" | "LOW";
  leadStatus?: string;
  leadSource?: string;
  aiCategory?: string;
  aiSummary?: string;
  recommendedAction?: string;
  automationStatus?: string;
}

export interface TwentyPersonResponse {
  id: string;
  name: {
    firstName: string;
    lastName: string;
  };
  emails: {
    primaryEmail: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TwentyCompanyInput {
  name: string;
  domainName?: string;
  address?: {
    addressCountry?: string;
  };
  employees?: number;
  leadflowCompanyId?: string;
  industry?: string;
  website?: string;
  leadSource?: string;
}

export interface TwentyCompanyResponse {
  id: string;
  name: string;
  domainName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TwentyOpportunityInput {
  name: string;
  amount: {
    amountMicros: number;
    currencyCode: string;
  };
  stage: string;
  closeDate?: string;
  pointOfContactId?: string;
  companyId?: string;
  leadflowLeadId?: string;
  leadScore?: number;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  source?: string;
}

export interface TwentyOpportunityResponse {
  id: string;
  name: string;
  stage: string;
  createdAt: string;
}

export interface TwentyTaskInput {
  title: string;
  body?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueAt?: string;
  targetableId?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  leadflowLeadId?: string;
}

export interface TwentyTaskResponse {
  id: string;
  title: string;
  status: string;
}

export interface TwentyWorkflowTriggerResult {
  success: boolean;
  isMock: boolean;
  statusText: string;
  eventId: string;
  statusCode?: number;
  error?: string;
  payload?: CanonicalAutomationEvent;
}

export interface TwentySyncResult {
  personId?: string;
  companyId?: string;
  opportunityId?: string;
  taskId?: string;
  action: "CREATED" | "UPDATED" | "SIMULATED";
  isMock: boolean;
}
