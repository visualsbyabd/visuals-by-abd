import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { sendEmail, passwordResetEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();
    const user = await User.findOne({ email: normalizedEmail });

    // Always return success — never reveal whether an email exists
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Invalidate any prior tokens for this email
    await VerificationToken.deleteMany({ email: normalizedEmail, kind: "password_reset" });

    // Generate token: raw goes in email link, only hash stored
    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await VerificationToken.create({
      email: normalizedEmail,
      tokenHash,
      kind: "password_reset",
      expiresAt,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    const { html, text } = passwordResetEmail({ name: user.name, resetUrl });
    await sendEmail({
      to: normalizedEmail,
      subject: "Reset your Visuals by Abd password",
      html,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[forgot-password]", e);
    // Still return ok to avoid leaking failure signal
    return NextResponse.json({ ok: true });
  }
}
