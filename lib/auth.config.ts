import type { NextAuthConfig, DefaultSession } from "next-auth";

export type AppRole = "admin" | "editor" | "client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      clientId?: string;
    } & DefaultSession["user"];
  }
  interface User {
    role?: AppRole;
    clientId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    clientId?: string;
  }
}

/**
 * Edge-safe auth config — NO Node-only imports.
 * The Credentials provider with DB lookup is added in lib/auth.ts (Node runtime).
 *
 * The `authorized` callback only checks login state. Role-based routing
 * (e.g., clients shouldn't see /admin) is handled in middleware.ts so we can
 * redirect to the right place per role.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user.role ?? "client") as AppRole;
        token.clientId = user.clientId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AppRole;
        session.user.clientId = token.clientId as string | undefined;
      }
      return session;
    },
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const isProtected = path.startsWith("/admin") || path.startsWith("/portal");
      // For protected paths, require login. Role-specific routing in middleware.
      if (isProtected) return !!auth?.user;
      return true;
    },
  },
} satisfies NextAuthConfig;
