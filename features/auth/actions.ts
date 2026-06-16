"use server";

import { signIn, signOut } from "@/lib/auth";
import { contactSchema, type ContactInput } from "@/lib/validations";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Invalid email or password." };
    }
    // Re-throw redirect errors so Next.js can handle them
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function submitContact(
  data: ContactInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: "Please check your inputs and try again." };
  }

  // In production: send via email service, save to DB, post to Slack, etc.
  // For now, log to server console — replace with your delivery mechanism.
  console.log("[contact] new submission:", parsed.data);

  return { ok: true };
}
