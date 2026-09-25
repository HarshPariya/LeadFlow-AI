import mongoose, { Schema, Document, Model } from "mongoose";

export type ActivityEventType =
  | "LEAD_CREATED"
  | "LEAD_UPDATED"
  | "AI_QUALIFICATION_STARTED"
  | "AI_QUALIFICATION_COMPLETED"
  | "ZAPIER_TRIGGERED"
  | "ZAPIER_PATH_HIGH"
  | "ZAPIER_PATH_MEDIUM"
  | "ZAPIER_PATH_LOW"
  | "ZAPIER_COMPLETED"
  | "ZAPIER_FAILED"
  | "GMAIL_SENT"
  | "GMAIL_FAILED"
  | "EMAIL_SEND_STARTED"
  | "EMAIL_SEND_SUCCESS"
  | "EMAIL_SEND_FAILED"
  | "EMAIL_SENT"
  | "TWENTY_SYNC_STARTED"
  | "TWENTY_SYNC_COMPLETED"
  | "TWENTY_SYNC_FAILED"
  | "OPPORTUNITY_CREATED"
  | "TASK_CREATED"
  | "AUTOMATION_FAILED"
  | "AUTOMATION_RETRIED"
  | "LOGIN"
  | "LOGOUT"
  | "WORKSPACE_CREATED"
  | "SETTINGS_UPDATED"
  | "COMPANY_CREATED"
  | "COMPANY_UPDATED"
  | "OPPORTUNITY_UPDATED"
  | "TASK_UPDATED"
  | "TASK_COMPLETED"
  | "LEAD_DELETED";

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  timestamp: Date;
  user: string;
  actor?: string;
  source: string; // "website" | "zapier" | "system" | "twenty" | "api" | "auth"
  eventType: ActivityEventType;
  entityType: "lead" | "company" | "opportunity" | "task" | "automation" | "workspace" | "security";
  entityId: string;
  status: "SUCCESS" | "FAILED" | "RUNNING" | "INFO";
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: false, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, default: Date.now, index: true },
    user: { type: String, default: "System" },
    actor: { type: String },
    source: { type: String, default: "website" },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["lead", "company", "opportunity", "task", "automation", "workspace", "security"],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "RUNNING", "INFO"],
      default: "INFO",
    },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for querying activity stream by workspace, entity, or eventType
ActivityLogSchema.index({ workspaceId: 1, timestamp: -1 });
ActivityLogSchema.index({ workspaceId: 1, entityId: 1, timestamp: -1 });
ActivityLogSchema.index({ workspaceId: 1, eventType: 1, timestamp: -1 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
