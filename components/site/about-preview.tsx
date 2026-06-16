"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export type AboutPreviewContent = {
  eyebrow?: string;
  headline?: string;
  body?: string;
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

export function AboutPreview({ content }: { content?: AboutPreviewContent }) {
  const eyebrow = content?.eyebrow ?? "— About";
  const headline =
    content?.headline ??
    "A multidisciplinary creative director shaping brands that <em>resonate</em>.";
  const body =
    content?.body ??
    "I'm Abdullah Tharwat — a Cairo-based creative director and the studio behind Visuals by Abd. I help founders, agencies, and growing brands turn vision into visual systems people remember.\n\nMy work crosses disciplines on purpose: a brand identity that translates seamlessly into motion; a video edit that carries the same DNA as the print collateral; a website that feels like the natural extension of an identity system.";
  const ctaLabel = content?.ctaLabel ?? "Read my story";
  const ctaHref = content?.ctaHref ?? "/about";

  return (
    <section className="container py-32 md:py-40">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="lg:col-span-5 order-2 lg:order-1"
        >
          <div className="aspect-[4/5] bg-ink-900 relative overflow-hidden rounded-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-fire/20 via-transparent to-ink" />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 30%, rgba(214,40,40,0.4) 0%, transparent 50%)",
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="font-display text-7xl md:text-9xl font-medium tracking-tightest leading-none text-bone">
                AT.
              </p>
              <p className="eyebrow mt-4">Abdullah Tharwat — Creative Director</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="lg:col-span-7 order-1 lg:order-2"
        >
          <p className="eyebrow mb-6">{eyebrow}</p>
          <h2 className="display-lg mb-10 text-balance">{emphasize(headline)}</h2>
          <div className="space-y-6 text-lg text-bone-300 leading-relaxed text-pretty max-w-2xl whitespace-pre-line">
            {body.split(/\n\n+/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {ctaLabel && (
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-3 mt-12 font-medium border-b border-ink-700 hover:border-fire hover:text-fire pb-1 transition-all group"
            >
              {ctaLabel}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}
