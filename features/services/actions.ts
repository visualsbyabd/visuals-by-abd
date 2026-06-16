"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Service } from "@/models/Service";
import { requireStaff } from "@/lib/portal-utils";

export type ServiceInput = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  icon: string;
  deliverables: string[];
  startingPrice?: string;
  active?: boolean;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function revalidateAll() {
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
}

export async function createService(
  data: ServiceInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requireStaff();
    if (!data.title?.trim()) return { ok: false, error: "Title required" };
    if (!data.tagline?.trim()) return { ok: false, error: "Tagline required" };
    if (!data.description?.trim()) return { ok: false, error: "Description required" };
    if (!data.icon?.trim()) return { ok: false, error: "Icon required" };

    await connectDB();
    const slug = slugify(data.slug || data.title);

    // Compute next order
    const last = await Service.findOne().sort({ order: -1 }).select("order").lean();
    const order = (last?.order ?? -1) + 1;

    const service = await Service.create({
      ...data,
      slug,
      deliverables: data.deliverables.filter((d) => d.trim()),
      active: data.active ?? true,
      order,
    });
    revalidateAll();
    return { ok: true, id: String(service._id) };
  } catch (e) {
    if (e instanceof Error && /duplicate key/i.test(e.message)) {
      return { ok: false, error: "A service with this slug already exists" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateService(
  id: string,
  data: ServiceInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    const slug = slugify(data.slug || data.title);
    await Service.findByIdAndUpdate(id, {
      ...data,
      slug,
      deliverables: data.deliverables.filter((d) => d.trim()),
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && /duplicate key/i.test(e.message)) {
      return { ok: false, error: "A service with this slug already exists" };
    }
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteService(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    await Service.findByIdAndDelete(id);
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function reorderServices(
  ids: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    await Promise.all(ids.map((id, order) => Service.findByIdAndUpdate(id, { order })));
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function toggleServiceActive(
  id: string,
  active: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    await Service.findByIdAndUpdate(id, { active });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
