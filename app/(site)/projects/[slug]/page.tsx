import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { MediaGallery } from "@/components/site/media-gallery";
import type { ProjectMediaItem } from "@/components/site/media-gallery";
import type { Metadata } from "next";

export const revalidate = 60;

const categoryLabels: Record<string, string> = {
  "brand-identity": "Brand Identity",
  "video-editing": "Video Editing",
  "motion-design": "Motion Design",
  "graphic-design": "Graphic Design",
  "web-design": "Web Design",
  "creative-direction": "Creative Direction",
};

// Initial number of media items rendered on the page. The rest load on demand via
// the "Load more" button which calls loadMoreProjectMedia. Keep this aligned with
// PAGE_SIZE inside MediaGallery so the first batch fills exactly one "page".
const INITIAL_MEDIA_PAGE = 4;

async function getProject(slug: string) {
  try {
    await connectDB();
    // Fetch the project doc but slice the media array to only the first batch.
    // This is the fix for the gateway-payload issue on large projects (200+ items).
    const project = await Project.findOne(
      { slug, status: "published" },
      { media: { $slice: INITIAL_MEDIA_PAGE } }
    ).lean();
    if (!project) return null;

    // Total media count, used by the "Load more" button to know when to stop.
    const [agg] = await Project.aggregate([
      { $match: { _id: project._id } },
      { $project: { count: { $size: { $ifNull: ["$media", []] } } } },
    ]);
    const totalMedia = (agg?.count as number) ?? 0;

    // Track view (fire-and-forget)
    Project.updateOne({ _id: project._id }, { $inc: { views: 1 } }).catch(() => {});

    return { project, totalMedia };
  } catch {
    return null;
  }
}

