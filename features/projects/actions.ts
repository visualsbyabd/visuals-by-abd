"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { auth } from "@/lib/auth";
import { projectSchema, type ProjectInput } from "@/lib/validations";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export async function createProject(
  data: ProjectInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const parsed = projectSchema.safeParse(data);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }

    await connectDB();
    const existing = await Project.findOne({ slug: parsed.data.slug });
    if (existing) {
      return { ok: false, error: "A project with that slug already exists." };
    }

    const project = await Project.create(parsed.data);
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/admin/projects");
    return { ok: true, id: String(project._id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create" };
  }
}

export async function updateProject(
  id: string,
  data: Partial<ProjectInput>
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    await connectDB();
    await Project.findByIdAndUpdate(id, data, { new: true });
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/admin/projects");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update" };
  }
}

export async function deleteProject(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    await connectDB();
    await Project.findByIdAndDelete(id);
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/admin/projects");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete" };
  }
}

export async function toggleProjectStatus(
  id: string,
  status: "draft" | "published" | "archived"
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    await connectDB();
    await Project.findByIdAndUpdate(id, { status });
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/admin/projects");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update" };
  }
}

/**
 * Set or clear the single "main on home" project.
 *
 * Pass an id to make that project the main one. Pass null to clear (no project
 * is main). This is the only place that should mutate `isMainOnHome` — it
 * enforces the single-truth constraint by unsetting every other project first.
 *
 * Setting a project as main also auto-flips its `featured` to true, since the
 * main project is by definition shown in the featured-work section.
 */
export async function setMainHomeProject(
  id: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    await connectDB();
    // Clear it on everyone first — guarantees only one can have it.
    await Project.updateMany({ isMainOnHome: true }, { $set: { isMainOnHome: false } });
    if (id) {
      const updated = await Project.findByIdAndUpdate(
        id,
        { isMainOnHome: true, featured: true },
        { new: true }
      );
      if (!updated) return { ok: false, error: "Project not found" };
    }
    revalidatePath("/");
    revalidatePath("/admin/projects");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update" };
  }
}

/**
 * Set or clear the pinned project for a category. At most one project per
 * category can be pinned at a time — when you pin project X (in category Y),
 * any previously-pinned project in category Y is unpinned automatically.
 * Pass `makePinned: false` to simply unpin the project.
 *
 * The pinned project appears first in its category on the /projects page.
 */
export async function setPinnedProject(
  id: string,
  makePinned: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    await connectDB();
    const project = await Project.findById(id).select("category").lean();
    if (!project) return { ok: false, error: "Project not found" };

    if (makePinned) {
      // Clear pinning on every other project in the same category, then pin this one.
      await Project.updateMany(
        { category: project.category, isPinned: true, _id: { $ne: id } },
        { $set: { isPinned: false } }
      );
      await Project.findByIdAndUpdate(id, { isPinned: true });
    } else {
      await Project.findByIdAndUpdate(id, { isPinned: false });
    }
    revalidatePath("/projects");
    revalidatePath("/admin/projects");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update" };
  }
}
