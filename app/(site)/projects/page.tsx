import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
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
    const projects = await Project.find(query).sort({ order: 1, createdAt: -1 }).lean();
    return projects.map((p) => ({
      _id: String(p._id),
      title: p.title,
      slug: p.slug,
      category: p.category,
      coverImage: p.coverImage,
      year: p.year,
      client: p.client,
      description: p.description,
    }));
  } catch {
    return [];
  }
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const projects = await getProjects(params.category);
  const activeCategory = params.category ?? "all";

  return (
    <div className="pt-32">
      <section className="container py-16 md:py-24">
        <p className="eyebrow mb-6">— All Work, 2023—2026</p>
        <h1 className="display-xl text-balance max-w-[16ch] mb-12">
          Projects with <span className="italic font-light text-fire">point of view</span>.
        </h1>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mt-16 mb-20 border-b border-ink-800 pb-1">
          {categories.map((cat) => {
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

        {projects.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-bone-300">No projects published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
            {projects.map((p, i) => (
              <Link
                key={p._id}
                href={`/projects/${p.slug}`}
                className={`group block ${i % 3 === 0 ? "md:col-span-2" : ""}`}
              >
                <div
                  className={`relative overflow-hidden rounded-sm bg-ink-900 ${
                    i % 3 === 0 ? "aspect-[21/9]" : "aspect-[4/3]"
                  }`}
                >
                  {p.coverImage ? (
                    <Image
                      src={p.coverImage}
                      alt={p.title}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      sizes="(min-width: 768px) 50vw, 100vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-ink-800 to-ink-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
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
                    <h2 className="font-display text-2xl md:text-3xl font-medium tracking-tight">
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
