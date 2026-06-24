"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  X,
  AlertCircle,
  Loader2,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Film,
  Trash2,
  ChevronRight,
  Flag,
  CheckCircle2,
  Clock,
  Wrench,
  Circle,
  XCircle,
  Pencil,
  Save,
} from "lucide-react";
import {
  createRevision,
  updateRevisionStatus,
  addRevisionComment,
  deleteRevision,
  updateRevision,
} from "@/features/revisions/actions";

export type RevisionAttachment = {
  url: string;
  name: string;
  type: "image" | "video" | "document";
  size?: number;
};

export type RevisionComment = {
  user: { _id: string; name: string; role: string };
  body: string;
  createdAt: string;
};

export type Revision = {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_review" | "working" | "resolved" | "closed";
  attachments: RevisionAttachment[];
  comments: RevisionComment[];
  createdBy: { _id: string; name: string; role: string };
  createdAt: string;
  resolvedAt?: string;
};

const STATUS_META = {
  open: { label: "Open", icon: Circle, color: "text-fire border-fire/40 bg-fire/5" },
  in_review: { label: "In Review", icon: Clock, color: "text-bone-300 border-bone-300/40 bg-ink-900" },
  working: { label: "Working", icon: Wrench, color: "text-fire border-fire/40 bg-fire/10" },
  resolved: { label: "Resolved", icon: CheckCircle2, color: "text-fire border-fire/60 bg-fire/10" },
  closed: { label: "Closed", icon: CheckCircle2, color: "text-bone-400 border-ink-700 bg-ink-900" },
} as const;

const PRIORITY_STYLES: Record<Revision["priority"], string> = {
  low: "text-bone-400 border-ink-700",
  medium: "text-bone-300 border-ink-700",
  high: "text-fire border-fire/40 bg-fire/5",
};

