import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAutomationStep {
  name: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED" | "RUNNING" | "PENDING";
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  error?: string;
  outputSummary?: string;
}

export interface IAutomationRun extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  leadId: mongoose.Types.ObjectId;
  leadName: string;
  leadEmail: string;
  workflowName: string; // e.g. "Full Lead Qualification & Sync Pipeline"
  status: "SUCCESS" | "FAILED" | "PARTIAL" | "RUNNING" | "PENDING";
  triggerSource: string; // "website" | "api" | "webhook"
  steps: IAutomationStep[];
  durationMs?: number;
  error?: string;
  retryCount: number;
  zapierExecutionId?: string;
  twentyPersonId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AutomationStepSchema = new Schema<IAutomationStep>(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "SKIPPED", "RUNNING", "PENDING"],
      default: "PENDING",
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    durationMs: { type: Number },
    error: { type: String },
    outputSummary: { type: String },
  },
  { _id: false }
);

const AutomationRunSchema = new Schema<IAutomationRun>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    leadName: { type: String, required: true },
    leadEmail: { type: String, required: true },
    workflowName: { type: String, default: "Inbound Lead Qualification Pipeline" },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PARTIAL", "RUNNING", "PENDING"],
      default: "PENDING",
      index: true,
    },
    triggerSource: { type: String, default: "website" },
    steps: [AutomationStepSchema],
    durationMs: { type: Number },
    error: { type: String },
    retryCount: { type: Number, default: 0 },
    zapierExecutionId: { type: String },
    twentyPersonId: { type: String },
  },
  {
    timestamps: true,
  }
);

AutomationRunSchema.index({ workspaceId: 1, createdAt: -1 });
AutomationRunSchema.index({ workspaceId: 1, status: 1 });

export const AutomationRun: Model<IAutomationRun> =
  mongoose.models.AutomationRun ||
  mongoose.model<IAutomationRun>("AutomationRun", AutomationRunSchema);
