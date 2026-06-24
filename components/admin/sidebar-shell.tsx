"use client";

import { createContext, useContext, useEffect, useState } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "admin-sidebar-collapsed";

/**
 * Lives at the root of the admin layout. Holds the collapse state so the
 * sidebar and the main content area can both subscribe — the sidebar shrinks,
 * and the main content's left margin shrinks with it, in sync.
 *
 * State persists in localStorage so it survives page reloads.
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Default to expanded on first ever load. We can't read localStorage during
  // SSR so we lazy-init on the client via useEffect to avoid hydration mismatch.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      // localStorage might be unavailable (incognito quirks, etc.); fall back to expanded.
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Same as above — silently fail; collapse still works for the session.
      }
      return next;
    });
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    // Safe fallback so a misplaced consumer doesn't crash the page.
    return { collapsed: false, toggle: () => {} };
  }
  return ctx;
}

/**
 * The wrapper for the main content area. Subscribes to the sidebar collapse
 * state and shrinks its left margin accordingly. Equivalent to the static
 * `lg:ml-64` that was on the layout div before sidebar collapsing existed.
 */
export function SidebarLayoutShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`flex-1 flex flex-col min-w-0 transition-[margin-left] duration-300 ease-out ${
        collapsed ? "lg:ml-16" : "lg:ml-64"
      }`}
    >
      {children}
    </div>
  );
}
