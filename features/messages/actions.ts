"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Message } from "@/models/Message";
import { Project } from "@/models/Project";
import { requireStaff } from "@/lib/portal-utils";

export async function markConversationRead(
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireStaff();
    await connectDB();
    await Message.updateMany(
      { project: projectId, readBy: { $ne: session.user.id } },
      { $addToSet: { readBy: session.user.id } }
    );
    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${projectId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function markConversationUnread(
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireStaff();
    await connectDB();
    // Pull the staff member from readBy on every message in this project,
    // so the unread badge re-appears
    await Message.updateMany(
      { project: projectId },
      { $pull: { readBy: session.user.id } }
    );
    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${projectId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function toggleConversationArchived(
  projectId: string,
  archived: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    await Project.findByIdAndUpdate(projectId, {
      $set: { messagesArchivedAt: archived ? new Date() : null },
    });
    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${projectId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateInternalNotes(
  projectId: string,
  notes: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    await Project.findByIdAndUpdate(projectId, {
      $set: { messagesInternalNotes: notes },
    });
    revalidatePath(`/admin/messages/${projectId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteConversation(
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    await Message.deleteMany({ project: projectId });
    await Project.findByIdAndUpdate(projectId, {
      $unset: { messagesArchivedAt: "", messagesInternalNotes: "" },
    });
    revalidatePath("/admin/messages");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function assignConversation(
  projectId: string,
  userId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    await Project.findByIdAndUpdate(projectId, {
      $set: userId ? { messagesAssignedTo: userId } : {},
      $unset: !userId ? { messagesAssignedTo: "" } : {},
    });
    revalidatePath("/admin/messages");
    revalidatePath(`/admin/messages/${projectId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
