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
 * NOTE: the `authorized` callback was removed deliberately. Auth.js v5 beta-25
 * used it to trigger automatic redirects to the signIn page, which caused
 * production redirect loops (the /login page kept redirecting to itself).
 * All routing decisions now live in middleware.ts, which uses getToken()
 * directly and never delegates redirect behavior back to Auth.js.
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
    // Explicitly always-allow. Without this, Auth.js v5 beta-25 has a default
    // behavior in some code paths that redirects unauthenticated requests to
    // the signIn page. Returning true unconditionally tells Auth.js: "trust
    // the middleware to handle routing; never auto-redirect on my behalf."
    authorized() {
      return true;
    },
  },
} satisfies NextAuthConfig;
