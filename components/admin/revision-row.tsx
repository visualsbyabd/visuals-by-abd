"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  AlertCircle,
  GitPullRequestArrow,
  CheckCircle2,
  Clock,
  Wrench,
  Circle,
} from "lucide-react";
import { updateRevision, deleteRevision } from "@/features/revisions/actions";

export type AdminRevision = {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_review" | "working" | "resolved" | "closed";
  project: string;
  projectTitle: string;
  clientName: string;
  createdAt: string;
  commentsCount: number;
  attachmentsCount: number;
};

const STATUS_META = {
  open: { label: "Open", icon: Circle, color: "text-fire border-fire/40 bg-fire/5" },
  in_review: { label: "In Review", icon: Clock, color: "text-bone-300 border-bone-300/40 bg-ink-900" },
  working: { label: "Working", icon: Wrench, color: "text-fire border-fire/40 bg-fire/10" },
  resolved: { label: "Resolved", icon: CheckCircle2, color: "text-fire border-fire/60 bg-fire/10" },
  closed: { label: "Closed", icon: CheckCircle2, color: "text-bone-400 border-ink-700 bg-ink-900" },
} as const;

const PRIORITY_STYLES = {
  low: "text-bone-400 border-ink-700",
  medium: "text-bone-300 border-ink-700",
  high: "text-fire border-fire/40 bg-fire/5",
} as const;

export function RevisionRow({ revision }: { revision: AdminRevision }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const meta = STATUS_META[revision.status];
  const Icon = meta.icon;

  async function onDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (
      !window.confirm(
        `Delete revision "${revision.title}"?\n\nThis removes the revision and every comment + attachment on it. This can't be undone.`
      )
    )
      return;
    setBusy(true);
    const res = await deleteRevision(revision._id);
    setBusy(false);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/admin/projects/${revision.project}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(`/admin/projects/${revision.project}`);
          }
        }}
        className={`flex items-start gap-4 p-5 hover:bg-ink-950 transition-colors group cursor-pointer ${
          busy ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <span className={`mt-0.5 flex-shrink-0 h-8 w-8 rounded-full grid place-items-center border ${meta.color}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-medium truncate group-hover:text-fire transition-colors">{revision.title}</p>
            <span className={`text-[10px] px-2 py-0.5 border rounded-full uppercase tracking-wider ${PRIORITY_STYLES[revision.priority]}`}>
              {revision.priority}
            </span>
            <span className={`text-[10px] px-2 py-0.5 border rounded-full uppercase tracking-wider ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          <p className="text-sm text-bone-400 line-clamp-1">{revision.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-bone-400 flex-wrap">
            <span>{revision.clientName}</span>
            <span>·</span>
            <span>{revision.projectTitle}</span>
            <span>·</span>
            <time>
              {new Date(revision.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </time>
            {revision.commentsCount > 0 && (
              <>
                <span>·</span>
                <span>
                  {revision.commentsCount} {revision.commentsCount === 1 ? "reply" : "replies"}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 mt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            disabled={busy}
            title="Edit"
            className="p-2 rounded-sm text-bone-300 hover:bg-ink-800 hover:text-fire transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            title="Delete"
            className="p-2 rounded-sm text-bone-300 hover:bg-fire/10 hover:text-fire transition-colors"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {editing && (
        <EditRevisionModal
          revision={revision}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function EditRevisionModal({
  revision,
  onClose,
  onSaved,
}: {
  revision: AdminRevision;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(revision.title);
  const [description, setDescription] = useState(revision.description);
  const [priority, setPriority] = useState<AdminRevision["priority"]>(revision.priority);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function save() {
    setError(null);
    if (title.trim().length < 2) return setError("Title must be at least 2 characters");
    startSaving(async () => {
      const res = await updateRevision(revision._id, {
        title: title.trim(),
        description: description.trim(),
        priority,
      });
      if (res.ok) onSaved();
      else setError(res.error);
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-ink/85 backdrop-blur grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 border border-ink-800 rounded-sm w-full max-w-xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">— Edit revision</p>
            <p className="text-xs text-bone-400">
              On {revision.projectTitle} · for {revision.clientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-bone-400 hover:text-fire hover:bg-ink-900 rounded-sm transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-ink-700 h-11 text-sm focus:outline-none focus:border-fire"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 resize-none leading-relaxed"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">Priority</label>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-3 py-2 text-xs uppercase tracking-wider border rounded-sm transition-colors ${
                  priority === p
                    ? "border-fire text-fire bg-fire/10"
                    : "border-ink-700 text-bone-300 hover:border-bone-300"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-fire">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-ink-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-bone-300 hover:text-bone transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow disabled:opacity-50 text-bone px-5 py-2.5 rounded-full text-sm font-medium transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="border border-ink-800 rounded-sm p-16 text-center">
      <GitPullRequestArrow className="h-10 w-10 text-bone-400 mx-auto mb-4" strokeWidth={1.5} />
      <p className="text-bone-300">No revisions logged yet.</p>
      <p className="text-xs text-bone-400 mt-2">
        Clients can submit revisions from their portal, or you can log them per project.
      </p>
    </div>
  );
}
