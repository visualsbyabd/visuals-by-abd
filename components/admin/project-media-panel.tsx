"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Upload,
  Trash2,
  X,
  Loader2,
  Image as ImageIcon,
  Film,
  GripVertical,
  Pencil,
  Play,
  AlertCircle,
  Star,
  Plus,
  Check,
  LayoutGrid,
  Rows3,
} from "lucide-react";
import {
  addProjectMedia,
  removeProjectMedia,
  reorderProjectMedia,
  updateProjectMedia,
  setProjectMediaLayout,
  type MediaInput,
} from "@/features/projects/media-actions";
import type { ProjectMediaItem } from "@/components/site/media-gallery";

// Re-export so existing imports keep working
export type { ProjectMediaItem };

type WorkingMediaInput = MediaInput & {
  fileName?: string;
};

export type MediaLayout = "mixed" | "videos-grid";

export function ProjectMediaPanel({
  projectId,
  media,
  mediaLayout = "mixed",
}: {
  projectId: string;
  media: ProjectMediaItem[];
  mediaLayout?: MediaLayout;
}) {
  const router = useRouter();
  const [items, setItems] = useState(media);
  const [layout, setLayout] = useState<MediaLayout>(mediaLayout);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [editing, setEditing] = useState<ProjectMediaItem | null>(null);
  const [draggedUrl, setDraggedUrl] = useState<string | null>(null);

  // Keep local state in sync if the server data changes (e.g., after router.refresh)
  useEffect(() => setItems(media), [media]);
  useEffect(() => setLayout(mediaLayout), [mediaLayout]);

  async function changeLayout(next: MediaLayout) {
    setLayout(next);
    setLayoutSaving(true);
    await setProjectMediaLayout(projectId, next);
    setLayoutSaving(false);
    router.refresh();
  }

  async function remove(url: string) {
    if (!confirm("Remove this media from the gallery?")) return;
    const res = await removeProjectMedia(projectId, url);
    if (res.ok) router.refresh();
  }

  async function onDrop(targetUrl: string) {
    if (!draggedUrl || draggedUrl === targetUrl) {
      setDraggedUrl(null);
      return;
    }
    const next = [...items];
    const fromIdx = next.findIndex((m) => m.url === draggedUrl);
    const toIdx = next.findIndex((m) => m.url === targetUrl);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setItems(next);
    setDraggedUrl(null);
    await reorderProjectMedia(projectId, next.map((m) => m.url));
    router.refresh();
  }

  async function setFeatured(url: string) {
    await updateProjectMedia(projectId, url, { featured: true });
    router.refresh();
  }

  return (
    <section className="border border-ink-800 rounded-sm">
      <header className="flex items-center justify-between p-6 border-b border-ink-800 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-lg font-medium">Project media</h2>
          <p className="text-xs text-bone-400 mt-1">
            Images + videos · drag to reorder · star a video to feature it as the hero on the public page
          </p>
        </div>
        <button
          onClick={() => setShowUploader(true)}
          className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow text-bone px-4 py-2 rounded-full text-sm font-medium transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Upload media
        </button>
      </header>

      {/* Layout-mode sub-bar */}
      <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-ink-800 bg-ink-950/50 flex-wrap">
        <p className="text-xs uppercase tracking-[0.2em] text-bone-300">Public layout</p>
        <div className="flex items-center gap-2">
          <LayoutChoice
            active={layout === "mixed"}
            onClick={() => changeLayout("mixed")}
            icon={Rows3}
            label="Editorial mix"
            description="Images + videos interleaved · featured hero"
          />
          <LayoutChoice
            active={layout === "videos-grid"}
            onClick={() => changeLayout("videos-grid")}
            icon={LayoutGrid}
            label="Videos-only grid"
            description="Uniform thumbnail grid · tap to play · perfect for reels"
          />
          {layoutSaving && <Loader2 className="h-3.5 w-3.5 text-fire animate-spin ml-1" />}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-bone-300 mb-1">No media added yet.</p>
          <p className="text-xs text-bone-400">
            Supported: JPG · PNG · WEBP · MP4 · MOV · WEBM (max 100MB)
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-6">
          {items.map((m) => (
            <article
              key={m.url}
              draggable
              onDragStart={() => setDraggedUrl(m.url)}
              onDragEnd={() => setDraggedUrl(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(m.url)}
              className={`relative aspect-square bg-ink-900 border rounded-sm overflow-hidden group transition-all ${
                draggedUrl === m.url ? "opacity-30 border-fire" : m.featured ? "border-fire/60 ring-1 ring-fire/30" : "border-ink-800 hover:border-fire/40"
              }`}
            >
              {m.type === "image" ? (
                <Image src={m.url} alt={m.alt ?? ""} fill className="object-cover" sizes="240px" />
              ) : m.thumbnail ? (
                <>
                  <Image src={m.thumbnail} alt={m.alt ?? ""} fill className="object-cover" sizes="240px" />
                  <div className="absolute inset-0 grid place-items-center bg-ink/30">
                    <div className="h-10 w-10 rounded-full bg-fire/90 grid place-items-center">
                      <Play className="h-4 w-4 text-bone ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <Film className="h-8 w-8 text-bone-400" strokeWidth={1.5} />
                </div>
              )}

              {/* Top-left: type badge */}
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 border rounded-full uppercase tracking-wider backdrop-blur bg-ink/60 border-ink-700 text-bone">
                {m.type === "image" ? <ImageIcon className="h-2.5 w-2.5" /> : <Film className="h-2.5 w-2.5" />}
                {m.type}
              </span>

              {/* Top-right: featured + duration */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                {m.featured && (
                  <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full backdrop-blur bg-fire/90 text-bone font-medium uppercase tracking-wider">
                    <Star className="h-2.5 w-2.5" fill="currentColor" />
                    Featured
                  </span>
                )}
                {m.type === "video" && m.duration && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full backdrop-blur bg-ink/80 border border-ink-700 text-bone font-mono">
                    {formatTime(m.duration)}
                  </span>
                )}
              </div>

              {/* Hover bar */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 via-ink/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-bone-300 truncate mb-1">
                  {m.title || m.alt || <span className="text-bone-400 italic">No title</span>}
                </p>
                <div className="flex items-center gap-1">
                  <GripVertical className="h-3.5 w-3.5 text-bone-300 cursor-grab flex-shrink-0" />
                  <div className="flex-1" />
                  {m.type === "video" && !m.featured && (
                    <button
                      onClick={() => setFeatured(m.url)}
                      className="h-6 w-6 grid place-items-center bg-ink-900/80 hover:bg-fire/20 rounded-sm text-bone-300 hover:text-fire"
                      title="Mark as featured video"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={() => setEditing(m)}
                    className="h-6 w-6 grid place-items-center bg-ink-900/80 hover:bg-ink-800 rounded-sm text-bone-300 hover:text-bone"
                    title="Edit metadata"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => remove(m.url)}
                    className="h-6 w-6 grid place-items-center bg-ink-900/80 hover:bg-fire/20 rounded-sm text-bone-300 hover:text-fire"
                    title="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showUploader && (
        <UploadMediaModal
          projectId={projectId}
          existingFeatured={items.some((m) => m.featured)}
          onClose={() => setShowUploader(false)}
          onSaved={() => {
            setShowUploader(false);
            router.refresh();
          }}
        />
      )}

      {editing && (
        <EditMediaModal
          projectId={projectId}
          media={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </section>
  );
}

/* ─────────── Upload modal ─────────── */

function UploadMediaModal({
  projectId,
  existingFeatured,
  onClose,
  onSaved,
}: {
  projectId: string;
  existingFeatured: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<"pick" | "details" | "saving">("pick");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-file working state
  const [pending, setPending] = useState<WorkingMediaInput[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  async function handlePickedFiles(files: FileList) {
    setError(null);
    setUploading(true);
    const next: WorkingMediaInput[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", file.type.startsWith("video/") ? "videos" : "projects");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        if (data.type !== "image" && data.type !== "video") {
          throw new Error("Only images and videos are allowed in the project gallery");
        }

        let duration: number | undefined;
        let orientation: "horizontal" | "vertical" | undefined;
        if (data.type === "video") {
          const meta = await probeVideoMetadata(data.url).catch(() => undefined);
          if (meta) {
            duration = meta.duration;
            orientation = meta.orientation;
          }
        }

        next.push({
          type: data.type,
          url: data.url,
          duration,
          orientation,
          title: stripExt(file.name),
          alt: "",
          description: "",
          tags: [],
          featured: false,
          fileName: file.name,
        });
      }
      setPending((prev) => [...prev, ...next]);
      setStage("details");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function uploadThumbnail(idx: number, file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "projects");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      if (data.type !== "image") throw new Error("Thumbnail must be an image");
      setPending((prev) => prev.map((p, i) => (i === idx ? { ...p, thumbnail: data.url } : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thumbnail upload failed");
    } finally {
      setUploading(false);
    }
  }

  function patch(idx: number, p: Partial<WorkingMediaInput>) {
    setPending((prev) => prev.map((item, i) => (i === idx ? { ...item, ...p } : item)));
  }

  function removePending(idx: number) {
    setPending((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((i) => Math.max(0, Math.min(i, pending.length - 2)));
    if (pending.length <= 1) setStage("pick");
  }

  async function save() {
    setError(null);
    setStage("saving");
    const payload: MediaInput[] = pending.map(({ fileName: _f, ...rest }) => rest);
    const res = await addProjectMedia(projectId, payload);
    if (res.ok) onSaved();
    else {
      setError(res.error);
      setStage("details");
    }
  }

  const active = pending[activeIdx];

  return (
    <div className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-ink-950 border border-ink-800 rounded-sm max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-ink-800 flex-shrink-0">
          <div>
            <h3 className="font-display text-lg">
              {stage === "pick" ? "Upload media" : `Details · ${pending.length} item${pending.length === 1 ? "" : "s"}`}
            </h3>
            <p className="text-xs text-bone-400 mt-0.5">
              {stage === "pick" ? "Select files to upload" : "Add metadata for each item, then save all together"}
            </p>
          </div>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center hover:bg-ink-900 rounded-sm">
            <X className="h-4 w-4" />
          </button>
        </div>

        {stage === "pick" && (
          <div className="p-6">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full border-2 border-dashed border-ink-700 hover:border-fire/40 rounded-sm py-16 transition-all flex flex-col items-center justify-center gap-3 text-bone-300 hover:text-fire"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Upload className="h-8 w-8" strokeWidth={1.5} />
              )}
              <p className="text-base font-medium">{uploading ? "Uploading..." : "Click to select files"}</p>
              <p className="text-xs text-bone-400">JPG · PNG · WEBP · MP4 · MOV · WEBM · up to 100MB each</p>
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/jpg,video/mp4,video/quicktime,video/webm"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) handlePickedFiles(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
            {error && (
              <div className="mt-4 flex items-start gap-2 border border-fire/40 bg-fire/5 px-3 py-2 text-xs text-fire rounded-sm">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {(stage === "details" || stage === "saving") && active && (
          <>
            {/* Tab strip — one per pending file */}
            <div className="flex items-center gap-1 px-5 py-2 border-b border-ink-800 overflow-x-auto flex-shrink-0">
              {pending.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap ${
                    i === activeIdx
                      ? "bg-fire text-bone"
                      : "border border-ink-700 text-bone-300 hover:border-bone-300"
                  }`}
                >
                  {p.type === "image" ? <ImageIcon className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                  {p.title || `Item ${i + 1}`}
                </button>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-ink-700 hover:border-fire hover:text-fire rounded-full text-xs transition-colors disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                Add more
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg,video/mp4,video/quicktime,video/webm"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) handlePickedFiles(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-6 p-6">
                {/* Preview */}
                <div className="space-y-3">
                  <div className="relative aspect-video bg-ink-900 rounded-sm overflow-hidden border border-ink-800">
                    {active.type === "image" ? (
                      <Image src={active.url} alt="" fill className="object-contain" />
                    ) : (
                      <video src={active.url} poster={active.thumbnail} controls preload="metadata" className="absolute inset-0 w-full h-full object-contain" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-ink-700 rounded-full text-bone-300 capitalize">
                      {active.type === "image" ? <ImageIcon className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                      {active.type}
                    </span>
                    {active.duration && (
                      <span className="font-mono text-bone-400">{formatTime(active.duration)}</span>
                    )}
                    <span className="text-bone-400 truncate flex-1">{active.fileName}</span>
                    <button
                      onClick={() => removePending(activeIdx)}
                      className="text-bone-300 hover:text-fire transition-colors"
                      title="Remove from upload"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata form */}
                <div className="space-y-4">
                  <Field label="Title">
                    <input
                      value={active.title ?? ""}
                      onChange={(e) => patch(activeIdx, { title: e.target.value })}
                      placeholder={active.type === "video" ? "e.g. Real Estate Commercial Campaign" : "e.g. Hero billboard mockup"}
                      className="w-full bg-transparent border-0 border-b border-ink-700 h-10 text-sm focus:outline-none focus:border-fire"
                    />
                  </Field>

                  <Field label="Alt text *">
                    <input
                      value={active.alt ?? ""}
                      onChange={(e) => patch(activeIdx, { alt: e.target.value })}
                      placeholder={
                        active.type === "video"
                          ? "Describe what the video shows for screen readers"
                          : "Describe the image for screen readers"
                      }
                      className="w-full bg-transparent border-0 border-b border-ink-700 h-10 text-sm focus:outline-none focus:border-fire"
                    />
                  </Field>

                  <Field label="Description">
                    <textarea
                      value={active.description ?? ""}
                      onChange={(e) => patch(activeIdx, { description: e.target.value })}
                      placeholder="Optional context, credits, or caption"
                      rows={3}
                      className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 resize-none"
                    />
                  </Field>

                  <Field label="Tags">
                    <TagInput
                      value={active.tags ?? []}
                      onChange={(tags) => patch(activeIdx, { tags })}
                    />
                  </Field>

                  {active.type === "video" && (
                    <>
                      <Field label="Orientation">
                        <OrientationToggle
                          value={active.orientation ?? "horizontal"}
                          onChange={(v) => patch(activeIdx, { orientation: v })}
                          autoDetected
                        />
                      </Field>

                      <Field label="Video thumbnail (poster image)">
                        {active.thumbnail ? (
                          <div className="flex items-center gap-3 p-2 border border-ink-800 rounded-sm">
                            <div className="relative h-12 w-20 bg-ink-900 rounded-sm overflow-hidden">
                              <Image src={active.thumbnail} alt="" fill className="object-cover" sizes="80px" />
                            </div>
                            <span className="text-xs truncate flex-1 text-bone-300">{active.thumbnail.split("/").pop()}</span>
                            <button
                              type="button"
                              onClick={() => patch(activeIdx, { thumbnail: undefined })}
                              className="text-xs text-bone-300 hover:text-fire"
                            >
                              Replace
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => thumbRef.current?.click()}
                            disabled={uploading}
                            className="w-full border-2 border-dashed border-ink-700 hover:border-fire/40 rounded-sm py-3 transition-all flex items-center justify-center gap-2 text-sm text-bone-300 hover:text-fire"
                          >
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Upload poster (JPG/PNG)
                          </button>
                        )}
                        <input
                          ref={thumbRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadThumbnail(activeIdx, f);
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                        <p className="text-xs text-bone-400 mt-1">A still from the video. If omitted, a frame is auto-extracted on render.</p>
                      </Field>

                      <label className="flex items-center gap-3 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={!!active.featured}
                          onChange={(e) => patch(activeIdx, { featured: e.target.checked })}
                          className="peer sr-only"
                        />
                        <span className="relative h-5 w-9 rounded-full bg-ink-800 peer-checked:bg-fire transition-colors peer-checked:[&>span]:translate-x-4">
                          <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-bone transition-transform" />
                        </span>
                        <span className="text-sm flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-fire" fill={active.featured ? "currentColor" : "none"} />
                          Featured video
                          <span className="text-xs text-bone-400">
                            {existingFeatured && !active.featured ? "— will replace current featured" : "— renders as the hero on the public page"}
                          </span>
                        </span>
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mx-6 mb-3 flex items-start gap-2 border border-fire/40 bg-fire/5 px-3 py-2 text-xs text-fire rounded-sm">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 p-5 border-t border-ink-800 flex-shrink-0">
              <p className="text-xs text-bone-400">
                {pending.length} ready to save
              </p>
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm text-bone-300 hover:text-bone">
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={stage === "saving" || pending.length === 0}
                  className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow disabled:opacity-50 text-bone px-5 py-2.5 rounded-full text-sm font-medium transition-all"
                >
                  {stage === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {stage === "saving" ? "Saving..." : "Save all"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────── Edit metadata modal ─────────── */

function EditMediaModal({
  projectId,
  media,
  onClose,
  onSaved,
}: {
  projectId: string;
  media: ProjectMediaItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const thumbRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(media.title ?? "");
  const [alt, setAlt] = useState(media.alt ?? "");
  const [description, setDescription] = useState(media.description ?? "");
  const [tags, setTags] = useState(media.tags ?? []);
  const [thumbnail, setThumbnail] = useState(media.thumbnail ?? "");
  const [featured, setFeatured] = useState(!!media.featured);
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    media.orientation ?? "horizontal"
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadThumb(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "projects");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      if (data.type !== "image") throw new Error("Thumbnail must be an image");
      setThumbnail(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    const res = await updateProjectMedia(projectId, media.url, {
      title,
      alt,
      description,
      tags,
      thumbnail: thumbnail || undefined,
      featured,
      orientation: media.type === "video" ? orientation : undefined,
    });
    setSaving(false);
    if (res.ok) onSaved();
    else setError(res.error);
  }

  return (
    <div className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-ink-950 border border-ink-800 rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-ink-800">
          <h3 className="font-display text-lg">Edit metadata</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center hover:bg-ink-900 rounded-sm">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Preview */}
          <div>
            <div className="relative aspect-video bg-ink-900 rounded-sm overflow-hidden border border-ink-800">
              {media.type === "image" ? (
                <Image src={media.url} alt="" fill className="object-contain" />
              ) : (
                <video src={media.url} controls poster={thumbnail || undefined} className="absolute inset-0 w-full h-full object-contain" />
              )}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-ink-700 h-10 text-sm focus:outline-none focus:border-fire"
              />
            </Field>
            <Field label="Alt text">
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-ink-700 h-10 text-sm focus:outline-none focus:border-fire"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 resize-none"
              />
            </Field>
            <Field label="Tags">
              <TagInput value={tags} onChange={setTags} />
            </Field>

            {media.type === "video" && (
              <>
                <Field label="Orientation">
                  <OrientationToggle value={orientation} onChange={setOrientation} />
                </Field>

                <Field label="Thumbnail">
                  {thumbnail ? (
                    <div className="flex items-center gap-3 p-2 border border-ink-800 rounded-sm">
                      <div className="relative h-12 w-20 bg-ink-900 rounded-sm overflow-hidden">
                        <Image src={thumbnail} alt="" fill className="object-cover" sizes="80px" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setThumbnail("")}
                        className="text-xs text-bone-300 hover:text-fire ml-auto"
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => thumbRef.current?.click()}
                      disabled={uploading}
                      className="w-full border-2 border-dashed border-ink-700 hover:border-fire/40 rounded-sm py-3 transition-all flex items-center justify-center gap-2 text-sm text-bone-300 hover:text-fire"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload poster
                    </button>
                  )}
                  <input
                    ref={thumbRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadThumb(f);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </Field>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="relative h-5 w-9 rounded-full bg-ink-800 peer-checked:bg-fire transition-colors peer-checked:[&>span]:translate-x-4">
                    <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-bone transition-transform" />
                  </span>
                  <span className="text-sm flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-fire" fill={featured ? "currentColor" : "none"} />
                    Featured video
                  </span>
                </label>
              </>
            )}

            {error && (
              <div className="flex items-start gap-2 border border-fire/40 bg-fire/5 px-3 py-2 text-xs text-fire rounded-sm">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-ink-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-bone-300 hover:text-bone">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow disabled:opacity-50 text-bone px-5 py-2.5 rounded-full text-sm font-medium transition-all"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Atomics ─────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">{label}</label>
      {children}
    </div>
  );
}

function LayoutChoice({
  active,
  onClick,
  icon: Icon,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-start gap-2.5 px-3 py-2 rounded-sm border text-left max-w-xs transition-colors ${
        active
          ? "border-fire bg-fire/10"
          : "border-ink-700 hover:border-bone-300"
      }`}
    >
      <Icon
        className={`h-4 w-4 flex-shrink-0 mt-0.5 ${active ? "text-fire" : "text-bone-300 group-hover:text-bone"}`}
        strokeWidth={1.75}
      />
      <div>
        <p className={`text-xs font-medium ${active ? "text-fire" : "text-bone"}`}>{label}</p>
        <p className="text-[10px] text-bone-400 leading-snug">{description}</p>
      </div>
    </button>
  );
}

function OrientationToggle({
  value,
  onChange,
  autoDetected,
}: {
  value: "horizontal" | "vertical";
  onChange: (v: "horizontal" | "vertical") => void;
  autoDetected?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-2">
        {(["horizontal", "vertical"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`group flex items-center gap-2 px-3 py-2.5 border rounded-sm text-xs uppercase tracking-wider transition-colors ${
              value === opt
                ? "border-fire text-fire bg-fire/10"
                : "border-ink-700 text-bone-300 hover:border-bone-300"
            }`}
          >
            <span
              className={`${opt === "horizontal" ? "w-5 h-3" : "w-3 h-5"} border-2 rounded-sm flex-shrink-0 ${
                value === opt ? "border-fire" : "border-current"
              }`}
            />
            <span>{opt === "horizontal" ? "Horizontal · 16:9" : "Vertical · 9:16"}</span>
          </button>
        ))}
      </div>
      {autoDetected && (
        <p className="text-xs text-bone-400">
          Auto-detected from the video's dimensions. Override if the source is letterboxed.
        </p>
      )}
    </div>
  );
}

function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function add(raw: string) {
    const t = raw.trim().toLowerCase();
    if (!t) return;
    if (value.includes(t)) return;
    onChange([...value, t]);
    setInput("");
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 border border-ink-700 rounded-full">
              {t}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== t))}
                className="hover:text-fire"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(input);
          } else if (e.key === "Backspace" && !input && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        placeholder="Type and press Enter"
        className="w-full bg-ink-900 border border-ink-800 px-3 py-1.5 text-xs rounded-sm focus:outline-none focus:border-fire/40"
      />
    </div>
  );
}

/* ─────────── Helpers ─────────── */

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Probe an uploaded video on the client. Returns duration AND orientation
 * by reading the video's metadata box. No transcoding required.
 */
function probeVideoMetadata(url: string): Promise<{ duration: number; orientation: "horizontal" | "vertical" }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("Server"));
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;
    video.onloadedmetadata = () => {
      const d = video.duration;
      const w = video.videoWidth;
      const h = video.videoHeight;
      video.remove();
      if (!isFinite(d) || d <= 0) return reject(new Error("Invalid duration"));
      // Default to horizontal if dimensions can't be read for any reason.
      const orientation: "horizontal" | "vertical" = h > w ? "vertical" : "horizontal";
      resolve({ duration: d, orientation });
    };
    video.onerror = () => {
      video.remove();
      reject(new Error("Failed to read metadata"));
    };
    setTimeout(() => {
      video.remove();
      reject(new Error("Timed out"));
    }, 15000);
  });
}
