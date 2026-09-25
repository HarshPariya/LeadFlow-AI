import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompany extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  name: string;
  website?: string;
  industry?: string;
  size?: string; // e.g. "1-10", "11-50", "51-200", "201-500", "500+"
  country?: string;
  contactEmail?: string;
  phone?: string;
  owner?: string;
  notes?: string;
  twentyCompanyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true, index: true },
    website: { type: String, trim: true },
    industry: { type: String, trim: true, index: true },
    size: { type: String, trim: true },
    country: { type: String, trim: true },
    contactEmail: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    owner: { type: String, default: "Unassigned" },
    notes: { type: String },
    twentyCompanyId: { type: String, index: true },
  },
  {
    timestamps: true,
  }
);

CompanySchema.index({ workspaceId: 1, name: 1 });
CompanySchema.index({ workspaceId: 1, createdAt: -1 });

export const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);
