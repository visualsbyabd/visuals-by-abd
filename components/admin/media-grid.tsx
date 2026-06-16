"use client";

import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, X, Search, Loader2, Copy, Check, Trash2, Film, FileText } from "lucide-react";
import { formatBytes } from "@/lib/utils";

type MediaItem = {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  type: "image" | "video" | "document";
  size: number;
  folder: string;
  width?: number;
  height?: number;
  createdAt: string;
};

const FOLDERS = ["projects", "videos", "identities", "web-designs", "profile", "testimonials", "brands"];

export function MediaGrid({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [uploadFolder, setUploadFolder] = useState("projects");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (folderFilter !== "all" && m.folder !== folderFilter) return false;
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (q && !m.originalName.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [items, q, folderFilter, typeFilter]);

  async function handleFiles(files: FileList) {
    setError(null);
    setUploading(true);
    setProgress({ current: 0, total: files.length });
    try {
      let i = 0;
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", uploadFolder);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        i++;
        setProgress({ current: i, total: files.length });
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress({ current: 0, total: 0 }), 1000);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSelected(null);
      router.refresh();
    } else {
      alert("Failed to delete");
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <>
      {/* Upload bar */}
      <div className="border border-ink-800 rounded-sm p-5 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value)}
            className="bg-ink-900 border border-ink-800 px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40"
          >
            {FOLDERS.map((f) => (
              <option key={f} value={f}>
                Upload to: {f}
              </option>
            ))}
          </select>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow text-bone px-5 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? `Uploading ${progress.current}/${progress.total}` : "Upload files"}
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
          />
          {error && <span className="text-xs text-fire">{error}</span>}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bone-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-ink-900 border border-ink-800 pl-10 pr-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40 transition-colors"
          />
        </div>
        <select
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
          className="bg-ink-900 border border-ink-800 px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40"
        >
          <option value="all">All folders</option>
          {FOLDERS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-ink-900 border border-ink-800 px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40"
        >
          <option value="all">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border border-ink-800 rounded-sm p-16 text-center">
          <p className="text-bone-300">No media files yet. Upload some to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((m) => (
            <button
              key={m._id}
              onClick={() => setSelected(m)}
              className="relative aspect-square rounded-sm overflow-hidden bg-ink-900 border border-ink-800 hover:border-fire/40 transition-all group"
            >
              {m.type === "image" ? (
                <Image src={m.url} alt={m.originalName} fill className="object-cover" sizes="200px" />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  {m.type === "video" ? (
                    <Film className="h-10 w-10 text-bone-400" strokeWidth={1.5} />
                  ) : (
                    <FileText className="h-10 w-10 text-bone-400" strokeWidth={1.5} />
                  )}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-x-0 bottom-0 p-2 text-left opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-bone truncate">{m.originalName}</p>
                <p className="text-[10px] text-bone-300">{formatBytes(m.size)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-ink-950 border border-ink-800 rounded-sm max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-ink-800">
              <h3 className="font-display text-lg truncate">{selected.originalName}</h3>
              <button
                onClick={() => setSelected(null)}
                className="h-9 w-9 grid place-items-center hover:bg-ink-900 rounded-sm transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6 p-6">
              <div className="relative aspect-square bg-ink-900 rounded-sm overflow-hidden">
                {selected.type === "image" ? (
                  <Image src={selected.url} alt="" fill className="object-contain" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    {selected.type === "video" ? <Film className="h-16 w-16 text-bone-400" /> : <FileText className="h-16 w-16 text-bone-400" />}
                  </div>
                )}
              </div>
              <div className="space-y-5">
                <Detail label="Filename" value={selected.filename} />
                <Detail label="Folder" value={selected.folder} />
                <Detail label="Type" value={selected.type} />
                <Detail label="Size" value={formatBytes(selected.size)} />
                {selected.width && selected.height && (
                  <Detail label="Dimensions" value={`${selected.width} × ${selected.height} px`} />
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-bone-300 mb-2">URL</p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-ink-900 px-3 py-2 text-xs rounded-sm border border-ink-800 truncate">
                      {selected.url}
                    </code>
                    <button
                      onClick={() => copyUrl(selected.url)}
                      className="h-9 w-9 grid place-items-center border border-ink-800 hover:border-fire hover:text-fire rounded-sm transition-all"
                    >
                      {copied === selected.url ? <Check className="h-4 w-4 text-fire" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="pt-4 border-t border-ink-800">
                  <button
                    onClick={() => handleDelete(selected._id)}
                    className="inline-flex items-center gap-2 text-fire hover:text-fire-glow text-sm transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete file
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-bone-300 mb-1">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
