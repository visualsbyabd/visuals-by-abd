import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { sendEmail, magicLinkEmail } from "@/lib/email";

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

    // Always return success — never reveal existence
    if (!user) return NextResponse.json({ ok: true });

    await VerificationToken.deleteMany({ email: normalizedEmail, kind: "magic_link" });

    const rawToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await VerificationToken.create({
      email: normalizedEmail,
      tokenHash,
      kind: "magic_link",
      expiresAt,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const signInUrl = `${baseUrl}/magic-callback?token=${rawToken}`;

    const { html, text } = magicLinkEmail({ name: user.name, signInUrl });
    await sendEmail({
      to: normalizedEmail,
      subject: "Your Visuals by Abd sign-in link",
      html,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[magic-link]", e);
    return NextResponse.json({ ok: true });
  }
}
