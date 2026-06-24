"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  Image as ImageIcon,
  MessageSquareQuote,
  Settings,
  Briefcase,
  ExternalLink,
  Users,
  Receipt,
  LogOut,
  Activity,
  Calendar,
  BarChart3,
  Heart,
  GitPullRequestArrow,
  MessageCircle,
  Info,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/admin/sidebar-shell";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: MessageCircle },
  { href: "/admin/health", label: "Client Health", icon: Heart },
  { href: "/admin/revisions", label: "Revisions", icon: GitPullRequestArrow },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  // Files page removed — the Media page covers the same job.
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/calendar", label: "Calendar", icon: Calendar },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/services", label: "Services", icon: Briefcase },
  { href: "/admin/home", label: "Home Page", icon: Home },
  { href: "/admin/about", label: "About Page", icon: Info },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden lg:flex fixed top-0 left-0 bottom-0 bg-ink-950 border-r border-ink-800 flex-col z-40 transition-[width] duration-300 ease-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand — collapses to just the rotating square */}
      <Link
        href="/admin"
        className={cn(
          "group flex items-center h-20 border-b border-ink-800 overflow-hidden",
          collapsed ? "justify-center px-0" : "gap-3 px-6"
        )}
      >
        <div className="relative h-9 w-9 grid place-items-center flex-shrink-0">
          <span className="absolute inset-0 bg-fire rounded-sm rotate-45 group-hover:rotate-[225deg] transition-transform duration-700" />
          <span className="relative font-display font-bold text-bone text-sm z-10">A</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display font-medium tracking-tight text-sm truncate">Visuals by Abd</p>
            <p className="text-xs text-bone-400 truncate">Admin</p>
          </div>
        )}
      </Link>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="px-3 mb-3 text-xs uppercase tracking-[0.2em] text-bone-400">Manage</p>
        )}
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  // When collapsed, the native `title` tooltip shows the full label on hover —
                  // gives discoverability without a custom tooltip system.
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center rounded-sm text-sm transition-colors relative",
                    collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
                    active
                      ? "bg-ink-800 text-bone"
                      : "text-bone-300 hover:text-bone hover:bg-ink-900"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-fire rounded-r" />
                  )}
                  <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer — view-live + sign-out, plus the collapse toggle */}
      <div className="border-t border-ink-800 p-3 space-y-1">
        <Link
          href="/"
          target="_blank"
          title={collapsed ? "View live site" : undefined}
          className={cn(
            "flex items-center rounded-sm text-sm text-bone-300 hover:text-fire hover:bg-ink-900 transition-colors",
            collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5"
          )}
        >
          <ExternalLink className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          {!collapsed && <span className="truncate">View live site</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "flex items-center rounded-sm text-sm text-bone-300 hover:text-fire hover:bg-fire/5 transition-colors",
            collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5 w-full"
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          {!collapsed && <span className="truncate">Sign out</span>}
        </button>

        {/* Collapse toggle — visually distinct from nav items */}
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mt-2 flex items-center rounded-sm text-xs text-bone-400 hover:text-bone hover:bg-ink-900 transition-colors border-t border-ink-800 pt-3",
            collapsed ? "justify-center h-10 w-10 mx-auto border-t-0 pt-0 mt-1" : "gap-3 px-3 py-2.5 w-full"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
          )}
          {!collapsed && <span className="truncate">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
