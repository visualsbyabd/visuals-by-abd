"use client";

import Link from "next/link";
import {
  FolderKanban,
  FileCheck2,
  MessageCircle,
  Receipt,
  Flag,
  ListChecks,
  Upload,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { ActivityType } from "@/models/Activity";

export type ActivityItem = {
  _id: string;
  type: ActivityType;
  actor: { _id: string; name: string; role: string };
  title: string;
  description?: string;
  link?: string;
  project?: { _id: string; title: string };
  client?: { _id: string; name: string };
  createdAt: string;
};

const ICON_MAP: Record<ActivityType, LucideIcon> = {
  project_created: FolderKanban,
  project_updated: FolderKanban,
  project_progress: FolderKanban,
  milestone_completed: Flag,
  deliverable_uploaded: Upload,
  deliverable_approved: CheckCircle2,
  deliverable_changes_requested: XCircle,
  message_posted: MessageCircle,
  task_created: ListChecks,
  task_status_changed: ListChecks,
  task_completed: CheckCircle2,
  task_comment: MessageCircle,
  invoice_sent: Receipt,
  invoice_paid: CheckCircle2,
  file_uploaded: Upload,
};

const ACCENT_TYPES = new Set<ActivityType>([
  "deliverable_approved",
  "invoice_paid",
  "milestone_completed",
  "task_completed",
]);

export function ActivityFeed({
  items,
  showProject = true,
  showClient = false,
  emptyMessage,
}: {
  items: ActivityItem[];
  showProject?: boolean;
  showClient?: boolean;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="border border-ink-800 rounded-sm p-16 text-center">
        <p className="text-bone-300">{emptyMessage ?? "No activity yet."}</p>
      </div>
    );
  }

  // Group by day for visual rhythm
  const groups = new Map<string, ActivityItem[]>();
  for (const item of items) {
    const day = new Date(item.createdAt).toDateString();
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(item);
  }

  return (
    <div className="space-y-12">
      {Array.from(groups.entries()).map(([day, dayItems]) => (
        <div key={day}>
          <p className="eyebrow mb-6 pb-4 border-b border-ink-800">
            — {formatDay(day)}
          </p>
          <ol className="space-y-1">
            {dayItems.map((item) => (
              <ActivityRow
                key={item._id}
                item={item}
                showProject={showProject}
                showClient={showClient}
              />
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function ActivityRow({
  item,
  showProject,
  showClient,
}: {
  item: ActivityItem;
  showProject: boolean;
  showClient: boolean;
}) {
  const Icon = ICON_MAP[item.type] ?? MessageCircle;
  const accent = ACCENT_TYPES.has(item.type);
  const isStaff = item.actor.role !== "client";

  const content = (
    <div className="flex gap-4 px-3 py-4 rounded-sm hover:bg-ink-950 transition-colors group">
      <div
        className={`h-9 w-9 rounded-full grid place-items-center flex-shrink-0 ${
          accent ? "bg-fire/15 text-fire border border-fire/40" : "bg-ink-900 text-bone-300 border border-ink-800"
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span className={`font-medium ${isStaff ? "text-bone" : "text-fire"}`}>
            {item.actor.name}
          </span>{" "}
          <span className="text-bone-300">{item.title.toLowerCase()}</span>
        </p>
        {item.description && (
          <p className="text-xs text-bone-400 mt-1 line-clamp-2 text-pretty">{item.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-bone-400">
          <time>
            {new Date(item.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
          </time>
          {showProject && item.project && (
            <span className="flex items-center gap-1">
              <FolderKanban className="h-3 w-3" />
              {item.project.title}
            </span>
          )}
          {showClient && item.client && (
            <span>· {item.client.name}</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <li>
      {item.link ? (
        <Link href={item.link} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </li>
  );
}

function formatDay(dayString: string): string {
  const date = new Date(dayString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
