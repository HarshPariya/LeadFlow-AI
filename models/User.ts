import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "OWNER" | "ADMIN" | "MEMBER";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;       // Optional — not set for OAuth-only users
  googleId?: string;           // Google OAuth sub (subject)
  avatarUrl?: string;
  role: UserRole;
  defaultWorkspaceId?: mongoose.Types.ObjectId;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, default: null },   // null for OAuth-only accounts
    googleId: { type: String, sparse: true, index: true },
    avatarUrl: { type: String },
    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "MEMBER"],
      default: "OWNER",
      required: true,
    },
    defaultWorkspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
