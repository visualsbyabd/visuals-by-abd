"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus,
  Upload,
  Trash2,
  Loader2,
  Check,
  X,
  AlertCircle,
  Film,
  FileText,
  Link2,
  Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  createDeliverable,
  setDeliverableStatus,
  deleteDeliverable,
} from "@/features/clients/deliverables-actions";

type Deliverable = {
  _id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  type: "image" | "video" | "document" | "link";
  status: "draft" | "in_review" | "approved" | "changes_requested";
  feedback?: string;
  version: number;
  createdAt: string;
};

const statusStyles: Record<string, string> = {
  draft: "border-ink-700 text-bone-300 bg-ink-900",
  in_review: "border-fire/40 text-fire bg-fire/5",
  approved: "border-fire/40 text-fire bg-fire/10",
  changes_requested: "border-fire text-fire bg-fire/10",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  in_review: "Awaiting review",
  approved: "Approved",
  changes_requested: "Changes requested",
};

export function ProjectDeliverablesPanel({
  projectId,
  deliverables,
}: {
  projectId: string;
  deliverables: Deliverable[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <section className="border border-ink-800 rounded-sm">
      <header className="flex items-center justify-between p-6 border-b border-ink-800">
        <div>
          <h2 className="font-display text-lg font-medium">Deliverables</h2>
          <p className="text-xs text-bone-400 mt-1">
            Files clients can preview and approve from the portal
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow text-bone px-4 py-2 rounded-full text-sm font-medium transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </header>

      {deliverables.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-bone-300 mb-2">No deliverables yet.</p>
          <p className="text-xs text-bone-400">Upload one to share with the client.</p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-800">
          {deliverables.map((d) => (
            <DeliverableRow key={d._id} deliverable={d} onChange={() => router.refresh()} />
          ))}
        </ul>
      )}

      {addOpen && (
        <AddDeliverableModal
          projectId={projectId}
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            router.refresh();
          }}
        />
      )}
    </section>
  );
}

function DeliverableRow({
  deliverable,
  onChange,
}: {
  deliverable: Deliverable;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function sendToReview() {
    setBusy(true);
    await setDeliverableStatus(deliverable._id, "in_review");
    setBusy(false);
    onChange();
  }

  async function remove() {
    if (!confirm(`Delete "${deliverable.title}"?`)) return;
    setBusy(true);
    await deleteDeliverable(deliverable._id);
    setBusy(false);
    onChange();
  }

  return (
    <li className={`flex items-center gap-4 p-5 ${busy ? "opacity-50" : ""}`}>
      <a
        href={deliverable.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative h-14 w-20 rounded-sm bg-ink-900 overflow-hidden flex-shrink-0"
      >
        {deliverable.type === "image" ? (
          <Image src={deliverable.url} alt="" fill className="object-cover" sizes="80px" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            {deliverable.type === "video" ? (
              <Film className="h-5 w-5 text-bone-400" />
            ) : deliverable.type === "link" ? (
              <Link2 className="h-5 w-5 text-bone-400" />
            ) : (
              <FileText className="h-5 w-5 text-bone-400" />
            )}
          </div>
        )}
      </a>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium truncate">{deliverable.title}</p>
          <span className="text-xs text-bone-400">v{deliverable.version}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] px-2 py-0.5 border rounded-full uppercase tracking-wider ${statusStyles[deliverable.status]}`}
          >
            {statusLabels[deliverable.status]}
          </span>
          {deliverable.feedback && deliverable.status === "changes_requested" && (
            <span className="text-xs text-fire italic line-clamp-1 max-w-md">
              "{deliverable.feedback}"
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {deliverable.status === "draft" && (
          <button
            onClick={sendToReview}
            disabled={busy}
            className="inline-flex items-center gap-1.5 border border-fire/40 text-fire hover:bg-fire/10 px-3 py-1.5 rounded-full text-xs transition-all"
            title="Send to client for review"
          >
            <Send className="h-3 w-3" />
            Send for review
          </button>
        )}
        <button
          onClick={remove}
          disabled={busy}
          className="p-2 hover:bg-fire/10 rounded-sm text-bone-300 hover:text-fire transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function AddDeliverableModal({
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
  const [type, setType] = useState<"image" | "video" | "document" | "link">("image");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [dueDate, setDueDate] = useState(""); // ISO yyyy-mm-dd; appears on the client portal calendar
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendImmediately, setSendImmediately] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "projects");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setUrl(data.url);
      // auto-detect type
      const mime = file.type;
      if (mime.startsWith("image/")) setType("image");
      else if (mime.startsWith("video/")) setType("video");
      else setType("document");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!title.trim()) return setError("Title is required");
    if (!url) return setError("Upload a file or paste a link URL");
    setError(null);
    setSaving(true);
    const res = await createDeliverable({
      project: projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      url,
      thumbnailUrl: thumbnailUrl || undefined,
      type,
      status: sendImmediately ? "in_review" : "draft",
      dueDate: dueDate || undefined,
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
          <h3 className="font-display text-lg">Add deliverable</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center hover:bg-ink-900 rounded-sm">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Logo Concept v1" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional note for the client"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full bg-transparent border-0 border-b border-ink-700 h-12 text-base focus:outline-none focus:border-fire"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
              <option value="link">External link</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Due date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <p className="text-xs text-bone-400">
              Optional. Shows on the client portal calendar so they know when to expect it.
            </p>
          </div>

          {type === "link" ? (
            <div className="space-y-2">
              <Label>URL *</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>File *</Label>
              {url ? (
                <div className="flex items-center gap-3 p-3 border border-ink-800 rounded-sm">
                  <Check className="h-4 w-4 text-fire" />
                  <span className="text-sm truncate flex-1">{url}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUrl("");
                      setThumbnailUrl("");
                    }}
                    className="text-xs text-bone-300 hover:text-fire"
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-ink-700 hover:border-fire/40 rounded-sm py-6 transition-all flex flex-col items-center gap-2 group"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-5 w-5 text-fire animate-spin" />
                        <p className="text-sm text-bone-300">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-bone-400 group-hover:text-fire" />
                        <p className="text-sm text-bone-300">Click to upload</p>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </>
              )}
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={sendImmediately}
              onChange={(e) => setSendImmediately(e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-5 w-9 rounded-full bg-ink-800 peer-checked:bg-fire transition-colors peer-checked:[&>span]:translate-x-4">
              <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-bone transition-transform" />
            </span>
            <span className="text-sm">
              Send to client for review immediately
              <span className="block text-xs text-bone-400">If off, saves as draft for you to finalize later</span>
            </span>
          </label>

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
          <Button onClick={save} disabled={saving || uploading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Saving..." : "Create deliverable"}
          </Button>
        </div>
      </div>
    </div>
  );
}
