"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MessageCircle, Search, Inbox, Archive, AtSign, ChevronRight, Filter } from "lucide-react";
import type { ConversationCard } from "@/app/admin/messages/page";

type Filter = "inbox" | "unread" | "archived" | "assigned";

export function MessagesInbox({ conversations }: { conversations: ConversationCard[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("inbox");

  const counts = useMemo(
    () => ({
      inbox: conversations.filter((c) => !c.archived).length,
      unread: conversations.filter((c) => !c.archived && c.unread).length,
      archived: conversations.filter((c) => c.archived).length,
      assigned: conversations.filter((c) => !c.archived && c.assignedTo).length,
    }),
    [conversations]
  );

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (filter === "inbox" && c.archived) return false;
      if (filter === "unread" && (c.archived || !c.unread)) return false;
      if (filter === "archived" && !c.archived) return false;
      if (filter === "assigned" && (c.archived || !c.assignedTo)) return false;
      if (q) {
        const needle = q.toLowerCase();
        return (
          c.projectTitle.toLowerCase().includes(needle) ||
          c.lastMessage.toLowerCase().includes(needle) ||
          c.clientName?.toLowerCase().includes(needle) ||
          c.clientCompany?.toLowerCase().includes(needle)
        );
      }
      return true;
    });
  }, [conversations, q, filter]);

  return (
    <div>
      <div className="mb-10 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="eyebrow mb-3">— Studio</p>
          <h1 className="display-md text-balance">Messages</h1>
          <p className="text-bone-300 mt-2">
            {counts.unread > 0
              ? `${counts.unread} unread conversation${counts.unread === 1 ? "" : "s"}`
              : "Inbox zero. Nicely done."}
          </p>
        </div>
      </div>

      {/* Filters + search */}
      <div className="border border-ink-800 rounded-sm p-4 mb-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bone-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by client, project, or message..."
              className="w-full bg-ink-900 border border-ink-800 pl-10 pr-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40 transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <FilterPill icon={Inbox} label="Inbox" count={counts.inbox} active={filter === "inbox"} onClick={() => setFilter("inbox")} />
          <FilterPill icon={MessageCircle} label="Unread" count={counts.unread} active={filter === "unread"} onClick={() => setFilter("unread")} highlight={counts.unread > 0} />
          <FilterPill icon={AtSign} label="Assigned to me" count={counts.assigned} active={filter === "assigned"} onClick={() => setFilter("assigned")} />
          <FilterPill icon={Archive} label="Archived" count={counts.archived} active={filter === "archived"} onClick={() => setFilter("archived")} />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="border border-ink-800 rounded-sm p-16 text-center">
          <Inbox className="h-10 w-10 text-bone-400 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-bone-300">
            {q
              ? "No conversations match your search."
              : filter === "inbox"
              ? "No conversations yet."
              : filter === "unread"
              ? "All caught up."
              : filter === "archived"
              ? "Nothing archived."
              : "No assigned conversations."}
          </p>
        </div>
      ) : (
        <div className="border border-ink-800 rounded-sm divide-y divide-ink-800">
          {filtered.map((c) => (
            <Link
              key={c.projectId}
              href={`/admin/messages/${c.projectId}`}
              className={`flex items-start gap-4 p-5 hover:bg-ink-950 transition-colors group ${c.unread ? "bg-fire/[0.02]" : ""}`}
            >
              {/* Avatar */}
              <div
                className={`h-10 w-10 rounded-full grid place-items-center text-sm font-medium flex-shrink-0 ${
                  c.lastSenderRole === "client" ? "bg-ink-800 text-bone" : "bg-fire/20 border border-fire/40 text-fire"
                }`}
              >
                {(c.clientName ?? c.lastSender).slice(0, 1).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className={`font-medium truncate ${c.unread ? "text-bone" : "text-bone-300"}`}>
                    {c.clientName ?? c.lastSender}
                    {c.clientCompany && <span className="text-bone-400 font-normal"> · {c.clientCompany}</span>}
                  </p>
                  {c.unread && c.unreadCount > 0 && (
                    <span className="bg-fire text-bone text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                      {c.unreadCount} new
                    </span>
                  )}
                  {c.archived && (
                    <span className="text-[10px] px-2 py-0.5 border border-ink-700 text-bone-400 rounded-full uppercase tracking-wider">
                      Archived
                    </span>
                  )}
                </div>
                <p className="text-xs text-bone-400 mb-1.5">
                  on <span className="text-fire">{c.projectTitle}</span>
                  {c.assignedTo && <span> · assigned to {c.assignedTo.name}</span>}
                </p>
                <p className={`text-sm line-clamp-1 ${c.unread ? "text-bone" : "text-bone-400"}`}>
                  <span className="text-bone-400">{c.lastSender}: </span>
                  {c.lastMessage}
                </p>
              </div>

              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <time className="text-xs text-bone-400">{relativeTime(c.lastAt)}</time>
                <ChevronRight className="h-4 w-4 text-bone-400 group-hover:text-fire transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  icon: Icon,
  label,
  count,
  active,
  highlight,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  count: number;
  active: boolean;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-full border transition-colors ${
        active
          ? "border-fire text-fire bg-fire/10"
          : highlight && count > 0
          ? "border-fire/40 text-fire/90 bg-fire/[0.03] hover:border-fire"
          : "border-ink-700 text-bone-300 hover:border-bone-300"
      }`}
    >
      <Icon className="h-3 w-3" strokeWidth={1.75} />
      {label}
      <span className={`font-mono ${active ? "text-fire" : "text-bone-400"}`}>{count}</span>
    </button>
  );
}

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diff = (now - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
