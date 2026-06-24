import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { Media } from "@/models/Media";
import { Testimonial } from "@/models/Testimonial";
import {
  FolderKanban,
  Image as ImageIcon,
  MessageSquareQuote,
  Eye,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

async function getStats() {
  try {
    await connectDB();
    const [
      totalProjects,
      publishedProjects,
      draftProjects,
      mediaCount,
      mediaSize,
      testimonialCount,
      recentProjects,
      totalViews,
    ] = await Promise.all([
      Project.countDocuments({}),
      Project.countDocuments({ status: "published" }),
      Project.countDocuments({ status: "draft" }),
      Media.countDocuments({}),
      Media.aggregate([{ $group: { _id: null, total: { $sum: "$size" } } }]),
      Testimonial.countDocuments({}),
      Project.find().sort({ createdAt: -1 }).limit(5).lean(),
      Project.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
    ]);

    return {
      totalProjects,
      publishedProjects,
      draftProjects,
      mediaCount,
      mediaSize: mediaSize[0]?.total ?? 0,
      testimonialCount,
      totalViews: totalViews[0]?.total ?? 0,
      recentProjects: recentProjects.map((p) => ({
        _id: String(p._id),
        title: p.title,
        slug: p.slug,
        status: p.status,
        category: p.category,
        createdAt: p.createdAt,
      })),
    };
  } catch {
    return {
      totalProjects: 0,
      publishedProjects: 0,
      draftProjects: 0,
      mediaCount: 0,
      mediaSize: 0,
      testimonialCount: 0,
      totalViews: 0,
      recentProjects: [],
    };
  }
}

const statusColors: Record<string, string> = {
  published: "text-fire border-fire/40 bg-fire/5",
  draft: "text-bone-300 border-ink-700 bg-ink-900",
  archived: "text-bone-400 border-ink-700 bg-ink-900",
};

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return (
    <div>
      {/* Heading */}
      <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
        <div>
          <p className="eyebrow mb-3">— Dashboard</p>
          <h1 className="display-md text-balance">
            Welcome back, <span className="italic font-light text-fire">creator</span>.
          </h1>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow text-bone px-6 py-3 rounded-full transition-all text-sm font-medium shadow-[0_0_40px_-10px_rgba(214,40,40,0.6)]"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard
          label="Total Projects"
          value={stats.totalProjects.toString()}
          sub={`${stats.publishedProjects} published`}
          icon={FolderKanban}
          accent
        />
        <StatCard
          label="Total Views"
          value={stats.totalViews.toLocaleString()}
          sub="all time"
          icon={Eye}
        />
        <StatCard
          label="Media Files"
          value={stats.mediaCount.toString()}
          sub={formatBytes(stats.mediaSize)}
          icon={ImageIcon}
        />
        <StatCard
          label="Testimonials"
          value={stats.testimonialCount.toString()}
          sub="active"
          icon={MessageSquareQuote}
        />
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 border border-ink-800 rounded-sm">
          <header className="flex items-center justify-between p-6 border-b border-ink-800">
            <h2 className="font-display text-lg font-medium">Recent Projects</h2>
            <Link
              href="/admin/projects"
              className="text-sm text-bone-300 hover:text-fire transition-colors inline-flex items-center gap-1 group"
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:rotate-45" />
            </Link>
          </header>
          {stats.recentProjects.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-bone-300 mb-6">No projects yet. Create your first.</p>
              <Link
                href="/admin/projects/new"
                className="inline-flex items-center gap-2 border border-ink-700 hover:border-fire hover:text-fire px-5 py-2.5 rounded-full text-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                Create Project
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-ink-800">
              {stats.recentProjects.map((p) => (
                <li key={p._id}>
                  <Link
                    href={`/admin/projects/${p._id}`}
                    className="flex items-center justify-between gap-4 p-6 hover:bg-ink-900 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate group-hover:text-fire transition-colors">
                        {p.title}
                      </p>
                      <p className="text-xs text-bone-400 uppercase tracking-wider mt-1">
                        {p.category.replace("-", " ")}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-3 py-1 border rounded-full uppercase tracking-wider flex-shrink-0 ${
                        statusColors[p.status]
                      }`}
                    >
                      {p.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Quick actions */}
        <section className="border border-ink-800 rounded-sm p-6">
          <h2 className="font-display text-lg font-medium mb-6">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { href: "/admin/projects/new", label: "Add new project", icon: Plus },
              { href: "/admin/media", label: "Upload media", icon: ImageIcon },
              { href: "/admin/testimonials", label: "Manage testimonials", icon: MessageSquareQuote },
              { href: "/admin/settings", label: "Update site settings", icon: ArrowUpRight },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 border border-ink-800 hover:border-fire/40 hover:bg-ink-900 rounded-sm transition-all group"
              >
                <Icon className="h-4 w-4 text-fire" />
                <span className="text-sm">{label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent?: boolean;
}) {
  return (
    <div className={`border rounded-sm p-6 relative overflow-hidden ${accent ? "border-fire/40 bg-fire/5" : "border-ink-800"}`}>
      {accent && (
        <div
          className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #D62828 0%, transparent 70%)" }}
        />
      )}
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs uppercase tracking-[0.2em] text-bone-300">{label}</span>
          <Icon className="h-4 w-4 text-fire" strokeWidth={1.5} />
        </div>
        <p className="font-display text-4xl font-medium tracking-tight mb-1">{value}</p>
        <p className="text-xs text-bone-400">{sub}</p>
      </div>
    </div>
  );
}
