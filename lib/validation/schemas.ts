import { z } from "zod";

// ==========================================
// Authentication Schemas
// ==========================================
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Valid email address required").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).default("MEMBER"),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email address required").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

// ==========================================
// Lead Schemas
// ==========================================
export const leadCreateSchema = z.object({
  firstName: z.string().min(1, "First Name is required").max(60).trim(),
  lastName: z.string().min(1, "Last Name is required").max(60).trim(),
  email: z.string().email("Valid email address required").toLowerCase().trim(),
  phone: z.string().max(30).optional().or(z.literal("")),
  company: z.string().max(100).optional().or(z.literal("")),
  jobTitle: z.string().max(80).optional().or(z.literal("")),
  source: z.string().max(50).default("website"),
  requirement: z.string().min(5, "Requirement must be at least 5 characters").max(2000).trim(),
  budget: z
    .number()
    .nonnegative("Budget must be non-negative")
    .optional()
    .or(
      z
        .string()
        .transform((v) => (v ? Number(v) : 0))
        .pipe(z.number().nonnegative())
    )
    .default(0),
  timeline: z.string().max(100).optional().or(z.literal("")),
  industry: z.string().max(80).optional().or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  notes: z.string().max(3000).optional().or(z.literal("")),
});

export const leadUpdateSchema = leadCreateSchema.partial().extend({
  status: z
    .enum([
      "NEW",
      "QUALIFYING",
      "QUALIFIED",
      "CONTACTED",
      "MEETING_BOOKED",
      "PROPOSAL",
      "WON",
      "LOST",
      "NURTURING",
    ])
    .optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  owner: z.string().optional(),
  isArchived: z.boolean().optional(),
});

// ==========================================
// AI Qualification Output Schema
// ==========================================
export const aiQualificationSchema = z.object({
  category: z.string().min(1),
  summary: z.string().min(1),
  score: z.number().min(0).max(100),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  reasoning: z.string().min(1),
  recommendedAction: z.string().min(1),
  signals: z.array(z.string()).default([]),
});

export type AIQualificationResult = z.infer<typeof aiQualificationSchema>;

// ==========================================
// Company Schemas
// ==========================================
export const companyCreateSchema = z.object({
  name: z.string().min(1, "Company Name is required").max(100).trim(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  industry: z.string().max(80).optional().or(z.literal("")),
  size: z.string().max(50).optional().or(z.literal("")),
  country: z.string().max(80).optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  owner: z.string().optional(),
  notes: z.string().max(3000).optional().or(z.literal("")),
});

// ==========================================
// Opportunity Schemas
// ==========================================
export const opportunityCreateSchema = z.object({
  name: z.string().min(1, "Opportunity Name is required").max(120).trim(),
  companyName: z.string().min(1, "Company Name is required").max(100).trim(),
  leadId: z.string().optional(),
  primaryContact: z.string().min(1, "Primary contact is required").trim(),
  value: z.number().nonnegative("Value must be non-negative").default(0),
  stage: z
    .enum([
      "NEW",
      "QUALIFIED",
      "DISCOVERY",
      "PROPOSAL",
      "NEGOTIATION",
      "WON",
      "LOST",
    ])
    .default("NEW"),
  probability: z.number().min(0).max(100).default(20),
  expectedCloseDate: z.string().optional(),
  owner: z.string().default("Sales Team"),
  notes: z.string().optional(),
});

// ==========================================
// Task Schemas
// ==========================================
export const taskCreateSchema = z.object({
  title: z.string().min(1, "Task Title is required").max(200).trim(),
  description: z.string().optional(),
  leadId: z.string().optional(),
  leadName: z.string().optional(),
  companyName: z.string().optional(),
  opportunityId: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  assignee: z.string().default("Sales Rep"),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("TODO"),
});

// ==========================================
// Zapier Callback Webhook Schema
// ==========================================
export const zapierStatusWebhookSchema = z.object({
  eventId: z.string().min(1, "eventId is required for idempotency"),
  status: z.enum(["RUNNING", "SUCCESS", "FAILED", "PARTIAL"]),
  leadId: z.string().min(1, "leadId is required"),
  automation: z.string().default("LeadFlow-Zapier-Sync"),
  message: z.string().default(""),
  zapierExecutionId: z.string().optional(),
  twentyPersonId: z.string().optional(),
  twentyCompanyId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ZapierStatusWebhookPayload = z.infer<typeof zapierStatusWebhookSchema>;

// ==========================================
// Canonical Automation Event Schema
// Shared between Backend, Zapier, and Twenty CRM
// ==========================================
export const canonicalAutomationEventSchema = z.object({
  event: z.literal("lead.qualified"),
  eventId: z.string().min(1, "eventId is required"),
  timestamp: z.string().min(1, "ISO-8601 timestamp required"),
  lead: z.object({
    id: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional().default(""),
    company: z.string().optional().default(""),
    jobTitle: z.string().optional().default(""),
    requirement: z.string(),
    budget: z.number().default(0),
    budgetFormatted: z.string().optional(),
    budgetRupees: z.string().optional(),
    currency: z.string().optional().default("INR"),
    currencySymbol: z.string().optional().default("₹"),
    timeline: z.string().optional().default(""),
    industry: z.string().optional().default(""),
    source: z.string().default("website"),
  }),
  qualification: z.object({
    score: z.number().min(0).max(100),
    priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
    category: z.string(),
    summary: z.string(),
    recommendedAction: z.string(),
    signals: z.array(z.string()).default([]),
  }),
  // Top-level convenience fields for direct Zapier mapping without complex nested paths
  leadId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  requirement: z.string().optional(),
  budget: z.number().optional(),
  budgetFormatted: z.string().optional(),
  budgetRupees: z.string().optional(),
  currency: z.string().optional().default("INR"),
  currencySymbol: z.string().optional().default("₹"),
  timeline: z.string().optional(),
  source: z.string().optional(),
  score: z.number().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  priorityLower: z.string().optional(),
  priorityUpper: z.string().optional(),
  isHigh: z.boolean().optional(),
  isMedium: z.boolean().optional(),
  isLow: z.boolean().optional(),
  category: z.string().optional(),
  summary: z.string().optional(),
  recommendedAction: z.string().optional(),
  callbackUrl: z.string().optional(),
  fromName: z.string().optional(),
  senderName: z.string().optional(),
  senderEmail: z.string().optional(),
  developerEmail: z.string().optional(),
  notificationRecipient: z.string().optional(),
  alertSubject: z.string().optional(),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  alertEmailBody: z.string().optional(),
}).passthrough();

export type CanonicalAutomationEvent = z.infer<typeof canonicalAutomationEventSchema>;

// ==========================================
// Twenty CRM Status Webhook Callback Schema
// ==========================================
export const twentyStatusWebhookSchema = z.discriminatedUnion("status", [
  z.object({
    event: z.literal("crm.automation.completed"),
    eventId: z.string().min(1, "eventId is required"),
    leadId: z.string().min(1, "leadId is required"),
    status: z.literal("SUCCESS"),
    personId: z.string().optional(),
    companyId: z.string().optional(),
    opportunityId: z.string().optional(),
    taskId: z.string().optional(),
    timestamp: z.string().optional(),
  }),
  z.object({
    event: z.literal("crm.automation.failed"),
    eventId: z.string().min(1, "eventId is required"),
    leadId: z.string().min(1, "leadId is required"),
    status: z.literal("FAILED"),
    errorCode: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string().optional(),
  }),
]);

export type TwentyStatusWebhookPayload = z.infer<typeof twentyStatusWebhookSchema>;

