"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Message } from "@/models/Message";
import { Milestone } from "@/models/Milestone";
import { Invoice } from "@/models/Invoice";
import { Notification } from "@/models/Notification";
import { Project } from "@/models/Project";
import { Client } from "@/models/Client";
import { User } from "@/models/User";
import {
  messageSchema,
  milestoneSchema,
  invoiceSchema,
  type MessageInput,
  type MilestoneInput,
  type InvoiceInput,
} from "@/lib/validations";
import {
  requireSession,
  requireStaff,
  notify,
  notifyStaff,
  notifyClientForProject,
  clientCanAccessProject,
} from "@/lib/portal-utils";

// ─────────── Messages ───────────

export async function sendMessage(
  data: MessageInput & { parent?: string; mentions?: string[] }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    const parsed = messageSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid" };

    await connectDB();

    if (session.user.role === "client") {
      const ok = await clientCanAccessProject(session.user.id, parsed.data.project);
      if (!ok) return { ok: false, error: "Forbidden" };
    }

    // Validate parent belongs to same project
    if (data.parent) {
      const parent = await Message.findById(data.parent).select("project").lean();
      if (!parent || String(parent.project) !== parsed.data.project) {
        return { ok: false, error: "Invalid parent message" };
      }
    }

    const message = await Message.create({
      project: parsed.data.project,
      sender: session.user.id,
      body: parsed.data.body,
      attachments: parsed.data.attachments,
      parent: data.parent || undefined,
      mentions: data.mentions ?? [],
      readBy: [session.user.id],
    });

    const project = await Project.findById(parsed.data.project).select("title").lean();
    const isReply = !!data.parent;
    const title = isReply
      ? `New reply on ${project?.title ?? "project"}`
      : `New message on ${project?.title ?? "project"}`;
    const body = parsed.data.body.slice(0, 120);

    if (session.user.role === "client") {
      await notifyStaff({
        type: "message_new",
        title,
        body,
        link: `/admin/projects/${parsed.data.project}`,
        project: parsed.data.project,
      });
    } else {
      await notifyClientForProject(parsed.data.project, {
        type: "message_new",
        title,
        body,
        link: `/portal/projects/${parsed.data.project}`,
        project: parsed.data.project,
      });
    }

    // Mention-specific pings
    if (data.mentions && data.mentions.length > 0) {
      const { notify } = await import("@/lib/portal-utils");
      for (const userId of data.mentions) {
        if (userId === session.user.id) continue; // skip self
        await notify({
          user: userId,
          type: "message_new",
          title: `${session.user.name ?? "Someone"} mentioned you`,
          body,
          link: `/portal/projects/${parsed.data.project}`,
          project: parsed.data.project,
        });
      }
    }

    revalidatePath(`/admin/projects/${parsed.data.project}`);
    revalidatePath(`/portal/projects/${parsed.data.project}`);
    return { ok: true, id: String(message._id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function toggleMessageReaction(
  messageId: string,
  emoji: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    await connectDB();
    const message = await Message.findById(messageId);
    if (!message) return { ok: false, error: "Not found" };

    if (session.user.role === "client") {
      const ok = await clientCanAccessProject(session.user.id, String(message.project));
      if (!ok) return { ok: false, error: "Forbidden" };
    }

    const userId = session.user.id;
    const reaction = message.reactions.find((r) => r.emoji === emoji);
    if (!reaction) {
      message.reactions.push({
        emoji,
        users: [userId as unknown as import("mongoose").Types.ObjectId],
      });
    } else {
      const hasReacted = reaction.users.some((u) => String(u) === userId);
      if (hasReacted) {
        reaction.users = reaction.users.filter((u) => String(u) !== userId);
        if (reaction.users.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        reaction.users.push(userId as unknown as import("mongoose").Types.ObjectId);
      }
    }
    await message.save();

    revalidatePath(`/admin/projects/${message.project}`);
    revalidatePath(`/portal/projects/${message.project}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function editMessage(
  messageId: string,
  body: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    if (!body?.trim()) return { ok: false, error: "Body required" };
    await connectDB();
    const message = await Message.findById(messageId);
    if (!message) return { ok: false, error: "Not found" };
    if (String(message.sender) !== session.user.id) {
      return { ok: false, error: "You can only edit your own messages" };
    }
    message.body = body.trim();
    message.editedAt = new Date();
    await message.save();
    revalidatePath(`/admin/projects/${message.project}`);
    revalidatePath(`/portal/projects/${message.project}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteMessage(
  messageId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    await connectDB();
    const message = await Message.findById(messageId);
    if (!message) return { ok: false, error: "Not found" };
    const isOwner = String(message.sender) === session.user.id;
    const isStaff = session.user.role !== "client";
    if (!isOwner && !isStaff) return { ok: false, error: "Forbidden" };
    const projectId = String(message.project);
    // Cascade: delete child replies too
    await Message.deleteMany({ parent: messageId });
    await message.deleteOne();
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/portal/projects/${projectId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// Lookup helper for the @-mention picker
export async function searchProjectMembers(projectId: string, q: string): Promise<{
  ok: true;
  members: { _id: string; name: string; role: string }[];
} | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    await connectDB();
    const project = await Project.findById(projectId).select("clientRef").lean();
    if (!project) return { ok: false, error: "Project not found" };

    if (session.user.role === "client") {
      const ok = await clientCanAccessProject(session.user.id, projectId);
      if (!ok) return { ok: false, error: "Forbidden" };
    }

    const { User } = await import("@/models/User");
    const regex = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;

    // Build candidate filter: staff (admin/editor) + the client account if any
    const orFilters: Record<string, unknown>[] = [{ role: { $in: ["admin", "editor"] } }];
    if (project.clientRef) {
      const { Client } = await import("@/models/Client");
      const client = await Client.findById(project.clientRef).select("user").lean();
      if (client?.user) orFilters.push({ _id: client.user });
    }

    const filter: Record<string, unknown> = { $or: orFilters };
    if (regex) filter.name = regex;

    const users = await User.find(filter).select("name role").limit(8).lean();
    return {
      ok: true,
      members: users.map((u) => ({ _id: String(u._id), name: u.name, role: u.role })),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// ─────────── Milestones ───────────

export async function upsertMilestone(
  id: string | null,
  data: MilestoneInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    const parsed = milestoneSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid" };
    await connectDB();

    if (id) {
      const before = await Milestone.findById(id).lean();
      const next: Record<string, unknown> = { ...parsed.data };
      if (parsed.data.status === "completed" && before?.status !== "completed") {
        next.completedAt = new Date();
      }
      await Milestone.findByIdAndUpdate(id, next);

      if (parsed.data.status === "completed" && before?.status !== "completed") {
        await notifyClientForProject(parsed.data.project, {
          type: "milestone_completed",
          title: `Milestone completed: ${parsed.data.title}`,
          link: `/portal/projects/${parsed.data.project}`,
          project: parsed.data.project,
        });
      }
    } else {
      await Milestone.create(parsed.data);
    }

    revalidatePath(`/admin/projects/${parsed.data.project}`);
    revalidatePath(`/portal/projects/${parsed.data.project}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteMilestone(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const m = await Milestone.findById(id);
    if (!m) return { ok: false, error: "Not found" };
    const projectId = String(m.project);
    await m.deleteOne();
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/portal/projects/${projectId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// ─────────── Invoices ───────────

function calcTotals(items: { quantity: number; unitPrice: number }[], taxRate: number) {
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const taxAmount = +(subtotal * (taxRate / 100)).toFixed(2);
  const total = +(subtotal + taxAmount).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), taxAmount, total };
}

export async function upsertInvoice(
  id: string | null,
  data: InvoiceInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requireStaff();
    const parsed = invoiceSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid" };
    await connectDB();

    const totals = calcTotals(parsed.data.items, parsed.data.taxRate);

    const payload = {
      number: parsed.data.number,
      client: parsed.data.client,
      project: parsed.data.project || undefined,
      items: parsed.data.items,
      currency: parsed.data.currency,
      taxRate: parsed.data.taxRate,
      ...totals,
      status: parsed.data.status,
      issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate as string) : new Date(),
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate as string) : undefined,
      notes: parsed.data.notes,
    };

    let invoice;
    let wasSentBefore = false;
    if (id) {
      const before = await Invoice.findById(id).select("status").lean();
      wasSentBefore = before?.status === "sent";
      invoice = await Invoice.findByIdAndUpdate(id, payload, { new: true });
    } else {
      invoice = await Invoice.create(payload);
    }
    if (!invoice) return { ok: false, error: "Save failed" };

    // Notify client on first 'sent' transition
    if (parsed.data.status === "sent" && !wasSentBefore) {
      const client = await Client.findById(parsed.data.client).select("user name email").lean();
      if (client?.user) {
        await notify({
          user: client.user,
          type: "invoice_sent",
          title: `Invoice ${invoice.number} sent`,
          body: `Total: ${parsed.data.currency} ${totals.total.toFixed(2)}`,
          link: `/portal/invoices`,
          invoice: String(invoice._id),
        });
      }
      // Email the client too — if they have an email on file
      if (client?.email) {
        const { invoiceIssuedEmail } = await import("@/lib/email");
        const { absoluteUrl, sendClientEmail } = await import("@/lib/notify-client");
        const { html, text, subject } = invoiceIssuedEmail({
          clientName: client.name,
          invoiceNumber: invoice.number,
          amount: totals.total,
          currency: parsed.data.currency || "USD",
          dueDate: payload.dueDate,
          portalUrl: absoluteUrl(`/portal/invoices`),
        });
        await sendClientEmail(client.email, subject, html, text);
      }
    }

    revalidatePath("/admin/invoices");
    revalidatePath("/portal/invoices");
    return { ok: true, id: String(invoice._id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function setInvoiceStatus(
  id: string,
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();

    // Read current status before update so we know if 'sent' is a new transition
    const before = await Invoice.findById(id).select("status").lean();

    const update: Record<string, unknown> = { status };
    if (status === "paid") update.paidDate = new Date();
    const inv = await Invoice.findByIdAndUpdate(id, update, { new: true });
    if (!inv) return { ok: false, error: "Not found" };

    if (status === "paid") {
      const client = await Client.findById(inv.client).select("user").lean();
      if (client?.user) {
        await notify({
          user: client.user,
          type: "invoice_paid",
          title: `Invoice ${inv.number} marked paid`,
          link: `/portal/invoices`,
          invoice: id,
        });
      }
    }

    // ─── Email the client when invoice is first issued (status moves to 'sent') ───
    if (status === "sent" && before?.status !== "sent") {
      const client = await Client.findById(inv.client).select("name email").lean();
      if (client?.email) {
        const { invoiceIssuedEmail } = await import("@/lib/email");
        const { absoluteUrl, sendClientEmail } = await import("@/lib/notify-client");
        const { html, text, subject } = invoiceIssuedEmail({
          clientName: client.name,
          invoiceNumber: inv.number,
          amount: inv.total,
          currency: inv.currency ?? "USD",
          dueDate: inv.dueDate,
          portalUrl: absoluteUrl(`/portal/invoices`),
        });
        await sendClientEmail(client.email, subject, html, text);
      }
    }

    revalidatePath("/admin/invoices");
    revalidatePath("/portal/invoices");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteInvoice(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    await Invoice.findByIdAndDelete(id);
    revalidatePath("/admin/invoices");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

// ─────────── Notifications ───────────

export async function markNotificationsRead(ids?: string[]): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    await connectDB();
    const filter: Record<string, unknown> = { user: session.user.id };
    if (ids && ids.length) filter._id = { $in: ids };
    await Notification.updateMany(filter, { read: true });
    revalidatePath("/admin");
    revalidatePath("/portal");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
