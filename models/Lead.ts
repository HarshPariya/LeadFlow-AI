import mongoose, { Schema, Document, Model } from "mongoose";

export type LeadStatus =
  | "NEW"
  | "QUALIFYING"
  | "QUALIFIED"
  | "CONTACTED"
  | "MEETING_BOOKED"
  | "PROPOSAL"
  | "WON"
  | "LOST"
  | "NURTURING";

export type LeadPriority = "HIGH" | "MEDIUM" | "LOW";

export type AutomationStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED"
  | "RETRYING";

export interface ILead extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  companyId?: mongoose.Types.ObjectId;
  jobTitle?: string;
  source: string;
  requirement: string;
  budget?: number;
  timeline?: string;
  industry?: string;
  country?: string;
  notes?: string;

  status: LeadStatus;
  priority: LeadPriority;

  // AI Qualification Results
  aiScore?: number;
  aiCategory?: string;
  aiSummary?: string;
  aiReasoning?: string;
  aiRecommendedAction?: string;
  aiSignals?: string[];
  aiModel?: string;
  aiQualifiedAt?: Date;

  // Twenty CRM synchronization
  twentyPersonId?: string;
  twentyCompanyId?: string;
  twentyOpportunityId?: string;
  twentyTaskId?: string;
  lastSyncedAt?: Date;
  syncStatus?: "NOT_SYNCED" | "SYNCED" | "FAILED" | "PENDING";
  syncError?: string;

  // Zapier Automation execution tracking
  automationStatus: AutomationStatus;
  lastZapierEvent?: string;
  lastZapierStatus?: string;
  lastZapierError?: string;
  zapierExecutionId?: string;
  retryCount: number;

  workspaceId: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  owner?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true },
    company: { type: String, trim: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    jobTitle: { type: String, trim: true },
    source: { type: String, default: "website", trim: true },
    requirement: { type: String, required: true },
    budget: { type: Number, default: 0 },
    timeline: { type: String, trim: true },
    industry: { type: String, trim: true },
    country: { type: String, trim: true },
    notes: { type: String },

    status: {
      type: String,
      enum: [
        "NEW",
        "QUALIFYING",
        "QUALIFIED",
        "CONTACTED",
        "MEETING_BOOKED",
        "PROPOSAL",
        "WON",
        "LOST",
        "NURTURING",
      ],
      default: "NEW",
      index: true,
    },
    priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
      index: true,
    },

    // AI Fields
    aiScore: { type: Number, min: 0, max: 100, index: true },
    aiCategory: { type: String },
    aiSummary: { type: String },
    aiReasoning: { type: String },
    aiRecommendedAction: { type: String },
    aiSignals: [{ type: String }],
    aiModel: { type: String },
    aiQualifiedAt: { type: Date },

    // Twenty CRM Fields
    twentyPersonId: { type: String, index: true },
    twentyCompanyId: { type: String, index: true },
    twentyOpportunityId: { type: String },
    twentyTaskId: { type: String },
    lastSyncedAt: { type: Date },
    syncStatus: {
      type: String,
      enum: ["NOT_SYNCED", "SYNCED", "FAILED", "PENDING"],
      default: "NOT_SYNCED",
    },
    syncError: { type: String },

    // Zapier Automation Tracking
    automationStatus: {
      type: String,
      enum: ["PENDING", "RUNNING", "SUCCESS", "PARTIAL", "FAILED", "RETRYING"],
      default: "PENDING",
      index: true,
    },
    lastZapierEvent: { type: String },
    lastZapierStatus: { type: String },
    lastZapierError: { type: String },
    zapierExecutionId: { type: String },
    retryCount: { type: Number, default: 0 },

    owner: { type: String, default: "Unassigned" },
    isArchived: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal search and filtering within workspace
LeadSchema.index({ workspaceId: 1, email: 1, isArchived: 1 });
LeadSchema.index({ workspaceId: 1, status: 1, priority: 1 });
LeadSchema.index({ workspaceId: 1, createdAt: -1 });
LeadSchema.index({ workspaceId: 1, isArchived: 1 });

export const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