export function RevisionsPanel({
  projectId,
  revisions,
  canManage,
  currentUserId,
}: {
  projectId: string;
  revisions: Revision[];
  canManage: boolean; // true for staff
  currentUserId: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<Revision | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const openCount = revisions.filter((r) => r.status === "open" || r.status === "in_review" || r.status === "working").length;

  async function quickClose(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setClosingId(id);
    await updateRevisionStatus(id, "closed");
    setClosingId(null);
    router.refresh();
  }

  return (
    <section className="border border-ink-800 rounded-sm">
      <header className="flex items-center justify-between p-6 border-b border-ink-800">
        <div>
          <h2 className="font-display text-lg font-medium">Revisions</h2>
          <p className="text-xs text-bone-400 mt-1">
            {revisions.length === 0
              ? "No revisions yet"
              : `${openCount} open · ${revisions.length} total`}
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow text-bone px-4 py-2 rounded-full text-sm font-medium transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          New revision
        </button>
      </header>

      {revisions.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-bone-300 mb-1">No revisions logged.</p>
          <p className="text-xs text-bone-400">
            {canManage ? "Clients can submit revisions here, or you can log one for them." : "Spot something to change? Log a revision."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-800">
          {revisions.map((r) => {
            const meta = STATUS_META[r.status];
            const Icon = meta.icon;
            const isOpenable = r.status === "open" || r.status === "in_review" || r.status === "working";
            const canQuickClose = canManage && isOpenable;
            const isClosing = closingId === r._id;
            return (
              <li key={r._id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpen(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpen(r);
                    }
                  }}
                  className={`w-full flex items-start gap-4 p-5 hover:bg-ink-950 transition-colors text-left group cursor-pointer ${isClosing ? "opacity-50" : ""}`}
                >
                  <span className={`mt-0.5 flex-shrink-0 h-8 w-8 rounded-full grid place-items-center border ${meta.color}`}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium truncate">{r.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 border rounded-full uppercase tracking-wider ${PRIORITY_STYLES[r.priority]}`}>
                        {r.priority}
                      </span>
                    </div>
                    <p className="text-sm text-bone-400 line-clamp-1">{r.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-bone-400">
                      <span>{r.createdBy.name}</span>
                      <span>·</span>
                      <time>{new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
                      {r.attachments.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            {r.attachments.length}
                          </span>
                        </>
                      )}
                      {r.comments.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{r.comments.length} {r.comments.length === 1 ? "reply" : "replies"}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1 flex-shrink-0">
                    {canQuickClose && (
                      <button
                        type="button"
                        onClick={(e) => quickClose(e, r._id)}
                        disabled={isClosing}
                        title="Close this revision"
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-ink-700 hover:border-fire hover:text-fire hover:bg-fire/5 rounded-full transition-colors disabled:opacity-50"
                      >
                        {isClosing ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                        Close
                      </button>
                    )}
                    <ChevronRight className="h-4 w-4 text-bone-400 group-hover:text-fire transition-colors" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {creating && (
        <NewRevisionModal
          projectId={projectId}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}

      {open && (
        <RevisionDetailModal
          revision={open}
          canManage={canManage}
          currentUserId={currentUserId}
          onClose={() => setOpen(null)}
          onChanged={() => router.refresh()}
          onDeleted={() => {
            setOpen(null);
            router.refresh();
          }}
        />
      )}
    </section>
  );
}

function NewRevisionModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Revision["priority"]>("medium");
  const [attachments, setAttachments] = useState<RevisionAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "revisions");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        let type: RevisionAttachment["type"] = "document";
        if (file.type.startsWith("image/")) type = "image";
        else if (file.type.startsWith("video/")) type = "video";
        setAttachments((prev) => [
          ...prev,
          { url: data.url, name: file.name, type, size: file.size },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setError(null);
    if (!title.trim()) return setError("Title required");
    if (!description.trim()) return setError("Description required");

    setSaving(true);
    const res = await createRevision({
      project: projectId,
      title: title.trim(),
      description: description.trim(),
      priority,
      attachments,
    });
    setSaving(false);
    if (res.ok) onCreated();
    else setError(res.error);
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 border border-ink-800 rounded-sm max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-ink-800">
          <h3 className="font-display text-lg">New revision</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center hover:bg-ink-900 rounded-sm">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="e.g. Logo color is too desaturated"
              className="w-full bg-transparent border-0 border-b border-ink-700 h-12 text-base focus:outline-none focus:border-fire"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What needs to change and why?"
              className="w-full bg-ink-900 border border-ink-800 px-4 py-3 text-sm rounded-sm focus:outline-none focus:border-fire/40 resize-none"
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
                  className={`text-xs px-3 py-2 border rounded-sm uppercase tracking-wider transition-colors capitalize ${
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

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">Attachments</label>
            {attachments.length > 0 && (
              <ul className="space-y-1.5 mb-2">
                {attachments.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 px-3 py-2 border border-ink-800 rounded-sm">
                    <AttachmentIcon type={a.type} />
                    <span className="text-sm truncate flex-1">{a.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-bone-400 hover:text-fire"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-ink-700 hover:border-fire/40 rounded-sm py-4 transition-all flex items-center justify-center gap-2 text-sm text-bone-300 hover:text-fire"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Attach screenshot or file"}
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 border border-fire/40 bg-fire/5 px-3 py-2 text-xs text-fire rounded-sm">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-ink-800">
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-bone-300 hover:text-bone">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || uploading || !title.trim() || !description.trim()}
            className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow disabled:opacity-50 text-bone px-5 py-2.5 rounded-full text-sm font-medium transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {saving ? "Saving..." : "Log revision"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RevisionDetailModal({
  revision,
  canManage,
  currentUserId,
  onClose,
  onChanged,
  onDeleted,
}: {
  revision: Revision;
  canManage: boolean;
  currentUserId: string;
  onClose: () => void;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);

  // Edit mode for the title/description/priority. Staff-only.
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(revision.title);
  const [editDescription, setEditDescription] = useState(revision.description);
  const [editPriority, setEditPriority] = useState<Revision["priority"]>(revision.priority);
  const [editError, setEditError] = useState<string | null>(null);

  const meta = STATUS_META[revision.status];
  const Icon = meta.icon;

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSending(true);
    await addRevisionComment(revision._id, comment);
    setSending(false);
    setComment("");
    onChanged();
  }

  async function transition(status: Revision["status"]) {
    setBusy(true);
    await updateRevisionStatus(revision._id, status);
    setBusy(false);
    onChanged();
  }

  async function remove() {
    if (!confirm(`Delete revision "${revision.title}"?`)) return;
    setBusy(true);
    await deleteRevision(revision._id);
    setBusy(false);
    onDeleted();
  }

  async function saveEdit() {
    setEditError(null);
    if (editTitle.trim().length < 2) {
      setEditError("Title must be at least 2 characters");
      return;
    }
    setBusy(true);
    const res = await updateRevision(revision._id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
    });
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      onChanged();
    } else {
      setEditError(res.error);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setEditTitle(revision.title);
    setEditDescription(revision.description);
    setEditPriority(revision.priority);
    setEditError(null);
  }

  const staffActions: Revision["status"][] = ["in_review", "working", "resolved", "closed"];
  const clientCanReopen = !canManage && (revision.status === "resolved" || revision.status === "closed");

  return (
    <div
      className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 border border-ink-800 rounded-sm max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-ink-800">
          <div className="flex-1 min-w-0">
            {!editing ? (
              <>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 border rounded-full uppercase tracking-wider ${meta.color}`}>
                    <Icon className="h-3 w-3" strokeWidth={2} />
                    {meta.label}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 border rounded-full uppercase tracking-wider ${PRIORITY_STYLES[revision.priority]}`}>
                    {revision.priority} priority
                  </span>
                </div>
                <h3 className="font-display text-xl leading-tight">{revision.title}</h3>
                <p className="text-xs text-bone-400 mt-2">
                  Logged by {revision.createdBy.name} · {new Date(revision.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-bone-300 mb-1">Title</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                    className="w-full bg-transparent border-0 border-b border-ink-700 h-9 text-base focus:outline-none focus:border-fire"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-bone-300 mb-1">Priority</label>
                  <div className="flex gap-1">
                    {(["low", "medium", "high"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEditPriority(p)}
                        className={`px-3 py-1 text-[10px] uppercase tracking-wider border rounded-full transition-colors ${
                          editPriority === p
                            ? "border-fire text-fire bg-fire/10"
                            : "border-ink-700 text-bone-300 hover:border-bone-300"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                {editError && (
                  <div className="flex items-center gap-1.5 text-xs text-fire">
                    <AlertCircle className="h-3 w-3" />
                    {editError}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {canManage && !editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  disabled={busy}
                  className="p-2 hover:bg-ink-900 rounded-sm text-bone-300 hover:text-fire transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={remove}
                  disabled={busy}
                  className="p-2 hover:bg-fire/10 rounded-sm text-bone-300 hover:text-fire transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            {canManage && editing && (
              <>
                <button
                  onClick={saveEdit}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-fire hover:bg-fire-glow text-bone rounded-full transition-colors disabled:opacity-50"
                  title="Save"
                >
                  {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={busy}
                  className="p-2 hover:bg-ink-900 rounded-sm text-bone-300 hover:text-bone transition-colors"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
            {!editing && (
              <button onClick={onClose} className="h-9 w-9 grid place-items-center hover:bg-ink-900 rounded-sm">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-bone-300 mb-2">Description</p>
            {!editing ? (
              <p className="text-bone-300 whitespace-pre-wrap leading-relaxed">{revision.description}</p>
            ) : (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 resize-none leading-relaxed text-bone-300"
              />
            )}
          </div>

          {revision.attachments.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-bone-300 mb-3">
                Attachments · {revision.attachments.length}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {revision.attachments.map((a, i) => (
                  <a
                    key={i}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative aspect-square bg-ink-900 border border-ink-800 hover:border-fire/40 rounded-sm overflow-hidden transition-colors group"
                  >
                    {a.type === "image" ? (
                      <Image src={a.url} alt={a.name} fill className="object-cover" sizes="200px" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        <AttachmentIcon type={a.type} large />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 to-transparent p-2">
                      <p className="text-[10px] text-bone truncate">{a.name}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status actions */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-bone-300 mb-3">Status</p>
            <div className="flex items-center gap-2 flex-wrap">
              {canManage ? (
                staffActions.map((s) => {
                  const m = STATUS_META[s];
                  const active = revision.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => transition(s)}
                      disabled={busy || active}
                      className={`text-xs px-3 py-1.5 border rounded-full uppercase tracking-wider transition-colors capitalize ${
                        active
                          ? `${m.color} cursor-default`
                          : "border-ink-700 text-bone-300 hover:border-fire hover:text-fire"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })
              ) : clientCanReopen ? (
                <button
                  onClick={() => transition("open")}
                  disabled={busy}
                  className="text-xs px-3 py-1.5 border border-fire text-fire hover:bg-fire/10 rounded-full uppercase tracking-wider transition-colors"
                >
                  Re-open
                </button>
              ) : (
                <p className="text-xs text-bone-400">Studio is reviewing this revision.</p>
              )}
            </div>
          </div>

          {/* Comments */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-bone-300 mb-4">
              Discussion {revision.comments.length > 0 && <span className="text-bone-400 normal-case tracking-normal">· {revision.comments.length}</span>}
            </p>
            {revision.comments.length === 0 ? (
              <p className="text-sm text-bone-400">No replies yet.</p>
            ) : (
              <ul className="space-y-4">
                {revision.comments.map((c, i) => {
                  const isMine = c.user._id === currentUserId;
                  const isStaff = c.user.role !== "client";
                  return (
                    <li key={i} className="flex gap-3">
                      <div
                        className={`h-8 w-8 rounded-full grid place-items-center text-xs font-medium flex-shrink-0 ${
                          isStaff ? "bg-fire/20 border border-fire/40 text-fire" : "bg-ink-800 text-bone"
                        }`}
                      >
                        {c.user.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-bone-400 mb-1">
                          {isMine ? "You" : c.user.name}
                          {!isMine && isStaff && <span className="text-fire ml-2">Studio</span>}
                          <span className="ml-2">
                            {new Date(c.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <form onSubmit={postComment} className="border-t border-ink-800 p-3 flex items-end gap-2 flex-shrink-0">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Reply..."
            rows={1}
            className="flex-1 bg-ink-900 border border-ink-800 px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40 resize-none max-h-32"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                postComment(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={sending || !comment.trim()}
            className="h-10 w-10 grid place-items-center bg-fire hover:bg-fire-glow disabled:opacity-50 rounded-sm transition-all flex-shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}

function AttachmentIcon({ type, large }: { type: RevisionAttachment["type"]; large?: boolean }) {
  const cls = large ? "h-8 w-8 text-bone-400" : "h-4 w-4 text-bone-400";
  if (type === "image") return <ImageIcon className={cls} strokeWidth={1.5} />;
  if (type === "video") return <Film className={cls} strokeWidth={1.5} />;
  return <FileText className={cls} strokeWidth={1.5} />;
}
