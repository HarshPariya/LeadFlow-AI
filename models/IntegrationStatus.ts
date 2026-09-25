import mongoose, { Schema, Document, Model } from "mongoose";

export type IntegrationKey =
  | "twenty"
  | "zapier"
  | "groq"
  | "mongodb"
  | "gmail";

export type IntegrationHealthState =
  | "CONNECTED"
  | "CONFIGURED"
  | "NOT_CONFIGURED"
  | "ERROR"
  | "SIMULATED";

export interface IIntegrationStatus extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  integration: IntegrationKey;
  name: string;
  status: IntegrationHealthState;
  isMock: boolean;
  lastTestedAt?: Date;
  lastSyncAt?: Date;
  latencyMs?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  updatedAt: Date;
}

const IntegrationStatusSchema = new Schema<IIntegrationStatus>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    integration: {
      type: String,
      required: true,
      enum: ["twenty", "zapier", "groq", "mongodb", "gmail"],
    },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["CONNECTED", "CONFIGURED", "NOT_CONFIGURED", "ERROR", "SIMULATED"],
      default: "NOT_CONFIGURED",
    },
    isMock: { type: Boolean, default: false },
    lastTestedAt: { type: Date },
    lastSyncAt: { type: Date },
    latencyMs: { type: Number },
    errorMessage: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

IntegrationStatusSchema.index({ workspaceId: 1, integration: 1 }, { unique: true });

export const IntegrationStatus: Model<IIntegrationStatus> =
  mongoose.models.IntegrationStatus ||
  mongoose.model<IIntegrationStatus>("IntegrationStatus", IntegrationStatusSchema);
