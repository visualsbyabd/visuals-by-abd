"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

type FeaturedProject = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  coverImage: string;
  year?: number;
  client?: string;
};

const categoryLabels: Record<string, string> = {
  "brand-identity": "Brand Identity",
  "video-editing": "Video Editing",
  "motion-design": "Motion Design",
  "graphic-design": "Graphic Design",
  "web-design": "Web Design",
  "creative-direction": "Creative Direction",
};

export type FeaturedContent = { eyebrow?: string; headline?: string };

function emphasize(text: string) {
  const parts = text.split(/(<em>.*?<\/em>)/gi);
  return parts.map((p, i) => {
    const m = /<em>(.*?)<\/em>/i.exec(p);
    if (m) return <span key={i} className="italic font-light text-fire">{m[1]}</span>;
    return <span key={i}>{p}</span>;
  });
}

export function FeaturedWork({
  projects,
  content,
}: {
  projects: FeaturedProject[];
  content?: FeaturedContent;
}) {
  const eyebrow = content?.eyebrow ?? "— Selected Work, 2023—2026";
  const headline = content?.headline ?? "Crafted with <em>obsession</em>.";

  if (!projects.length) {
    return (
      <section className="container py-32">
        <p className="eyebrow mb-6">Selected Work</p>
        <div className="grid lg:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/5] bg-ink-900 rounded-sm" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="container py-32 md:py-48 relative">
      {/* Section header */}
      <div className="grid lg:grid-cols-12 gap-8 mb-20 items-end">
        <div className="lg:col-span-8">
          <p className="eyebrow mb-6">{eyebrow}</p>
          <h2 className="display-lg text-balance max-w-[14ch]">{emphasize(headline)}</h2>
        </div>
        <div className="lg:col-span-4 lg:text-right">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-medium border-b border-ink-700 hover:border-fire hover:text-fire pb-1 transition-all group"
          >
            View all projects
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
          </Link>
        </div>
      </div>

      {/* Asymmetric grid */}
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
        {projects.slice(0, 4).map((project, i) => {
          const layouts = [
            "lg:col-span-7 lg:row-span-2 aspect-[4/5]",
            "lg:col-span-5 aspect-[4/3] lg:mt-12",
            "lg:col-span-5 aspect-[4/3]",
            "lg:col-span-7 aspect-[16/10] lg:-mt-16",
          ];

          return (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={layouts[i] || "lg:col-span-6 aspect-[4/3]"}
            >
              <Link href={`/projects/${project.slug}`} className="group block h-full relative overflow-hidden rounded-sm bg-ink-900">
                <div className="absolute inset-0 transition-transform duration-1000 group-hover:scale-105">
                  {project.coverImage ? (
                    <Image
                      src={project.coverImage}
                      alt={project.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-ink-800 to-ink-900" />
                  )}
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent opacity-90" />

                {/* Hover reveal */}
                <div className="absolute top-6 right-6 z-10">
                  <div className="h-12 w-12 grid place-items-center rounded-full bg-bone text-ink opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-45">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>

                {/* Project info */}
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 z-10">
                  <div className="flex items-center gap-3 mb-3 text-xs uppercase tracking-[0.2em] text-bone-300">
                    <span>{categoryLabels[project.category] ?? project.category}</span>
                    {project.year && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-fire" />
                        <span>{project.year}</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-medium tracking-tight">
                    {project.title}
                  </h3>
                  {project.client && (
                    <p className="text-sm text-bone-300 mt-1">for {project.client}</p>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
