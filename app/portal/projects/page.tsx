import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

async function getProjects() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "client") return [];
  if (!session.user.clientId) return [];

  await connectDB();
  const projects = await Project.find({
    clientRef: session.user.clientId,
    portalVisible: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  return projects.map((p) => ({
    _id: String(p._id),
    title: p.title,
    description: p.description,
    coverImage: p.coverImage,
    category: p.category,
    progress: p.progress ?? 0,
  }));
}

export default async function PortalProjectsPage() {
  const projects = await getProjects();
  if (!projects) redirect("/login");

  return (
    <div>
      <div className="mb-12">
        <p className="eyebrow mb-3">— Your Work</p>
        <h1 className="display-md text-balance">Projects</h1>
        <p className="text-bone-300 mt-2">{projects.length} active</p>
      </div>

      {projects.length === 0 ? (
        <div className="border border-ink-800 rounded-sm p-16 text-center">
          <p className="text-bone-300">No projects yet. You'll see them here as soon as we start.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((p) => (
            <Link
              key={p._id}
              href={`/portal/projects/${p._id}`}
              className="group block border border-ink-800 hover:border-fire/40 rounded-sm overflow-hidden transition-colors"
            >
              <div className="relative aspect-[16/9] bg-ink-900">
                {p.coverImage && (
                  <Image
                    src={p.coverImage}
                    alt={p.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent opacity-60" />
                <div className="absolute top-4 right-4 h-10 w-10 grid place-items-center rounded-full bg-bone/0 group-hover:bg-bone text-bone group-hover:text-ink transition-all">
                  <ArrowUpRight className="h-4 w-4 group-hover:rotate-45 transition-transform" />
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-bone-400 mb-2 capitalize">
                  {p.category.replace("-", " ")}
                </p>
                <h2 className="font-display text-xl font-medium tracking-tight group-hover:text-fire transition-colors mb-2">
                  {p.title}
                </h2>
                <p className="text-sm text-bone-300 line-clamp-2 mb-4 text-pretty">{p.description}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-fire transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="text-xs text-bone-400 font-mono">{p.progress}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
