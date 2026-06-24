"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Revision, type RevisionStatus, type RevisionPriority } from "@/models/Revision";
import { Project } from "@/models/Project";
import {
  requireSession,
  requireStaff,
  clientCanAccessProject,
  notify,
  notifyStaff,
  notifyClientForProject,
} from "@/lib/portal-utils";
import { logActivity } from "@/lib/activity";

type AttachmentInput = {
  url: string;
  name: string;
  type: "image" | "video" | "document";
  size?: number;
};

type CreateInput = {
  project: string;
  deliverable?: string;
  title: string;
  description: string;
  priority?: RevisionPriority;
  attachments?: AttachmentInput[];
};

export async function createRevision(
  data: CreateInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    if (!data.title?.trim()) return { ok: false, error: "Title required" };
    if (!data.description?.trim()) return { ok: false, error: "Description required" };

    await connectDB();
    const project = await Project.findById(data.project).select("title clientRef").lean();
    if (!project || !project.clientRef) return { ok: false, error: "Project not found" };

    // Permission check
    if (session.user.role === "client") {
      const ok = await clientCanAccessProject(session.user.id, data.project);
      if (!ok) return { ok: false, error: "Forbidden" };
    }

    const revision = await Revision.create({
      project: data.project,
      client: project.clientRef,
      deliverable: data.deliverable || undefined,
      title: data.title.trim(),
      description: data.description.trim(),
      priority: data.priority ?? "medium",
      status: "open",
      attachments: data.attachments ?? [],
      createdBy: session.user.id,
    });

    await logActivity({
      type: "deliverable_changes_requested",
      actor: session.user.id,
      project: data.project,
      client: String(project.clientRef),
      title: `Revision requested: ${data.title}`,
      description: data.description.slice(0, 160),
      link: `/admin/projects/${data.project}`,
    });

    // Notify the other side
    if (session.user.role === "client") {
      await notifyStaff({
        type: "deliverable_changes_requested",
        title: `Revision on ${project.title}: ${data.title}`,
        body: data.description.slice(0, 160),
        link: `/admin/projects/${data.project}`,
        project: data.project,
      });
    } else {
      await notifyClientForProject(data.project, {
        type: "deliverable_changes_requested",
        title: `New revision logged: ${data.title}`,
        body: data.description.slice(0, 160),
        link: `/portal/projects/${data.project}`,
        project: data.project,
      });
    }

    revalidatePath(`/admin/projects/${data.project}`);
    revalidatePath(`/portal/projects/${data.project}`);
    revalidatePath("/admin/revisions");
    return { ok: true, id: String(revision._id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

/**
 * Edit a revision's title, description, and/or priority. Staff-only — clients
 * cannot edit the content of a revision once it's been opened (status changes
 * are the only thing they control, via updateRevisionStatus).
 */
export async function updateRevision(
  id: string,
  data: { title?: string; description?: string; priority?: "low" | "medium" | "high" }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const revision = await Revision.findById(id);
    if (!revision) return { ok: false, error: "Not found" };

    if (data.title !== undefined) {
      const trimmed = data.title.trim();
      if (trimmed.length < 2) return { ok: false, error: "Title must be at least 2 characters" };
      revision.title = trimmed;
    }
    if (data.description !== undefined) {
      revision.description = data.description.trim();
    }
    if (data.priority !== undefined) {
      revision.priority = data.priority;
    }
    await revision.save();

    revalidatePath(`/admin/projects/${revision.project}`);
    revalidatePath(`/portal/projects/${revision.project}`);
    revalidatePath("/admin/revisions");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update" };
  }
}

export async function updateRevisionStatus(
  id: string,
  status: RevisionStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    await connectDB();
    const revision = await Revision.findById(id);
    if (!revision) return { ok: false, error: "Not found" };

    // Clients can only re-open or close. Staff control the working states.
    if (session.user.role === "client") {
      if (!["open", "closed"].includes(status)) {
        return { ok: false, error: "Forbidden" };
      }
      const ok = await clientCanAccessProject(session.user.id, String(revision.project));
      if (!ok) return { ok: false, error: "Forbidden" };
    }

    const wasResolved = revision.status === "resolved";
    revision.status = status;
    if (status === "resolved" && !wasResolved) {
      revision.resolvedAt = new Date();
      revision.resolvedBy = session.user.id as unknown as import("mongoose").Types.ObjectId;
    }
    if (status !== "resolved" && wasResolved) {
      revision.resolvedAt = undefined;
      revision.resolvedBy = undefined;
    }
    await revision.save();

    const project = await Project.findById(revision.project).select("title clientRef").lean();

    await logActivity({
      type: "task_status_changed",
      actor: session.user.id,
      project: String(revision.project),
      client: project?.clientRef,
      title: `Revision ${status.replace("_", " ")}: ${revision.title}`,
      link: `/admin/projects/${revision.project}`,
    });

    // Cross-notify
    if (status === "resolved" && session.user.role !== "client") {
      await notifyClientForProject(String(revision.project), {
        type: "deliverable_approved",
        title: `Revision resolved: ${revision.title}`,
        link: `/portal/projects/${revision.project}`,
        project: String(revision.project),
      });
    } else if (status === "open" && session.user.role === "client") {
      await notifyStaff({
        type: "deliverable_changes_requested",
        title: `Revision re-opened: ${revision.title}`,
        link: `/admin/projects/${revision.project}`,
        project: String(revision.project),
      });
    }

    revalidatePath(`/admin/projects/${revision.project}`);
    revalidatePath(`/portal/projects/${revision.project}`);
    revalidatePath("/admin/revisions");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function addRevisionComment(
  id: string,
  body: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    if (!body?.trim()) return { ok: false, error: "Comment can't be empty" };

    await connectDB();
    const revision = await Revision.findById(id);
    if (!revision) return { ok: false, error: "Not found" };

    if (session.user.role === "client") {
      const ok = await clientCanAccessProject(session.user.id, String(revision.project));
      if (!ok) return { ok: false, error: "Forbidden" };
    }

    revision.comments.push({
      user: session.user.id as unknown as import("mongoose").Types.ObjectId,
      body: body.trim(),
      createdAt: new Date(),
    });
    await revision.save();

    const project = await Project.findById(revision.project).select("title clientRef").lean();

    if (session.user.role === "client") {
      await notifyStaff({
        type: "message_new",
        title: `Comment on revision: ${revision.title}`,
        body: body.slice(0, 160),
        link: `/admin/projects/${revision.project}`,
        project: String(revision.project),
      });
    } else {
      await notifyClientForProject(String(revision.project), {
        type: "message_new",
        title: `Studio replied on: ${revision.title}`,
        body: body.slice(0, 160),
        link: `/portal/projects/${revision.project}`,
        project: String(revision.project),
      });

      // ─── Email the client too (only when staff is replying) ───
      const { getProjectClientForEmail, absoluteUrl, sendClientEmail } = await import(
        "@/lib/notify-client"
      );
      const { revisionReplyEmail } = await import("@/lib/email");
      const ctx = await getProjectClientForEmail(String(revision.project));
      if (ctx) {
        const { html, text, subject } = revisionReplyEmail({
          clientName: ctx.name,
          projectTitle: ctx.projectTitle,
          revisionTitle: revision.title,
          replyBody: body.trim(),
          portalUrl: absoluteUrl(`/portal/projects/${revision.project}`),
        });
        await sendClientEmail(ctx.email, subject, html, text);
      }
    }

    revalidatePath(`/admin/projects/${revision.project}`);
    revalidatePath(`/portal/projects/${revision.project}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteRevision(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const revision = await Revision.findById(id);
    if (!revision) return { ok: false, error: "Not found" };
    const projectId = String(revision.project);
    await revision.deleteOne();
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/portal/projects/${projectId}`);
    revalidatePath("/admin/revisions");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
