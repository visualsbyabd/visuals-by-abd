"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  MessageCircle,
  Receipt,
  ExternalLink,
  LogOut,
  Activity,
  Calendar,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/portal", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/portal/projects", label: "Projects", icon: FolderKanban },
  { href: "/portal/files", label: "Files", icon: Folder },
  { href: "/portal/activity", label: "Activity", icon: Activity },
  { href: "/portal/calendar", label: "Calendar", icon: Calendar },
  { href: "/portal/invoices", label: "Invoices", icon: Receipt },
];

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-ink-950 border-r border-ink-800 flex-col z-40">
      {/* Brand */}
      <Link
        href="/portal"
        className="group flex items-center gap-3 h-20 px-6 border-b border-ink-800"
      >
        <div className="relative h-9 w-9 grid place-items-center flex-shrink-0">
          <span className="absolute inset-0 bg-fire rounded-sm rotate-45 group-hover:rotate-[225deg] transition-transform duration-700" />
          <span className="relative font-display font-bold text-bone text-sm z-10">A</span>
        </div>
        <div className="min-w-0">
          <p className="font-display font-medium tracking-tight text-sm truncate">Visuals by Abd</p>
          <p className="text-xs text-fire truncate">Client Portal</p>
        </div>
      </Link>

      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        <p className="px-3 mb-3 text-xs uppercase tracking-[0.2em] text-bone-400">Your Account</p>
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors relative",
                    active
                      ? "bg-ink-800 text-bone"
                      : "text-bone-300 hover:text-bone hover:bg-ink-900"
                  )}
                >
                  {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-fire rounded-r" />}
                  <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-ink-800 p-3 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-bone-300 hover:text-fire hover:bg-ink-900 transition-colors"
        >
          <ExternalLink className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          <span>Visit website</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-bone-300 hover:text-fire hover:bg-fire/5 transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
