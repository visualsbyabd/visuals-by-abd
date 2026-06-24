import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Pin } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Projects",
  description: "A selection of work across brand identity, motion, video, and digital experiences.",
};

const categories = [
  { value: "all", label: "All Work" },
  { value: "brand-identity", label: "Brand Identity" },
  { value: "motion-design", label: "Motion Design" },
  { value: "video-editing", label: "Video Editing" },
  { value: "graphic-design", label: "Graphic Design" },
  { value: "web-design", label: "Web Design" },
];

const categoryLabels: Record<string, string> = Object.fromEntries(
  categories.filter((c) => c.value !== "all").map((c) => [c.value, c.label])
);

async function getProjects(category?: string) {
  try {
    await connectDB();
    const query: Record<string, unknown> = { status: "published" };
    if (category && category !== "all") query.category = category;
    // Only fetch the fields the index card grid renders. Without this projection
    // MongoDB returns each project's entire media array — for a portfolio with
    // many large projects, that's hundreds of MB transferred just to render
    // thumbnail cards. The cover image is a single URL string, not the media[].
    const projects = await Project.find(query)
      .select("title slug category coverImage year client description isPinned")
      // Pinned projects bubble to the top of whichever category view the user is on.
      // When no category filter is active, every category's pinned project still appears first.
      .sort({ isPinned: -1, order: 1, createdAt: -1 })
      .lean();
    return projects.map((p) => ({
      _id: String(p._id),
      title: p.title,
      slug: p.slug,
      category: p.category,
      coverImage: p.coverImage,
      year: p.year,
      client: p.client,
      description: p.description,
      isPinned: !!p.isPinned,
    }));
  } catch {
    return [];
  }
}

/**
 * Returns a map of category → count of published projects in that category.
 * Drives the filter row — categories with zero projects are hidden until at
 * least one project lands in them. "All Work" stays visible whenever any
 * project exists at all.
 */
async function getCategoryCounts(): Promise<Record<string, number>> {
  try {
    await connectDB();
    const result = await Project.aggregate<{ _id: string; count: number }>([
      { $match: { status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(result.map((r) => [r._id, r.count]));
  } catch {
    return {};
  }
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  // Run the two queries in parallel — counts are cheap because they're a single
  // grouped aggregation, not a per-category roundtrip.
  const [projects, counts] = await Promise.all([
    getProjects(params.category),
    getCategoryCounts(),
  ]);
  const activeCategory = params.category ?? "all";

  // Hide categories with zero projects. "All Work" stays as long as any project
  // exists. The currently-active category is also kept visible even if it would
  // otherwise filter out — that way the user always sees which filter is on.
  const totalProjects = Object.values(counts).reduce((s, n) => s + n, 0);
  const visibleCategories = categories.filter((c) => {
    if (c.value === "all") return totalProjects > 0;
    if (c.value === activeCategory) return true;
    return (counts[c.value] ?? 0) > 0;
  });

  return (
    <div className="pt-32">
      <section className="container py-16 md:py-24">
        <p className="eyebrow mb-6">— All Work, 2023—2026</p>
        <h1 className="display-xl text-balance max-w-[16ch] mb-12">
          Projects with <span className="italic font-light text-fire">point of view</span>.
        </h1>

        {/* Category filter — only categories with at least one project show */}
        {visibleCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-16 mb-20 border-b border-ink-800 pb-1">
            {visibleCategories.map((cat) => {
              const active = activeCategory === cat.value;
              const href = cat.value === "all" ? "/projects" : `/projects?category=${cat.value}`;
              return (
                <Link
                  key={cat.value}
                  href={href}
                  className={`px-5 py-3 text-sm font-medium tracking-wide transition-colors relative ${
                    active ? "text-bone" : "text-bone-300 hover:text-bone"
                  }`}
                >
                  {cat.label}
                  {active && <span className="absolute -bottom-px left-0 right-0 h-px bg-fire" />}
                </Link>
              );
            })}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-bone-300">No projects published yet. Check back soon.</p>
          </div>
        ) : (
          // Uniform card grid — every project gets the same treatment. No hero
          // slot, no asymmetric wide cards. The "main" project is featured on the
          // home page only; on this index we show everything evenly.
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {projects.map((p) => (
              <Link
                key={p._id}
                href={`/projects/${p.slug}`}
                className="group block"
              >
                <div className="relative overflow-hidden rounded-sm bg-ink-900 aspect-[4/5]">
                  {p.coverImage ? (
                    <Image
                      src={p.coverImage}
                      alt={p.title}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-ink-800 to-ink-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                  {p.isPinned && (
                    <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-fire text-bone text-[10px] uppercase tracking-[0.15em] font-medium">
                      <Pin className="h-3 w-3" />
                      Pinned
                    </div>
                  )}
                  <div className="absolute top-6 right-6 h-12 w-12 grid place-items-center rounded-full bg-bone text-ink opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-45">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-bone-300 mb-2">
                      <span>{categoryLabels[p.category] ?? p.category}</span>
                      {p.year && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-fire" />
                          <span>{p.year}</span>
                        </>
                      )}
                    </div>
                    <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight">
                      {p.title}
                    </h2>
                    {p.client && <p className="text-sm text-bone-300 mt-1">for {p.client}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
