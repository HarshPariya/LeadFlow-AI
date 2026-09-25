import mongoose, { Schema, Document, Model } from "mongoose";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskPriority = "HIGH" | "MEDIUM" | "LOW";

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  leadId?: mongoose.Types.ObjectId;
  leadName?: string;
  companyName?: string;
  opportunityId?: mongoose.Types.ObjectId;
  priority: TaskPriority;
  dueDate?: Date;
  assignee: string;
  status: TaskStatus;
  twentyTaskId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
    leadName: { type: String },
    companyName: { type: String },
    opportunityId: { type: Schema.Types.ObjectId, ref: "Opportunity" },
    priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
      index: true,
    },
    dueDate: { type: Date, index: true },
    assignee: { type: String, default: "Sales Rep" },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "TODO",
      index: true,
    },
    twentyTaskId: { type: String, index: true },
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ workspaceId: 1, status: 1 });
TaskSchema.index({ workspaceId: 1, dueDate: 1 });
TaskSchema.index({ workspaceId: 1, createdAt: -1 });

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
