"use client";

import { motion } from "framer-motion";
import { getServiceIcon } from "@/lib/service-icons";

type ServiceCard = {
  title: string;
  description: string;
  icon: string;
  deliverables: string[];
};

const FALLBACK_SERVICES: ServiceCard[] = [
  { title: "Brand Identity", icon: "Palette", description: "Logo systems, visual languages, and identity guidelines that build recognition and trust.", deliverables: ["Logo Design", "Visual System", "Guidelines"] },
  { title: "Video Editing", icon: "Film", description: "Cinematic edits, narrative storytelling, color grading, and post-production craft.", deliverables: ["Promo Videos", "Reels", "Documentaries"] },
  { title: "Motion Design", icon: "Sparkles", description: "Animated logos, kinetic typography, motion identities, and broadcast-grade graphics.", deliverables: ["Logo Reveals", "Explainers", "Title Sequences"] },
  { title: "Graphic Design", icon: "Layers", description: "Print, editorial, social, and packaging design with editorial precision.", deliverables: ["Print", "Editorial", "Social Media"] },
  { title: "Web Design", icon: "Code2", description: "Immersive websites and interactive experiences built to convert and impress.", deliverables: ["Landing Pages", "Portfolios", "Brand Sites"] },
  { title: "Creative Direction", icon: "Compass", description: "Strategic creative leadership — concept development through final execution.", deliverables: ["Strategy", "Art Direction", "Campaign Concepts"] },
];

export type ServicesContent = { eyebrow?: string; headline?: string; intro?: string };

function emphasize(text: string) {
  const parts = text.split(/(<em>.*?<\/em>)/gi);
  return parts.map((p, i) => {
    const m = /<em>(.*?)<\/em>/i.exec(p);
    if (m) return <span key={i} className="italic font-light text-fire">{m[1]}</span>;
    return <span key={i}>{p}</span>;
  });
}

export function ServicesPreview({
  content,
  services,
}: {
  content?: ServicesContent;
  services?: ServiceCard[];
}) {
  const eyebrow = content?.eyebrow ?? "— What I Do";
  const headline = content?.headline ?? "Six disciplines.\n<em>One vision.</em>";
  const intro =
    content?.intro ??
    "Multidisciplinary by design. Every brand, every frame, every pixel — built with the same relentless attention to craft and the same clear point of view.";
  const list = services && services.length > 0 ? services : FALLBACK_SERVICES;

  return (
    <section className="border-t border-ink-800 bg-ink-950 relative overflow-hidden">
      <div className="container py-32 md:py-40">
        <div className="grid lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-6">{eyebrow}</p>
            <h2 className="display-lg text-balance whitespace-pre-line">
              {emphasize(headline)}
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 flex items-end">
            <p className="text-lg text-bone-300 leading-relaxed text-pretty whitespace-pre-line">
              {intro}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-800">
          {list.map((service, i) => {
            const Icon = getServiceIcon(service.icon);
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="group bg-ink-950 hover:bg-ink-900 p-8 lg:p-10 transition-all duration-500 relative cursor-default"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-fire scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                <div className="flex items-start justify-between mb-8">
                  <Icon className="h-7 w-7 text-fire" strokeWidth={1.5} />
                  <span className="text-xs text-bone-400 font-mono">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="font-display text-2xl font-medium mb-4 tracking-tight">{service.title}</h3>
                <p className="text-bone-300 text-pretty leading-relaxed mb-6">{service.description}</p>
                <ul className="space-y-1 text-sm text-bone-400">
                  {service.deliverables.map((d) => (
                    <li key={d} className="flex items-center gap-2">
                      <span className="h-px w-3 bg-ink-700" />
                      {d}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
