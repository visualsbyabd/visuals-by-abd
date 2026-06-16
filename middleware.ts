import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAdminPath = path.startsWith("/admin");
  const isPortalPath = path.startsWith("/portal");

  // Not logged in trying to access protected area → /login
  if ((isAdminPath || isPortalPath) && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  // Clients shouldn't access /admin → send to their portal
  if (isAdminPath && role === "client") {
    return NextResponse.redirect(new URL("/portal", req.nextUrl));
  }

  // Already logged in on /login → route to correct landing
  if (path === "/login" && isLoggedIn) {
    const target = role === "client" ? "/portal" : "/admin";
    return NextResponse.redirect(new URL(target, req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/login"],
};
