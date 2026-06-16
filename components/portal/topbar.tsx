"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, LogOut, User as UserIcon } from "lucide-react";
import { NotificationBell } from "@/components/portal/notifications-bell";
import { GlobalSearch } from "@/components/global-search";

type PortalUser = {
  name?: string | null;
  email?: string | null;
  role?: string;
};

export function PortalTopbar({ user, unreadCount }: { user: PortalUser; unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="h-20 border-b border-ink-800 bg-ink-950 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 backdrop-blur-sm gap-4">
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="h-2 w-2 rounded-full bg-fire animate-glow-pulse" />
        <p className="text-sm text-bone-300 hidden sm:block">
          <span className="text-bone-400">Welcome back,</span> {user.name?.split(" ")[0] ?? "there"}
        </p>
      </div>

      <div className="flex-1 max-w-md">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <NotificationBell initialUnreadCount={unreadCount} />

        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-ink-900 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-fire/20 border border-fire/40 grid place-items-center">
              <UserIcon className="h-4 w-4 text-fire" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-tight">{user.name ?? "Client"}</p>
              <p className="text-xs text-bone-400">{user.email}</p>
            </div>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-ink-900 border border-ink-800 rounded-sm shadow-2xl py-2 z-50">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-bone-300 hover:bg-ink-800 hover:text-fire transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
