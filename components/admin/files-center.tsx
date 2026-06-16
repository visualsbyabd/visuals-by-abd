"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  Film,
  FileText,
  Copy,
  Check,
  Eye,
  EyeOff,
  Tag as TagIcon,
  X,
  FolderKanban,
  Plus,
} from "lucide-react";
import { updateFileMeta } from "@/features/files/actions";

type File = {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  type: "image" | "video" | "document";
  size: number;
  folder: string;
  project?: string;
  projectName?: string;
  client?: string;
  clientName?: string;
  tags: string[];
  visibleToClient: boolean;
  createdAt: string;
};

type ProjectOption = { _id: string; title: string };

export function FilesCenter({ files, projects }: { files: File[]; projects: ProjectOption[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [selected, setSelected] = useState<File | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    files.forEach((f) => f.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [files]);

  const folders = useMemo(() => Array.from(new Set(files.map((f) => f.folder))).sort(), [files]);

  const filtered = useMemo(() => {
    return files.filter((f) => {
      if (folderFilter !== "all" && f.folder !== folderFilter) return false;
      if (typeFilter !== "all" && f.type !== typeFilter) return false;
      if (projectFilter === "unassigned" && f.project) return false;
      if (projectFilter !== "all" && projectFilter !== "unassigned" && f.project !== projectFilter) return false;
      if (tagFilter && !f.tags.includes(tagFilter)) return false;
      if (q && !f.originalName.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [files, q, folderFilter, typeFilter, projectFilter, tagFilter]);

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <>
      {/* Filters */}
      <div className="border border-ink-800 rounded-sm p-4 mb-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bone-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search files by name..."
              className="w-full bg-ink-900 border border-ink-800 pl-10 pr-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40 transition-colors"
            />
          </div>
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
          <select
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            className="bg-ink-900 border border-ink-800 px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40"
          >
            <option value="all">All folders</option>
            {folders.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-ink-900 border border-ink-800 px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40"
          >
            <option value="all">All projects</option>
            <option value="unassigned">Unassigned</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </select>
        </div>
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <TagIcon className="h-3.5 w-3.5 text-bone-400" />
            <button
              onClick={() => setTagFilter("")}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                !tagFilter ? "border-fire text-fire bg-fire/10" : "border-ink-700 text-bone-300 hover:border-bone-300"
              }`}
            >
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(t)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  tagFilter === t ? "border-fire text-fire bg-fire/10" : "border-ink-700 text-bone-300 hover:border-bone-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-bone-400 mb-4">
        Showing {filtered.length} of {files.length}
      </p>

      {filtered.length === 0 ? (
        <div className="border border-ink-800 rounded-sm p-16 text-center">
          <p className="text-bone-300">No files match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((f) => (
            <button
              key={f._id}
              onClick={() => setSelected(f)}
              className="relative aspect-square rounded-sm overflow-hidden bg-ink-900 border border-ink-800 hover:border-fire/40 transition-all group text-left"
            >
              {f.type === "image" ? (
                <Image src={f.url} alt={f.originalName} fill className="object-cover" sizes="200px" />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  {f.type === "video" ? (
                    <Film className="h-8 w-8 text-bone-400" strokeWidth={1.5} />
                  ) : (
                    <FileText className="h-8 w-8 text-bone-400" strokeWidth={1.5} />
                  )}
                </div>
              )}
              {f.visibleToClient && (
                <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 border border-fire/40 text-fire bg-fire/10 rounded-full uppercase tracking-wider backdrop-blur">
                  Portal
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent p-2">
                <p className="text-[10px] text-bone truncate font-medium">{f.originalName}</p>
                {f.projectName && (
                  <p className="text-[10px] text-fire truncate">{f.projectName}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <FileDetailModal
          file={selected}
          projects={projects}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            router.refresh();
          }}
          onCopyUrl={copyUrl}
          copiedUrl={copied}
        />
      )}
    </>
  );
}

function FileDetailModal({
  file,
  projects,
  onClose,
  onChanged,
  onCopyUrl,
  copiedUrl,
}: {
  file: File;
  projects: ProjectOption[];
  onClose: () => void;
  onChanged: () => void;
  onCopyUrl: (url: string) => void;
  copiedUrl: string | null;
}) {
  const [project, setProject] = useState(file.project ?? "");
  const [tags, setTags] = useState<string[]>(file.tags);
  const [tagInput, setTagInput] = useState("");
  const [visibleToClient, setVisibleToClient] = useState(file.visibleToClient);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await updateFileMeta(file._id, {
      project: project || null,
      tags,
      visibleToClient,
    });
    setSaving(false);
    onChanged();
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  return (
    <div className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-ink-950 border border-ink-800 rounded-sm max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-ink-800">
          <h3 className="font-display text-lg truncate">{file.originalName}</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center hover:bg-ink-900 rounded-sm">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="relative aspect-square bg-ink-900 rounded-sm overflow-hidden">
            {file.type === "image" ? (
              <Image src={file.url} alt="" fill className="object-contain" />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                {file.type === "video" ? <Film className="h-16 w-16 text-bone-400" /> : <FileText className="h-16 w-16 text-bone-400" />}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-bone-300 mb-1">Size</p>
              <p className="text-sm">{(file.size / 1024).toFixed(1)} KB</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-bone-300">URL</p>
              <div className="flex gap-2">
                <code className="flex-1 bg-ink-900 px-3 py-2 text-xs rounded-sm border border-ink-800 truncate">
                  {file.url}
                </code>
                <button
                  onClick={() => onCopyUrl(file.url)}
                  className="h-9 w-9 grid place-items-center border border-ink-800 hover:border-fire hover:text-fire rounded-sm transition-all"
                >
                  {copiedUrl === file.url ? <Check className="h-4 w-4 text-fire" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-bone-300">Project</p>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-ink-700 h-10 text-sm focus:outline-none focus:border-fire"
              >
                <option value="">— Unassigned —</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-bone-300">Tags</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-ink-700 rounded-full">
                    {t}
                    <button
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="hover:text-fire"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag and press Enter"
                  className="flex-1 bg-ink-900 border border-ink-800 px-3 py-1.5 text-xs rounded-sm focus:outline-none focus:border-fire/40"
                />
                <button
                  onClick={addTag}
                  className="h-8 w-8 grid place-items-center border border-ink-800 hover:border-fire hover:text-fire rounded-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={visibleToClient}
                onChange={(e) => setVisibleToClient(e.target.checked)}
                className="peer sr-only"
              />
              <span className="relative h-5 w-9 rounded-full bg-ink-800 peer-checked:bg-fire transition-colors peer-checked:[&>span]:translate-x-4">
                <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-bone transition-transform" />
              </span>
              <span className="text-sm flex items-center gap-2">
                {visibleToClient ? <Eye className="h-3.5 w-3.5 text-fire" /> : <EyeOff className="h-3.5 w-3.5" />}
                Visible to client in portal
              </span>
            </label>

            <button
              onClick={save}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 bg-fire hover:bg-fire-glow disabled:opacity-50 text-bone px-5 py-2.5 rounded-full text-sm font-medium transition-all mt-4"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
