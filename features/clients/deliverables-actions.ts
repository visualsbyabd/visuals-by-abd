"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Deliverable } from "@/models/Deliverable";
import { Project } from "@/models/Project";
import { deliverableSchema, type DeliverableInput } from "@/lib/validations";
import {
  requireSession,
  requireStaff,
  requireClient,
  notify,
  notifyStaff,
  notifyClientForProject,
  clientCanAccessProject,
} from "@/lib/portal-utils";
import { logActivity } from "@/lib/activity";
import { getProjectClientForEmail, absoluteUrl, sendClientEmail } from "@/lib/notify-client";
import { deliverableAddedEmail } from "@/lib/email";

export async function createDeliverable(
  data: DeliverableInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const session = await requireStaff();
    const parsed = deliverableSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

    await connectDB();
    const project = await Project.findById(parsed.data.project).select("title").lean();
    if (!project) return { ok: false, error: "Project not found" };

    const dueDate =
      parsed.data.dueDate instanceof Date
        ? parsed.data.dueDate
        : parsed.data.dueDate
        ? new Date(parsed.data.dueDate)
        : undefined;

    const deliverable = await Deliverable.create({
      ...parsed.data,
      dueDate,
      uploadedBy: session.user.id,
    });

    if (parsed.data.status === "in_review") {
      await notifyClientForProject(parsed.data.project, {
        type: "deliverable_uploaded",
        title: `New deliverable on ${project.title}`,
        body: parsed.data.title,
        link: `/portal/projects/${parsed.data.project}`,
        project: parsed.data.project,
        deliverable: String(deliverable._id),
      });
      const projDoc = await Project.findById(parsed.data.project).select("clientRef").lean();
      await logActivity({
        type: "deliverable_uploaded",
        actor: session.user.id,
        project: parsed.data.project,
        client: projDoc?.clientRef,
        title: `Deliverable uploaded: ${parsed.data.title}`,
        link: `/admin/projects/${parsed.data.project}`,
      });
    }

    // ─── Email the client if project is linked and an email exists ───
    // Gated to: status=in_review (so drafts don't email) + project has a clientRef
    if (parsed.data.status === "in_review") {
      const ctx = await getProjectClientForEmail(parsed.data.project);
      if (ctx) {
        const { html, text, subject } = deliverableAddedEmail({
          clientName: ctx.name,
          projectTitle: ctx.projectTitle,
          deliverableTitle: parsed.data.title,
          deliverableType: parsed.data.type,
          description: parsed.data.description,
          dueDate,
          portalUrl: absoluteUrl(`/portal/projects/${parsed.data.project}`),
        });
        await sendClientEmail(ctx.email, subject, html, text);
      }
    }

    revalidatePath(`/admin/projects/${parsed.data.project}`);
    revalidatePath(`/portal/projects/${parsed.data.project}`);
    return { ok: true, id: String(deliverable._id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function setDeliverableStatus(
  id: string,
  status: "draft" | "in_review" | "approved" | "changes_requested",
  feedback?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    await connectDB();

    const deliverable = await Deliverable.findById(id).populate<{ project: { _id: string; title: string } }>("project", "title");
    if (!deliverable) return { ok: false, error: "Not found" };

    // Clients can only approve/request changes — and only for their own project
    if (session.user.role === "client") {
      if (status !== "approved" && status !== "changes_requested") {
        return { ok: false, error: "Clients can only approve or request changes" };
      }
      const allowed = await clientCanAccessProject(session.user.id, String(deliverable.project._id));
      if (!allowed) return { ok: false, error: "Forbidden" };
    }

    deliverable.status = status;
    if (feedback !== undefined) deliverable.feedback = feedback;
    if (status === "approved" || status === "changes_requested") {
      deliverable.reviewedAt = new Date();
    }
    await deliverable.save();

    // Notify staff of client action
    if (session.user.role === "client") {
      await notifyStaff({
        type: status === "approved" ? "deliverable_approved" : "deliverable_changes_requested",
        title:
          status === "approved"
            ? `Deliverable approved: ${deliverable.title}`
            : `Changes requested: ${deliverable.title}`,
        body: feedback,
        link: `/admin/projects/${deliverable.project._id}`,
        project: String(deliverable.project._id),
        deliverable: id,
      });
      const projDoc = await Project.findById(deliverable.project._id).select("clientRef").lean();
      await logActivity({
        type: status === "approved" ? "deliverable_approved" : "deliverable_changes_requested",
        actor: session.user.id,
        project: String(deliverable.project._id),
        client: projDoc?.clientRef,
        title:
          status === "approved"
            ? `Approved: ${deliverable.title}`
            : `Requested changes on: ${deliverable.title}`,
        description: feedback,
        link: `/admin/projects/${deliverable.project._id}`,
      });
    }

    revalidatePath(`/admin/projects/${deliverable.project._id}`);
    revalidatePath(`/portal/projects/${deliverable.project._id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteDeliverable(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const deliverable = await Deliverable.findById(id);
    if (!deliverable) return { ok: false, error: "Not found" };
    const projectId = String(deliverable.project);
    await deliverable.deleteOne();
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/portal/projects/${projectId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
