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
