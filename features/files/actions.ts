"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Media } from "@/models/Media";
import { Project } from "@/models/Project";
import { requireStaff } from "@/lib/portal-utils";
import { logActivity } from "@/lib/activity";

export async function updateFileMeta(
  id: string,
  data: {
    project?: string | null;
    tags?: string[];
    visibleToClient?: boolean;
    alt?: string;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const update: Record<string, unknown> = {};
    if (data.project !== undefined) {
      if (data.project) {
        update.project = data.project;
        // Infer client from project
        const project = await Project.findById(data.project).select("clientRef").lean();
        if (project?.clientRef) update.client = project.clientRef;
      } else {
        update.$unset = { project: "", client: "" };
      }
    }
    if (data.tags !== undefined) update.tags = data.tags;
    if (data.visibleToClient !== undefined) update.visibleToClient = data.visibleToClient;
    if (data.alt !== undefined) update.alt = data.alt;
    await Media.findByIdAndUpdate(id, update);
    revalidatePath("/admin/files");
    revalidatePath("/admin/media");
    revalidatePath("/portal/files");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
