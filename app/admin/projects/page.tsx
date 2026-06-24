import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { ProjectsTable } from "@/components/admin/projects-table";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

async function getProjects() {
  try {
    await connectDB();
    // Admin table only renders these fields — no need to pull media[] arrays
    // for every project on the list page.
    const projects = await Project.find()
      .select("title slug category status featured isMainOnHome isPinned coverImage year client views createdAt")
      .sort({ createdAt: -1 })
      .lean();
    return projects.map((p) => ({
      _id: String(p._id),
      title: p.title,
      slug: p.slug,
      category: p.category,
      status: p.status,
      featured: p.featured,
      isMainOnHome: !!p.isMainOnHome,
      isPinned: !!p.isPinned,
      coverImage: p.coverImage,
      year: p.year,
      client: p.client,
      views: p.views ?? 0,
      createdAt: p.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export default async function AdminProjectsPage() {
  const projects = await getProjects();

  return (
    <div>
      <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
        <div>
          <p className="eyebrow mb-3">— Manage</p>
          <h1 className="display-md text-balance">Projects</h1>
          <p className="text-bone-300 mt-2">{projects.length} total</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow text-bone px-6 py-3 rounded-full transition-all text-sm font-medium shadow-[0_0_40px_-10px_rgba(214,40,40,0.6)]"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      <ProjectsTable projects={projects} />
    </div>
  );
}
