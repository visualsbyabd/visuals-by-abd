"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";

const disciplines = ["Brand Identity", "Motion Design", "Video Editing", "Web Design", "Creative Direction"];

export type HeroContent = {
  eyebrow?: string;
  headline?: string; // Plain text or with `<em>…</em>` for italic-red emphasis
  description?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

const DEFAULTS: Required<HeroContent> = {
  eyebrow: "Abdullah Tharwat — Creative Director, est. Cairo",
  headline: "Visual Stories That <em>Move</em> People.",
  description:
    "I create brands, identities, videos, motion graphics, and digital experiences that leave a lasting impression.",
  primaryCta: { label: "View Work", href: "/projects" },
  secondaryCta: { label: "Let's Work Together", href: "/contact" },
};

/**
 * Parses a headline string with optional `<em>…</em>` emphasis into word tokens
 * suitable for the staged reveal animation. Each token knows whether it's the
 * fire-italic emphasis word so the animation handles both cases consistently.
 */
function tokenizeHeadline(headline: string): { word: string; emphasis: boolean }[] {
  // Sanitize: strip every tag except <em>
  const safe = headline.replace(/<(?!\/?em\b)[^>]*>/gi, "");
  const tokens: { word: string; emphasis: boolean }[] = [];
  // Split into segments alternating between non-em text and em-wrapped text
  const re = /<em>([\s\S]*?)<\/em>|([^<]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(safe)) !== null) {
    const text = (match[1] ?? match[2] ?? "").trim();
    if (!text) continue;
    const emphasis = match[1] !== undefined;
    for (const word of text.split(/\s+/)) {
      if (word) tokens.push({ word, emphasis });
    }
  }
  return tokens;
}

export function Hero({ content }: { content?: HeroContent }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const eyebrow = content?.eyebrow ?? DEFAULTS.eyebrow;
  const description = content?.description ?? DEFAULTS.description;
  const primary = content?.primaryCta ?? DEFAULTS.primaryCta;
  const secondary = content?.secondaryCta ?? DEFAULTS.secondaryCta;
  const tokens = tokenizeHeadline(content?.headline ?? DEFAULTS.headline);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden grain">
      {/* Layered atmospheric backdrop */}
      <div className="absolute inset-0 -z-10">
        {/* Fire glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[1200px] rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(214,40,40,0.25) 0%, transparent 60%)",
          }}
        />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink" />
      </div>

      <motion.div style={{ y, opacity }} className="container pt-40 pb-24 relative">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center gap-4 mb-10"
        >
          <span className="h-px w-12 bg-fire" />
          <span className="eyebrow">{eyebrow}</span>
        </motion.div>

        {/* Headline — staged word reveal */}
        <h1 className="display-xl text-balance max-w-[18ch]">
          {tokens.map((t, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 60, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 1.1,
                delay: 0.4 + i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="inline-block mr-[0.25em]"
            >
              {t.emphasis ? (
                <span className="relative inline-block">
                  <span className="relative z-10 italic font-display font-light text-fire">{t.word}</span>
                </span>
              ) : (
                t.word
              )}
            </motion.span>
          ))}
        </h1>

        {/* Subhead + actions row */}
        <div className="mt-16 grid lg:grid-cols-12 gap-10 items-end">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="lg:col-span-6"
          >
            <p className="text-lg md:text-xl text-bone-300 text-pretty max-w-xl leading-relaxed">
              {description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="lg:col-span-6 flex flex-wrap items-center gap-4 lg:justify-end"
          >
            <Link
              href={primary.href}
              className="group inline-flex items-center gap-3 bg-fire hover:bg-fire-glow text-bone px-7 py-4 rounded-full transition-all shadow-[0_0_60px_-10px_rgba(214,40,40,0.6)]"
            >
              <span className="font-medium">{primary.label}</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
            </Link>
            {secondary.label && (
              <Link
                href={secondary.href}
                className="group inline-flex items-center gap-3 border border-ink-700 hover:border-bone text-bone px-7 py-4 rounded-full transition-all"
              >
                <span className="font-medium">{secondary.label}</span>
              </Link>
            )}
          </motion.div>
        </div>

        {/* Discipline marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
          className="mt-32 border-t border-ink-800 pt-8"
        >
          <p className="eyebrow mb-6">Disciplines</p>
          <div className="overflow-hidden">
            <div className="flex gap-12 animate-marquee whitespace-nowrap">
              {[...disciplines, ...disciplines, ...disciplines].map((d, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-12 font-display text-3xl md:text-5xl font-light text-bone-300"
                >
                  {d}
                  <span className="text-fire">✦</span>
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-bone-400 text-xs uppercase tracking-[0.3em]"
      >
        <span>Scroll</span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </motion.div>
    </section>
  );
}
