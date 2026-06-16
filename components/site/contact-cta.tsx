"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export type ContactCtaContent = {
  eyebrow?: string;
  headline?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

function emphasize(text: string) {
  const parts = text.split(/(<em>.*?<\/em>)/gi);
  return parts.map((p, i) => {
    const m = /<em>(.*?)<\/em>/i.exec(p);
    if (m) return <span key={i} className="italic font-light text-fire">{m[1]}</span>;
    return <span key={i}>{p}</span>;
  });
}

export function ContactCTA({ content }: { content?: ContactCtaContent }) {
  const eyebrow = content?.eyebrow ?? "— Currently booking projects for 2026";
  const headline = content?.headline ?? "Ready to make something <em>unforgettable</em>?";
  const description = content?.description ?? "";
  const ctaLabel = content?.ctaLabel ?? "Start a project";
  const ctaHref = content?.ctaHref ?? "/contact";

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(214,40,40,0.18) 0%, transparent 60%)",
        }}
      />
      <div className="container py-32 md:py-48 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="eyebrow mb-8"
        >
          {eyebrow}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="display-xl text-balance max-w-[14ch] mx-auto"
        >
          {emphasize(headline)}
        </motion.h2>
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-8 text-lg text-bone-300 leading-relaxed text-pretty max-w-2xl mx-auto whitespace-pre-line"
          >
            {description}
          </motion.p>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-12"
        >
          <Link
            href={ctaHref}
            className="group inline-flex items-center gap-3 bg-fire hover:bg-fire-glow text-bone px-10 py-5 rounded-full transition-all shadow-[0_0_60px_-10px_rgba(214,40,40,0.6)] text-lg font-medium"
          >
            {ctaLabel}
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:rotate-45" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
