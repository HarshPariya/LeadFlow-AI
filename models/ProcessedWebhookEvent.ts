import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProcessedWebhookEvent extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId?: mongoose.Types.ObjectId;
  eventId: string;
  source: string; // e.g. "zapier", "twenty", "inbound"
  eventType: string;
  payloadHash?: string;
  status: "PROCESSED" | "IGNORED_DUPLICATE" | "FAILED";
  receivedAt: Date;
  processedAt: Date;
}

const ProcessedWebhookEventSchema = new Schema<IProcessedWebhookEvent>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", index: true },
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    source: { type: String, required: true },
    eventType: { type: String, required: true },
    payloadHash: { type: String },
    status: {
      type: String,
      enum: ["PROCESSED", "IGNORED_DUPLICATE", "FAILED"],
      default: "PROCESSED",
    },
    receivedAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

export const ProcessedWebhookEvent: Model<IProcessedWebhookEvent> =
  mongoose.models.ProcessedWebhookEvent ||
  mongoose.model<IProcessedWebhookEvent>(
    "ProcessedWebhookEvent",
    ProcessedWebhookEventSchema
  );
