"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Eye, Pencil, Trash2, MoreVertical, Star, Crown, Pin } from "lucide-react";
import { deleteProject, toggleProjectStatus, setMainHomeProject, setPinnedProject } from "@/features/projects/actions";

type AdminProject = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  featured: boolean;
  isMainOnHome: boolean;
  isPinned: boolean;
  coverImage: string;
  year?: number;
  client?: string;
  views: number;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  published: "text-fire border-fire/40 bg-fire/5",
  draft: "text-bone-300 border-ink-700 bg-ink-900",
  archived: "text-bone-400 border-ink-700 bg-ink-900",
};

export function ProjectsTable({ projects }: { projects: AdminProject[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [projects, q, statusFilter, categoryFilter]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(id);
    const res = await deleteProject(id);
    setBusy(null);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  async function handleQuickPublish(id: string, current: string) {
    const next = current === "published" ? "draft" : "published";
    setBusy(id);
    const res = await toggleProjectStatus(id, next as "draft" | "published");
    setBusy(null);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  async function handleToggleMain(id: string, isCurrentlyMain: boolean) {
    setBusy(id);
    // If it's already main, clear it. Otherwise make it the new main (which
    // server-side will also clear it on any other project).
    const res = await setMainHomeProject(isCurrentlyMain ? null : id);
    setBusy(null);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  async function handleTogglePin(id: string, isCurrentlyPinned: boolean) {
    setBusy(id);
    // Toggle pinning in the project's category. Server-side unpins any other
    // project that was previously pinned in the same category.
    const res = await setPinnedProject(id, !isCurrentlyPinned);
    setBusy(null);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  return (
    <div className="border border-ink-800 rounded-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-ink-800 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bone-400 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-ink-900 border border-ink-800 pl-10 pr-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-ink-900 border border-ink-800 px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40 transition-colors"
        >
          <option value="all">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-ink-900 border border-ink-800 px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40 transition-colors"
        >
          <option value="all">All categories</option>
          <option value="brand-identity">Brand Identity</option>
          <option value="motion-design">Motion Design</option>
          <option value="video-editing">Video Editing</option>
          <option value="graphic-design">Graphic Design</option>
          <option value="web-design">Web Design</option>
          <option value="creative-direction">Creative Direction</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center">
          <p className="text-bone-300 mb-4">
            {projects.length === 0 ? "No projects yet." : "No projects match your filters."}
          </p>
          {projects.length === 0 && (
            <Link
              href="/admin/projects/new"
              className="inline-flex items-center gap-2 border border-ink-700 hover:border-fire hover:text-fire px-5 py-2.5 rounded-full text-sm transition-all"
            >
              Create your first project
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-800 bg-ink-950">
                <th className="text-left text-xs uppercase tracking-[0.2em] text-bone-400 px-6 py-3 font-medium">
                  Project
                </th>
                <th className="text-left text-xs uppercase tracking-[0.2em] text-bone-400 px-6 py-3 font-medium hidden md:table-cell">
                  Category
                </th>
                <th className="text-left text-xs uppercase tracking-[0.2em] text-bone-400 px-6 py-3 font-medium">
                  Status
                </th>
                <th className="text-left text-xs uppercase tracking-[0.2em] text-bone-400 px-6 py-3 font-medium hidden lg:table-cell">
                  Views
                </th>
                <th className="text-right text-xs uppercase tracking-[0.2em] text-bone-400 px-6 py-3 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {filtered.map((p) => (
                <tr key={p._id} className={`hover:bg-ink-950 transition-colors ${busy === p._id ? "opacity-50" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-16 rounded-sm bg-ink-900 overflow-hidden flex-shrink-0">
                        {p.coverImage ? (
                          <Image src={p.coverImage} alt="" fill className="object-cover" sizes="64px" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-ink-800 to-ink-900" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{p.title}</p>
                          {p.isMainOnHome && (
                            <Crown
                              className="h-3.5 w-3.5 text-fire fill-fire flex-shrink-0"
                              aria-label="Main project on home"
                            />
                          )}
                          {p.isPinned && (
                            <Pin
                              className="h-3.5 w-3.5 text-fire fill-fire flex-shrink-0"
                              aria-label={`Pinned in ${p.category}`}
                            />
                          )}
                          {p.featured && !p.isMainOnHome && (
                            <Star className="h-3.5 w-3.5 text-fire fill-fire flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-bone-400 truncate">/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-bone-300 hidden md:table-cell capitalize">
                    {p.category.replace("-", " ")}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleQuickPublish(p._id, p.status)}
                      disabled={busy === p._id}
                      className={`text-xs px-3 py-1 border rounded-full uppercase tracking-wider transition-opacity hover:opacity-80 ${statusColors[p.status]}`}
                      title="Click to toggle"
                    >
                      {p.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-bone-300 hidden lg:table-cell">
                    {p.views.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleMain(p._id, p.isMainOnHome)}
                        disabled={busy === p._id}
                        title={
                          p.isMainOnHome
                            ? "Currently the main project on home — click to clear"
                            : "Make this the main project on home"
                        }
                        className={`p-2 rounded-sm transition-colors ${
                          p.isMainOnHome
                            ? "text-fire bg-fire/10 hover:bg-fire/20"
                            : "text-bone-300 hover:bg-ink-800 hover:text-fire"
                        }`}
                      >
                        <Crown className={`h-4 w-4 ${p.isMainOnHome ? "fill-fire" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleTogglePin(p._id, p.isPinned)}
                        disabled={busy === p._id}
                        title={
                          p.isPinned
                            ? `Pinned in ${p.category} — click to unpin`
                            : `Pin this project at the top of its category (${p.category})`
                        }
                        className={`p-2 rounded-sm transition-colors ${
                          p.isPinned
                            ? "text-fire bg-fire/10 hover:bg-fire/20"
                            : "text-bone-300 hover:bg-ink-800 hover:text-fire"
                        }`}
                      >
                        <Pin className={`h-4 w-4 ${p.isPinned ? "fill-fire" : ""}`} />
                      </button>
                      <Link
                        href={`/projects/${p.slug}`}
                        target="_blank"
                        className="p-2 hover:bg-ink-800 rounded-sm text-bone-300 hover:text-bone transition-colors"
                        title="View live"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/projects/${p._id}`}
                        className="p-2 hover:bg-ink-800 rounded-sm text-bone-300 hover:text-bone transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(p._id, p.title)}
                        disabled={busy === p._id}
                        className="p-2 hover:bg-fire/10 rounded-sm text-bone-300 hover:text-fire transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
