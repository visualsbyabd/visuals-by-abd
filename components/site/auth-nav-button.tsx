"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowUpRight, LogIn, LayoutDashboard } from "lucide-react";

export function AuthNavButton({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  // Defensive call: in some Auth.js v5 beta versions, useSession() can return
  // undefined entirely (not { data: undefined, status: "loading" } as in v4).
  // The optional chain below treats that exactly like a still-loading session,
  // which is the safe default — the button just renders the loading skeleton.
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const status = sessionResult?.status ?? "loading";

  // Loading — render a placeholder of the same shape so layout doesn't jump
  if (status === "loading") {
    return (
      <span
        className={
          variant === "desktop"
            ? "hidden md:inline-flex items-center gap-2 text-sm border border-ink-700 px-5 py-2.5 rounded-full opacity-40"
            : "inline-flex items-center gap-2 text-sm border border-ink-700 px-5 py-3 rounded-full opacity-40"
        }
      >
        <span className="h-3 w-3" />
        <span className="w-12" />
      </span>
    );
  }

  if (session?.user) {
    const target = session.user.role === "client" ? "/portal" : "/admin";
    const label = session.user.role === "client" ? "My Dashboard" : "Admin Dashboard";

    if (variant === "mobile") {
      return (
        <Link
          href={target}
          className="inline-flex items-center gap-2 text-sm font-medium bg-fire hover:bg-fire-glow text-bone px-5 py-3 rounded-full transition-all"
        >
          <LayoutDashboard className="h-4 w-4" />
          {label}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      );
    }

    return (
      <Link
        href={target}
        className="hidden md:inline-flex items-center gap-2 text-sm font-medium bg-fire hover:bg-fire-glow text-bone px-5 py-2.5 rounded-full transition-all shadow-[0_0_30px_-10px_rgba(214,40,40,0.6)] group"
      >
        <LayoutDashboard className="h-4 w-4" />
        {label}
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:rotate-45" />
      </Link>
    );
  }

  // Signed out → Login
  if (variant === "mobile") {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm font-medium border border-ink-700 hover:border-fire hover:text-fire px-5 py-3 rounded-full transition-all"
      >
        <LogIn className="h-4 w-4" />
        Client Login
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="hidden md:inline-flex items-center gap-2 text-sm font-medium border border-ink-700 hover:border-fire hover:text-fire px-5 py-2.5 rounded-full transition-all"
    >
      <LogIn className="h-4 w-4" />
      Client Login
    </Link>
  );
}
