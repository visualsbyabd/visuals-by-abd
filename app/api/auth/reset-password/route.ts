import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    await connectDB();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await VerificationToken.findOne({ tokenHash, kind: "password_reset" });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This reset link has expired or already been used. Request a new one." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: record.email });
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    user.password = await bcrypt.hash(password, 12);
    await user.save();
    record.usedAt = new Date();
    await record.save();

    // Invalidate any other outstanding tokens for this email
    await VerificationToken.deleteMany({
      email: record.email,
      _id: { $ne: record._id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reset-password]", e);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
