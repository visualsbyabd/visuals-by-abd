import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getAboutContent } from "@/lib/about";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    title: `About — ${s.ownerName}`,
    description: `The story behind ${s.siteName} — ${s.ownerName}, ${s.ownerRole.toLowerCase()}.`,
  };
}

// Hardcoded fallback used when no CMS content exists or when the doc is disabled.
const FALLBACK_TIMELINE = [
  { year: "2018", title: "First commissioned identity", description: "Started taking design seriously. Logos, posters, social. Self-taught, obsessive." },
  { year: "2020", title: "Moved into motion", description: "After Effects, Premiere, Cinema 4D. Brand work began moving — literally." },
  { year: "2022", title: "Visuals by Abd launches", description: "Studio model. Direct client work. Building a body of work with intention." },
  { year: "2024", title: "Multidisciplinary studio", description: "Brand identity, motion, video, web — all under one creative direction." },
  { year: "2026", title: "Now", description: "Working with founders and agencies on premium brand systems and visual stories that ship." },
];

const FALLBACK_TOOLS = [
  { category: "Design", name: "Photoshop · Illustrator · InDesign", description: "Adobe Creative Suite" },
  { category: "Motion", name: "After Effects · Cinema 4D · Blender", description: "Motion + 3D" },
  { category: "Product", name: "Figma · Framer · Notion · Linear", description: "Interface + planning" },
  { category: "Web", name: "Next.js · React · Tailwind · GSAP", description: "Build" },
];

/**
 * Render headlines that allow inline <em>word</em> for an italicized fire-red emphasis,
 * matching the rest of the site's hero pattern. Safe because the input is admin-authored.
 */
function FormattedHeadline({ html }: { html: string }) {
  // Only allow <em>...</em> through; strip every other tag.
  const safe = html.replace(/<(?!\/?em\b)[^>]*>/gi, "");
  const decorated = safe.replace(
    /<em>(.*?)<\/em>/gi,
    '<em class="italic font-light text-fire not-italic-fallback">$1</em>'
  );
  return <span dangerouslySetInnerHTML={{ __html: decorated }} />;
}

