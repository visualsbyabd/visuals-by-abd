"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, Film, FileText, Download, FolderKanban } from "lucide-react";

type File = {
  _id: string;
  originalName: string;
  url: string;
  type: "image" | "video" | "document";
  size: number;
  projectName?: string;
  tags: string[];
  createdAt: string;
};

export function PortalFilesGrid({ files }: { files: File[] }) {
  const [q, setQ] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");

  const projects = useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => f.projectName && set.add(f.projectName));
    return Array.from(set).sort();
  }, [files]);

  const filtered = useMemo(() => {
    return files.filter((f) => {
      if (projectFilter !== "all" && f.projectName !== projectFilter) return false;
      if (q && !f.originalName.toLowerCase().includes(q.toLowerCase()) && !f.tags.some((t) => t.includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [files, q, projectFilter]);

  if (files.length === 0) {
    return (
      <div className="border border-ink-800 rounded-sm p-16 text-center">
        <FolderKanban className="h-10 w-10 text-bone-400 mx-auto mb-4" strokeWidth={1.5} />
        <p className="text-bone-300">No files shared with you yet.</p>
        <p className="text-xs text-bone-400 mt-2">Files will appear here as your project lead shares them.</p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-ink-800 rounded-sm p-4 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bone-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-ink-900 border border-ink-800 pl-10 pr-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40"
          />
        </div>
        {projects.length > 1 && (
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-ink-900 border border-ink-800 px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40"
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((f) => (
          <article key={f._id} className="border border-ink-800 hover:border-fire/40 rounded-sm overflow-hidden transition-colors group">
            <a href={f.url} target="_blank" rel="noopener noreferrer" className="block relative aspect-[4/3] bg-ink-900">
              {f.type === "image" ? (
                <Image src={f.url} alt={f.originalName} fill className="object-cover" sizes="300px" />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  {f.type === "video" ? <Film className="h-10 w-10 text-bone-400" /> : <FileText className="h-10 w-10 text-bone-400" />}
                </div>
              )}
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-colors" />
            </a>
            <div className="p-4">
              <p className="text-sm font-medium truncate">{f.originalName}</p>
              {f.projectName && <p className="text-xs text-fire mt-1">{f.projectName}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-800">
                <span className="text-xs text-bone-400">
                  {new Date(f.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <a
                  href={f.url}
                  download
                  className="inline-flex items-center gap-1 text-xs text-bone-300 hover:text-fire transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Download
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
