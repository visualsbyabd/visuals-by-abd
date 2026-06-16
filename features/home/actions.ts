"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { HomePage } from "@/models/HomePage";
import { requireStaff } from "@/lib/portal-utils";

export async function updateHomePage(
  data: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireStaff();
    await connectDB();
    await HomePage.findOneAndUpdate({ key: "global" }, data, { upsert: true, new: true });
    revalidateTag("home-page");
    revalidatePath("/");
    revalidatePath("/admin/home");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