async function getNextProject(currentId: string) {
  try {
    await connectDB();
    // Only fetch what the "Next project" link actually renders — title + slug.
    // Without this, MongoDB returns the full project document including the
    // entire media array, which can be hundreds of items.
    const next = await Project.findOne({
      status: "published",
      _id: { $ne: currentId },
    })
      .select("title slug")
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return next;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProject(slug);
  if (!result) return { title: "Project not found" };
  const { project } = result;
  return {
    title: project.metaTitle || project.title,
    description: project.metaDescription || project.description,
    openGraph: {
      images: project.coverImage ? [project.coverImage] : [],
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getProject(slug);
  if (!result) notFound();
  const { project, totalMedia } = result;

  const next = await getNextProject(String(project._id));

  // JSON-LD covers only the videos that are loaded on initial render. Including
  // every video in a 200-item project would require fetching the entire media
  // array from MongoDB on every page render, which kills the load time and
  // defeats the pagination. Trade-off: schema.org coverage extends only to the
  // first batch of videos (the ones above the fold). The project page itself
  // is still indexed normally via its title, description, and OG image — the
  // VideoObject entries are bonus structured data, not the primary SEO surface.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const projectUrl = `${siteUrl}/projects/${project.slug}`;
  const videoLd = (project.media ?? [])
    .filter((v) => v.type === "video")
    .map((v) => ({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: v.title || v.alt || project.title,
      description: v.description || project.description,
      thumbnailUrl: v.thumbnail ? (v.thumbnail.startsWith("http") ? v.thumbnail : `${siteUrl}${v.thumbnail}`) : undefined,
      contentUrl: v.url.startsWith("http") ? v.url : `${siteUrl}${v.url}`,
      uploadDate: v.uploadedAt ? new Date(v.uploadedAt).toISOString() : undefined,
      duration:
        v.duration && isFinite(v.duration)
          ? // ISO 8601 duration, e.g. PT30S, PT1M5S
            `PT${Math.floor(v.duration / 60)}M${Math.round(v.duration % 60)}S`
          : undefined,
      embedUrl: projectUrl,
    }));

  return (
    <article className="pt-32">
      {videoLd.length > 0 && (
        <script
          type="application/ld+json"
          // JSON-LD is content for crawlers, not user-facing HTML; safe to inject as a single block.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd.length === 1 ? videoLd[0] : videoLd) }}
        />
      )}
      {/* Hero */}
      <section className="container py-16">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-bone-300 hover:text-fire transition-colors mb-12"
        >
          <ArrowLeft className="h-4 w-4" />
          All Projects
        </Link>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-bone-300 mb-8">
          <span>{categoryLabels[project.category] ?? project.category}</span>
          {project.year && (
            <>
              <span className="h-1 w-1 rounded-full bg-fire" />
              <span>{project.year}</span>
            </>
          )}
          {project.client && (
            <>
              <span className="h-1 w-1 rounded-full bg-fire" />
              <span>for {project.client}</span>
            </>
          )}
        </div>

        <h1 className="display-xl text-balance max-w-[18ch]">{project.title}</h1>
        <p className="mt-10 text-xl text-bone-300 leading-relaxed max-w-2xl text-pretty">
          {project.description}
        </p>
      </section>

      {/* Cover image */}
      {project.coverImage && (
        <section className="container py-12">
          <div className="relative aspect-[16/10] rounded-sm overflow-hidden bg-ink-900">
            <Image
              src={project.coverImage}
              alt={project.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </section>
      )}

      {/* Case study body */}
      <section className="container py-24">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16">
          {/* Sidebar — meta */}
          <aside className="lg:col-span-3 space-y-10 lg:sticky lg:top-32 lg:self-start">
            {project.deliverables && project.deliverables.length > 0 && (
              <div>
                <p className="eyebrow mb-4">Deliverables</p>
                <ul className="space-y-2 text-sm">
                  {project.deliverables.map((d) => (
                    <li key={d} className="flex items-center gap-2 text-bone-300">
                      <span className="h-px w-3 bg-fire" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {project.tags && project.tags.length > 0 && (
              <div>
                <p className="eyebrow mb-4">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((t) => (
                    <span key={t} className="text-xs border border-ink-700 px-3 py-1 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main content */}
          <div className="lg:col-span-9 space-y-20">
            {project.challenge && (
              <section>
                <p className="eyebrow mb-6">01 — The Challenge</p>
                <h2 className="display-md mb-8 text-balance">
                  What we set out to solve.
                </h2>
                <div className="text-lg text-bone-300 leading-relaxed text-pretty whitespace-pre-line">
                  {project.challenge}
                </div>
              </section>
            )}

            {project.strategy && (
              <section>
                <p className="eyebrow mb-6">02 — Strategy</p>
                <h2 className="display-md mb-8 text-balance">
                  The approach.
                </h2>
                <div className="text-lg text-bone-300 leading-relaxed text-pretty whitespace-pre-line">
                  {project.strategy}
                </div>
              </section>
            )}

            {project.process && (
              <section>
                <p className="eyebrow mb-6">03 — Process</p>
                <h2 className="display-md mb-8 text-balance">
                  How it came together.
                </h2>
                <div className="text-lg text-bone-300 leading-relaxed text-pretty whitespace-pre-line">
                  {project.process}
                </div>
              </section>
            )}

            {/* Gallery — mixed images + videos */}
            {(() => {
              const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|m4v|avi)(\?|#|$)/i;

              // Prefer the new media[] structure; fall back to legacy gallery[] for projects pre-migration.
              // Smart fallback: detect video extensions in legacy URLs and tag them correctly.
              const mediaSource: ProjectMediaItem[] =
                project.media && project.media.length > 0
                  ? [...project.media]
                      .sort((a: ProjectMediaItem, b: ProjectMediaItem) => a.order - b.order)
                      .map((m: ProjectMediaItem) => ({
                        type: m.type,
                        url: m.url,
                        thumbnail: m.thumbnail,
                        alt: m.alt,
                        title: m.title,
                        description: m.description,
                        tags: m.tags ?? [],
                        featured: !!m.featured,
                        duration: m.duration,
                        // This is the field that was missing — without it, vertical videos
                        // rendered with the default horizontal aspect ratio.
                        orientation: m.orientation,
                        order: m.order,
                      }))
                  : (project.gallery ?? []).map((src: string, i: number) => ({
                      type: VIDEO_EXTENSIONS.test(src) ? ("video" as const) : ("image" as const),
                      url: src,
                      tags: [],
                      featured: false,
                      order: i,
                    }));

              if (mediaSource.length === 0) return null;

              return (
                <section>
                  <p className="eyebrow mb-6">04 — Execution</p>
                  <h2 className="display-md mb-12 text-balance">In detail.</h2>
                  <MediaGallery
                    items={mediaSource}
                    total={totalMedia}
                    projectId={String(project._id)}
                    projectTitle={project.title}
                    layout={project.mediaLayout ?? "mixed"}
                  />
                </section>
              );
            })()}

            {project.outcome && (
              <section>
                <p className="eyebrow mb-6">05 — Outcome</p>
                <h2 className="display-md mb-8 text-balance">The result.</h2>
                <div className="text-lg text-bone-300 leading-relaxed text-pretty whitespace-pre-line">
                  {project.outcome}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>

      {/* Next project */}
      {next && (
        <section className="border-t border-ink-800 mt-24">
          <Link href={`/projects/${next.slug}`} className="group block py-20 container">
            <p className="eyebrow mb-6">— Next Project</p>
            <div className="flex items-center justify-between gap-8 flex-wrap">
              <h3 className="display-lg group-hover:text-fire transition-colors text-balance max-w-[16ch]">
                {next.title}
              </h3>
              <ArrowUpRight className="h-12 w-12 text-fire transition-transform group-hover:rotate-45" />
            </div>
          </Link>
        </section>
      )}
    </article>
  );
}
