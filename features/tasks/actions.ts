"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Task, type TaskStatus } from "@/models/Task";
import { Project } from "@/models/Project";
import {
  taskSchema,
  taskCommentSchema,
  type TaskInput,
  type TaskCommentInput,
} from "@/lib/validations";
import {
  requireSession,
  requireStaff,
  clientCanAccessProject,
  notifyStaff,
  notifyClientForProject,
} from "@/lib/portal-utils";
import { logActivity } from "@/lib/activity";

export async function createTask(
  data: TaskInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const session = await requireStaff();
    const parsed = taskSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

    await connectDB();
    const count = await Task.countDocuments({ project: parsed.data.project, status: parsed.data.status });
    const task = await Task.create({
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate as string) : undefined,
      order: count,
      createdBy: session.user.id,
    });

    const project = await Project.findById(parsed.data.project).select("title clientRef").lean();
    if (project) {
      await logActivity({
        type: "task_created",
        actor: session.user.id,
        project: parsed.data.project,
        client: project.clientRef,
        task: String(task._id),
        title: `Task created: ${task.title}`,
        link: `/admin/projects/${parsed.data.project}`,
      });
    }

    revalidatePath(`/admin/projects/${parsed.data.project}`);
    revalidatePath(`/portal/projects/${parsed.data.project}`);
    return { ok: true, id: String(task._id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateTask(
  id: string,
  data: Partial<TaskInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const update: Record<string, unknown> = { ...data };
    if (data.dueDate) update.dueDate = new Date(data.dueDate as string);
    const task = await Task.findByIdAndUpdate(id, update);
    if (task) {
      revalidatePath(`/admin/projects/${task.project}`);
      revalidatePath(`/portal/projects/${task.project}`);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function moveTask(
  id: string,
  status: TaskStatus,
  order: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    await connectDB();
    const task = await Task.findById(id);
    if (!task) return { ok: false, error: "Not found" };

    // Clients can only move their visible tasks to non-completed states (we let them re-categorize)
    if (session.user.role === "client") {
      const ok = await clientCanAccessProject(session.user.id, String(task.project));
      if (!ok || !task.visibleToClient) return { ok: false, error: "Forbidden" };
    }

    const wasCompleted = task.status === "completed";
    task.status = status;
    task.order = order;
    if (status === "completed" && !wasCompleted) task.completedAt = new Date();
    if (status !== "completed" && wasCompleted) task.completedAt = undefined;
    await task.save();

    // Log activity
    const project = await Project.findById(task.project).select("title clientRef").lean();
    if (project) {
      await logActivity({
        type: status === "completed" ? "task_completed" : "task_status_changed",
        actor: session.user.id,
        project: String(task.project),
        client: project.clientRef,
        task: id,
        title: status === "completed" ? `Task completed: ${task.title}` : `Task moved: ${task.title} → ${status.replace("_", " ")}`,
        link: `/admin/projects/${task.project}`,
      });

      if (status === "completed" && !wasCompleted && session.user.role !== "client") {
        await notifyClientForProject(String(task.project), {
          type: "milestone_completed",
          title: `Task completed: ${task.title}`,
          link: `/portal/projects/${task.project}`,
          project: String(task.project),
        });
      }
    }

    revalidatePath(`/admin/projects/${task.project}`);
    revalidatePath(`/portal/projects/${task.project}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteTask(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const task = await Task.findById(id);
    if (!task) return { ok: false, error: "Not found" };
    const projectId = String(task.project);
    await task.deleteOne();
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/portal/projects/${projectId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function addTaskComment(
  data: TaskCommentInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    const parsed = taskCommentSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

    await connectDB();
    const task = await Task.findById(parsed.data.taskId);
    if (!task) return { ok: false, error: "Task not found" };

    if (session.user.role === "client") {
      const ok = await clientCanAccessProject(session.user.id, String(task.project));
      if (!ok || !task.visibleToClient) return { ok: false, error: "Forbidden" };
    }

    task.comments.push({
      user: session.user.id as unknown as import("mongoose").Types.ObjectId,
      body: parsed.data.body,
      createdAt: new Date(),
    });
    await task.save();

    const project = await Project.findById(task.project).select("title clientRef").lean();
    if (project) {
      await logActivity({
        type: "task_comment",
        actor: session.user.id,
        project: String(task.project),
        client: project.clientRef,
        task: parsed.data.taskId,
        title: `Comment on ${task.title}`,
        description: parsed.data.body.slice(0, 120),
        link: `/admin/projects/${task.project}`,
      });

      // Cross-notify
      if (session.user.role === "client") {
        await notifyStaff({
          type: "message_new",
          title: `Task comment: ${task.title}`,
          body: parsed.data.body.slice(0, 120),
          link: `/admin/projects/${task.project}`,
          project: String(task.project),
        });
      } else {
        await notifyClientForProject(String(task.project), {
          type: "message_new",
          title: `Comment on ${task.title}`,
          body: parsed.data.body.slice(0, 120),
          link: `/portal/projects/${task.project}`,
          project: String(task.project),
        });
      }
    }

    revalidatePath(`/admin/projects/${task.project}`);
    revalidatePath(`/portal/projects/${task.project}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
