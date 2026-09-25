import mongoose, { Schema, Document, Model } from "mongoose";

export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER";

export interface IMembership extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: MembershipRole;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "MEMBER"],
      default: "MEMBER",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index guaranteeing a user only has one membership per workspace
MembershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
MembershipSchema.index({ userId: 1, workspaceId: 1 });

export const Membership: Model<IMembership> =
  mongoose.models.Membership || mongoose.model<IMembership>("Membership", MembershipSchema);
