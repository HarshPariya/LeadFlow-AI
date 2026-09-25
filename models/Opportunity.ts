import mongoose, { Schema, Document, Model } from "mongoose";

export type OpportunityStage =
  | "NEW"
  | "QUALIFIED"
  | "DISCOVERY"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export interface IOpportunity extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  name: string;
  companyName: string;
  companyId?: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  primaryContact: string; // Contact person name or email
  value: number; // in USD
  stage: OpportunityStage;
  probability: number; // 0 - 100 percentage
  expectedCloseDate?: Date;
  owner: string;
  notes?: string;
  twentyOpportunityId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OpportunitySchema = new Schema<IOpportunity>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
    primaryContact: { type: String, required: true, trim: true },
    value: { type: Number, required: true, default: 0 },
    stage: {
      type: String,
      enum: [
        "NEW",
        "QUALIFIED",
        "DISCOVERY",
        "PROPOSAL",
        "NEGOTIATION",
        "WON",
        "LOST",
      ],
      default: "NEW",
      index: true,
    },
    probability: { type: Number, default: 20, min: 0, max: 100 },
    expectedCloseDate: { type: Date },
    owner: { type: String, default: "Sales Team" },
    notes: { type: String },
    twentyOpportunityId: { type: String, index: true },
  },
  {
    timestamps: true,
  }
);

OpportunitySchema.index({ workspaceId: 1, stage: 1 });
OpportunitySchema.index({ workspaceId: 1, createdAt: -1 });

export const Opportunity: Model<IOpportunity> =
  mongoose.models.Opportunity ||
  mongoose.model<IOpportunity>("Opportunity", OpportunitySchema);
