import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Task } from "@/models/Task";
import { ActivityLog } from "@/models/ActivityLog";
import { taskCreateSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/security";
import { getCurrentWorkspace } from "@/lib/auth/workspace";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter")?.trim(); // "all" | "today" | "overdue" | "upcoming" | "completed"
    const priority = searchParams.get("priority")?.trim();

    const query: Record<string, unknown> = {
      workspaceId: ctx.workspaceId,
    };

    if (priority && priority !== "ALL") {
      query.priority = priority;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (filter === "completed") {
      query.status = "COMPLETED";
    } else if (filter === "overdue") {
      query.status = { $in: ["TODO", "IN_PROGRESS"] };
      query.dueDate = { $lt: startOfToday };
    } else if (filter === "today") {
      query.status = { $in: ["TODO", "IN_PROGRESS"] };
      query.dueDate = { $gte: startOfToday, $lte: endOfToday };
    } else if (filter === "upcoming") {
      query.status = { $in: ["TODO", "IN_PROGRESS"] };
      query.dueDate = { $gt: endOfToday };
    }

    const tasks = await Task.find(query).sort({ dueDate: 1, createdAt: -1 });

    // Aggregate counts for quick tab counters scoped to workspace
    const [allCount, overdueCount, todayCount, upcomingCount, completedCount] =
      await Promise.all([
        Task.countDocuments({ workspaceId: ctx.workspaceId }),
        Task.countDocuments({
          workspaceId: ctx.workspaceId,
          status: { $in: ["TODO", "IN_PROGRESS"] },
          dueDate: { $lt: startOfToday },
        }),
        Task.countDocuments({
          workspaceId: ctx.workspaceId,
          status: { $in: ["TODO", "IN_PROGRESS"] },
          dueDate: { $gte: startOfToday, $lte: endOfToday },
        }),
        Task.countDocuments({
          workspaceId: ctx.workspaceId,
          status: { $in: ["TODO", "IN_PROGRESS"] },
          dueDate: { $gt: endOfToday },
        }),
        Task.countDocuments({ workspaceId: ctx.workspaceId, status: "COMPLETED" }),
      ]);

    return apiSuccess({
      tasks,
      counts: {
        all: allCount,
        overdue: overdueCount,
        today: todayCount,
        upcoming: upcomingCount,
        completed: completedCount,
      },
    });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to retrieve tasks", 500, err instanceof Error ? err.message : String(err));
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json().catch(() => null);
    const parsed = taskCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid task parameters", 400, parsed.error.flatten());
    }

    await connectToDatabase();

    const currentUser = ctx.user.name || "User";
    const task = await Task.create({
      ...parsed.data,
      workspaceId: ctx.workspaceId,
      createdBy: ctx.userId,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      assignee: parsed.data.assignee || currentUser,
    });

    await ActivityLog.create({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      actor: currentUser,
      eventType: "TASK_CREATED",
      entityType: "task",
      entityId: task._id.toString(),
      user: currentUser,
      source: "website",
      status: "SUCCESS",
      message: `Task created: "${task.title}"`,
    });

    return apiSuccess({ task }, 201);
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to create task", 500, err instanceof Error ? err.message : String(err));
  }
}