export default async function AboutPage() {
  const doc = await getAboutContent();
  const useCms = doc && doc.enabled;

  // Resolve the rendering data — CMS doc or sensible fallbacks
  const heroHeadline = useCms ? doc.heroHeadline : "Designer. Editor. Director. <em>Maker.</em>";
  const heroSubheadline = useCms ? doc.heroSubheadline : "";
  const heroDescription = useCms
    ? doc.heroDescription
    : "I'm Abdullah Tharwat — a Cairo-based creative director working across brand identity, motion design, video editing, and digital experience. I run Visuals by Abd, a one-person studio for clients who want craft over template.";
  const heroImage = useCms ? doc.heroImage : undefined;

  const journeyTitle = useCms ? doc.journeyTitle : "How I got <em>here</em>.";
  const journeyContent = useCms ? doc.journeyContent : "";
  const journeyTimeline =
    useCms && doc.journeyTimeline.length > 0 ? doc.journeyTimeline : FALLBACK_TIMELINE;
  const journeyMedia = useCms ? doc.journeyMedia : [];

  const philosophyTitle = useCms
    ? doc.philosophyTitle
    : "Brand systems should <em>move</em>.";
  const philosophyContent = useCms
    ? doc.philosophyContent
    : `I don't believe in still brands anymore. An identity is no longer a logo file — it's a living system that has to perform in motion, on screen, in narrative, in real-world contexts most designers never test against.\n\nThat's why I built a multidisciplinary practice. The same hand that drew the mark animates the title sequence, edits the launch film, and designs the website. The visual DNA stays intact across every touchpoint — because it has to.`;

  const experienceTitle = useCms ? doc.experienceTitle : "Numbers <em>that matter</em>.";
  const experienceContent = useCms ? doc.experienceContent : undefined;
  const achievements = useCms ? doc.achievements ?? [] : [];

  const toolsTitle = useCms
    ? doc.toolsTitle
    : "The instruments behind the <em>craft</em>.";
  const toolsDescription = useCms ? doc.toolsDescription : undefined;
  const tools = useCms && doc.tools.length > 0 ? doc.tools : FALLBACK_TOOLS;

  const visionTitle = useCms ? doc.visionTitle : "What's <em>next</em>.";
  const visionDescription = useCms
    ? doc.visionDescription
    : "Studios collapse into platforms. Identities collapse into experiences. I'm building toward work that lives across every surface a brand touches — and tools that make that possible at our scale.";
  const visionCtaLabel = useCms ? doc.visionCtaLabel ?? "Start a project" : "Start a project";
  const visionCtaHref = useCms ? doc.visionCtaHref ?? "/contact" : "/contact";

  return (
    <div className="pt-32">
      {/* ── 01 — Hero ── */}
      <section className="container py-16 md:py-24">
        <p className="eyebrow mb-6">— About</p>
        <h1 className="display-xl text-balance max-w-[20ch]">
          <FormattedHeadline html={heroHeadline} />
        </h1>
        {heroSubheadline && (
          <p className="mt-6 text-lg text-fire uppercase tracking-[0.2em]">{heroSubheadline}</p>
        )}
        {heroDescription && (
          <p className="mt-12 text-xl text-bone-300 leading-relaxed max-w-3xl text-pretty whitespace-pre-line">
            {heroDescription}
          </p>
        )}
        {heroImage && (
          <div className="mt-16 relative aspect-[16/9] rounded-sm overflow-hidden bg-ink-900">
            <Image
              src={heroImage}
              alt={doc?.heroImageAlt ?? "Portrait"}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 1280px, 100vw"
            />
          </div>
        )}
      </section>

      {/* ── 02 — Philosophy ── */}
      <section className="border-y border-ink-800 bg-ink-950">
        <div className="container py-24 md:py-32">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <p className="eyebrow mb-6">— Philosophy</p>
              <h2 className="display-md text-balance">
                <FormattedHeadline html={philosophyTitle} />
              </h2>
            </div>
            <div className="lg:col-span-7 space-y-6 text-lg text-bone-300 leading-relaxed text-pretty whitespace-pre-line">
              {philosophyContent}
            </div>
          </div>
        </div>
      </section>

      {/* ── 03 — Journey ── */}
      {journeyTimeline.length > 0 && (
        <section className="container py-24 md:py-32">
          <p className="eyebrow mb-6">— My Journey</p>
          <h2 className="display-lg mb-12 text-balance max-w-[14ch]">
            <FormattedHeadline html={journeyTitle} />
          </h2>
          {journeyContent && (
            <p className="text-lg text-bone-300 leading-relaxed text-pretty max-w-3xl mb-16 whitespace-pre-line">
              {journeyContent}
            </p>
          )}

          {journeyMedia.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
              {journeyMedia.map((m, i) => (
                <div
                  key={i}
                  className="relative aspect-[4/3] rounded-sm overflow-hidden bg-ink-900"
                >
                  {m.type === "image" ? (
                    <Image
                      src={m.url}
                      alt={m.alt ?? ""}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, 50vw"
                    />
                  ) : (
                    <video
                      src={m.url}
                      poster={m.thumbnail}
                      controls
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-px">
            {journeyTimeline.map((item) => (
              <div
                key={`${item.year}-${item.title}`}
                className="grid md:grid-cols-12 gap-6 py-10 border-t border-ink-800 group hover:bg-ink-950 transition-colors px-2 -mx-2 rounded-sm"
              >
                <div className="md:col-span-2">
                  <p className="font-display text-3xl md:text-4xl font-light text-fire">
                    {item.year}
                  </p>
                </div>
                <div className="md:col-span-10">
                  <h3 className="font-display text-2xl md:text-3xl font-medium mb-3 tracking-tight">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-lg text-bone-300 leading-relaxed text-pretty max-w-3xl whitespace-pre-line">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 04 — Experience ── */}
      {achievements.length > 0 && (
        <section className="border-y border-ink-800 bg-ink-950">
          <div className="container py-24 md:py-32">
            <p className="eyebrow mb-6">— Experience</p>
            <h2 className="display-lg mb-8 text-balance max-w-[18ch]">
              <FormattedHeadline html={experienceTitle} />
            </h2>
            {experienceContent && (
              <p className="text-lg text-bone-300 leading-relaxed text-pretty max-w-3xl mb-16 whitespace-pre-line">
                {experienceContent}
              </p>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-800">
              {achievements.map((a, i) => (
                <div key={i} className="bg-ink-950 p-10">
                  <p className="font-display text-5xl md:text-6xl font-light text-fire leading-none mb-3">
                    {a.value}
                  </p>
                  <p className="text-sm text-bone-300 uppercase tracking-wider">{a.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 05 — Tools ── */}
      {tools.length > 0 && (
        <section
          className={
            achievements.length > 0
              ? "container py-24 md:py-32"
              : "border-y border-ink-800 bg-ink-950"
          }
        >
          <div className={achievements.length > 0 ? "" : "container py-24 md:py-32"}>
            <p className="eyebrow mb-6">— Toolbox</p>
            <h2 className="display-lg mb-8 text-balance max-w-[16ch]">
              <FormattedHeadline html={toolsTitle} />
            </h2>
            {toolsDescription && (
              <p className="text-lg text-bone-300 leading-relaxed text-pretty max-w-3xl mb-16 whitespace-pre-line">
                {toolsDescription}
              </p>
            )}
            <div className="grid md:grid-cols-2 gap-px bg-ink-800">
              {tools.map((t, i) => (
                <div key={i} className="bg-ink-950 p-10">
                  {t.category && <p className="eyebrow mb-4">{t.category}</p>}
                  <p className="text-lg text-bone leading-relaxed">{t.name}</p>
                  {t.description && (
                    <p className="text-sm text-bone-400 mt-2">{t.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 06 — Vision / CTA ── */}
      <section className="container py-24 md:py-32">
        <p className="eyebrow mb-6">— What's next</p>
        <h2 className="display-lg mb-8 text-balance max-w-[16ch]">
          <FormattedHeadline html={visionTitle} />
        </h2>
        {visionDescription && (
          <p className="text-xl text-bone-300 leading-relaxed text-pretty max-w-3xl mb-12 whitespace-pre-line">
            {visionDescription}
          </p>
        )}
        {visionCtaLabel && visionCtaHref && (
          <Link
            href={visionCtaHref}
            className="inline-flex items-center gap-3 bg-fire hover:bg-fire-glow text-bone px-7 py-4 rounded-full text-sm font-medium transition-all shadow-[0_0_40px_-10px_rgba(214,40,40,0.6)] group"
          >
            {visionCtaLabel}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
          </Link>
        )}
      </section>
    </div>
  );
}
