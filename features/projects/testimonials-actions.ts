"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Testimonial } from "@/models/Testimonial";
import { auth } from "@/lib/auth";
import { testimonialSchema, type TestimonialInput } from "@/lib/validations";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

export async function upsertTestimonial(
  id: string | null,
  data: TestimonialInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const parsed = testimonialSchema.safeParse(data);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid" };
    }
    await connectDB();
    if (id) {
      await Testimonial.findByIdAndUpdate(id, parsed.data);
    } else {
      await Testimonial.create(parsed.data);
    }
    revalidatePath("/");
    revalidatePath("/admin/testimonials");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteTestimonial(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    await connectDB();
    await Testimonial.findByIdAndDelete(id);
    revalidatePath("/");
    revalidatePath("/admin/testimonials");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
