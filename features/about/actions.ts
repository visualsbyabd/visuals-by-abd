"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { AboutPage } from "@/models/AboutPage";
import { requireStaff } from "@/lib/portal-utils";

export async function updateAboutPage(
  data: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    await AboutPage.findOneAndUpdate({ key: "global" }, data, { upsert: true, new: true });
    revalidateTag("about-page");
    revalidatePath("/about");
    revalidatePath("/admin/about");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
