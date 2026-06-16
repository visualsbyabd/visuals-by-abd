"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Setting } from "@/models/Setting";
import { auth } from "@/lib/auth";

export async function updateSettings(
  data: Record<string, string | undefined>
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user) return { ok: false, error: "Unauthorized" };

    await connectDB();
    await Setting.findOneAndUpdate({ key: "global" }, data, { upsert: true, new: true });

    // Invalidate the tagged cache used by getSiteSettings() — this is what
    // makes every public consumer see fresh data, anywhere on the site.
    revalidateTag("settings");

    // Also revalidate the whole layout tree so pages that render in dynamic
    // mode pick up immediately (no waiting for the next request).
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}
