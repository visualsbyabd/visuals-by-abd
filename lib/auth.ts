import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "@/lib/auth.config";

/**
 * Full auth instance — Node runtime only.
 * Imports mongoose + bcrypt, so must NEVER be imported from middleware.
 *
 * Two credentials providers:
 *   - "credentials" — email + password
 *   - "magic"       — email + token (single-use, 15-minute magic link)
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email }).lean();
        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.password);
        if (!ok) return null;

        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          clientId: user.client ? String(user.client) : undefined,
        };
      },
    }),
    Credentials({
      id: "magic",
      name: "Magic link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.token;
        if (!token || typeof token !== "string") return null;

        await connectDB();
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const record = await VerificationToken.findOne({
          tokenHash,
          kind: "magic_link",
        });
        if (!record || record.usedAt || record.expiresAt < new Date()) return null;

        const user = await User.findOne({ email: record.email }).lean();
        if (!user) return null;

        // Mark token used immediately so it can't be replayed
        record.usedAt = new Date();
        await record.save();

        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          clientId: user.client ? String(user.client) : undefined,
        };
      },
    }),
  ],
});
