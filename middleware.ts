import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Plain Next.js middleware — does NOT wrap with auth() from next-auth.
 *
 * Why not use auth() wrapper:
 *   In Auth.js v5 beta-25, the auth(handler) higher-order function has two
 *   misbehaviors that caused infinite redirect loops in production builds:
 *     1) It can apply to routes outside the matcher in some configurations,
 *        sending `/` through the auth flow and redirecting to /login.
 *     2) Combined with `pages.signIn: "/login"`, the wrapper can redirect
 *        the /login route to itself when no session is present.
 *
 * Solution: read the JWT cookie directly with getToken() and write all the
 * redirect logic explicitly. No wrapper, no callbacks driving redirects.
 * The `authorized` callback in auth.config.ts also no longer drives middleware.
 */
export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAdminPath = path.startsWith("/admin");
  const isPortalPath = path.startsWith("/portal");
  const isLoginPath = path === "/login";

  // Defensive fast-path. If the matcher is somehow including a route that
  // isn't /admin, /portal, or /login (Auth.js beta quirk, future Next.js
  // change, etc.), explicitly do nothing.
  if (!isAdminPath && !isPortalPath && !isLoginPath) {
    return NextResponse.next();
  }

  // Read the JWT cookie. getToken is Edge-safe (no DB calls) and just decodes
  // the cookie with AUTH_SECRET. If the cookie is missing/invalid/expired,
  // returns null — which is exactly what we want for the unauthenticated case.
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    // In production behind https, Auth.js v5 uses __Secure- prefixed cookies.
    secureCookie: process.env.NODE_ENV === "production",
    // Cookie name must match what Auth.js v5 sets in production. v5 uses
    // "authjs.session-token" in dev and "__Secure-authjs.session-token" in prod.
    // getToken auto-detects this when secureCookie is set correctly.
  });

  const isLoggedIn = !!token;
  const role = (token?.role as string | undefined) ?? undefined;

  // Protected paths require login → bounce to /login with `from` so we can
  // route back to the original destination after sign-in.
  if ((isAdminPath || isPortalPath) && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  // Clients trying to view /admin → send them to their portal.
  if (isAdminPath && role === "client") {
    return NextResponse.redirect(new URL("/portal", req.nextUrl));
  }

  // Already logged in and hitting /login → route to their landing.
  // CRITICAL: only redirect when isLoggedIn === true. When false, fall through
  // to NextResponse.next() so the login page renders. The previous bug was
  // Auth.js's wrapper redirecting /login to /login regardless of session state.
  if (isLoginPath && isLoggedIn) {
    return NextResponse.redirect(
      new URL(role === "client" ? "/portal" : "/admin", req.nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware on these paths. Anything else (including / and
  // /projects/*) skips middleware entirely.
  matcher: ["/admin/:path*", "/portal/:path*", "/login"],
};
