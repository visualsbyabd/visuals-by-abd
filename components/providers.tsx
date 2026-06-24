"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

/**
 * Wraps the app in next-auth's SessionProvider.
 *
 * IMPORTANT: Auth.js v5 (beta) requires the initial session to be passed in as
 * a prop. Without it, useSession() can return undefined in production builds
 * before its first hydration fetch resolves — which then crashes anything that
 * tries to destructure { data } off the hook. Pass `session` from the root
 * layout (a server component that calls `auth()`).
 */
export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
