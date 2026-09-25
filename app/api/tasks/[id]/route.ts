import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Task } from "@/models/Task";
import { ActivityLog } from "@/models/ActivityLog";
import { taskCreateSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/security";
import { getCurrentWorkspace } from "@/lib/auth/workspace";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { id } = await params;
    await connectToDatabase();
    const task = await Task.findOne({ _id: id, workspaceId: ctx.workspaceId });
    if (!task) return apiError("NOT_FOUND", "Task not found in this workspace", 404);
    return apiSuccess({ task });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to retrieve task", 500, err instanceof Error ? err.message : String(err));
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = taskCreateSchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid update parameters", 400, parsed.error.flatten());
    }

    await connectToDatabase();
    const task = await Task.findOneAndUpdate(
      { _id: id, workspaceId: ctx.workspaceId },
      {
        ...parsed.data,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      },
      { new: true }
    );

    if (!task) return apiError("NOT_FOUND", "Task not found in this workspace", 404);

    await ActivityLog.create({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      actor: ctx.user.name,
      user: ctx.user.name,
      eventType: task.status === "COMPLETED" ? "TASK_COMPLETED" : "TASK_UPDATED",
      entityType: "task",
      entityId: task._id.toString(),
      source: "website",
      status: "SUCCESS",
      message: `Updated task: "${task.title}" [Status: ${task.status}]`,
      metadata: parsed.data,
    });

    return apiSuccess({ task });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to update task", 500, err instanceof Error ? err.message : String(err));
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { id } = await params;
    await connectToDatabase();
    const task = await Task.findOneAndDelete({ _id: id, workspaceId: ctx.workspaceId });
    if (!task) return apiError("NOT_FOUND", "Task not found in this workspace", 404);

    await ActivityLog.create({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      actor: ctx.user.name,
      user: ctx.user.name,
      eventType: "SETTINGS_UPDATED",
      entityType: "task",
      entityId: id,
      source: "website",
      status: "SUCCESS",
      message: `Deleted task: "${task.title}"`,
    });

    return apiSuccess({ message: "Task deleted successfully" });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to delete task", 500, err instanceof Error ? err.message : String(err));
  }
}
