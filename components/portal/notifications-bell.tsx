"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { markNotificationsRead } from "@/features/clients/portal-actions";

type Notification = {
  _id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: string;
};

export function NotificationBell({ initialUnreadCount }: { initialUnreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialUnreadCount);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function loadList() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) await loadList();
  }

  async function markAllRead() {
    const res = await markNotificationsRead();
    if (res.ok) {
      setCount(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2.5 rounded-sm hover:bg-ink-900 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-bone-300" strokeWidth={1.75} />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 min-w-[16px] px-1 grid place-items-center rounded-full bg-fire text-bone text-[10px] font-medium">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-ink-900 border border-ink-800 rounded-sm shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800">
            <p className="text-xs uppercase tracking-[0.2em] text-bone-300">Notifications</p>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-fire hover:text-fire-glow flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {loading ? (
              <li className="p-6 text-center text-sm text-bone-400">Loading…</li>
            ) : items.length === 0 ? (
              <li className="p-8 text-center text-sm text-bone-400">No notifications yet.</li>
            ) : (
              items.map((n) => {
                const inner = (
                  <div
                    className={`px-4 py-3 border-b border-ink-800 last:border-b-0 hover:bg-ink-800 transition-colors ${
                      !n.read ? "bg-fire/[0.03]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!n.read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-fire flex-shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        {n.body && <p className="text-xs text-bone-400 mt-1 line-clamp-2">{n.body}</p>}
                        <p className="text-xs text-bone-400 mt-1.5">
                          {new Date(n.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
                return (
                  <li key={n._id}>
                    {n.link ? (
                      <Link href={n.link} onClick={() => setOpen(false)}>{inner}</Link>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
