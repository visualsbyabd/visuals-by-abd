"use client";

import { motion } from "framer-motion";

const DEFAULT_STEPS = [
  { number: "01", title: "Discover", description: "Deep listening. Brand audit, audience study, competitive landscape. We define what makes you unmistakable." },
  { number: "02", title: "Define", description: "Strategy, positioning, creative direction. The compass for every decision that follows." },
  { number: "03", title: "Design", description: "Identity systems, motion design, visual storytelling. Concept-driven, craft-obsessed execution." },
  { number: "04", title: "Deliver", description: "Launch-ready assets, brand guidelines, motion libraries. Everything you need to ship and scale." },
];

export type ProcessStep = { number: string; title: string; description: string };
export type ProcessContent = { eyebrow?: string; headline?: string; steps?: ProcessStep[] };

function emphasize(text: string) {
  const parts = text.split(/(<em>.*?<\/em>)/gi);
  return parts.map((p, i) => {
    const m = /<em>(.*?)<\/em>/i.exec(p);
    if (m) return <span key={i} className="italic font-light text-fire">{m[1]}</span>;
    return <span key={i}>{p}</span>;
  });
}

export function Process({ content }: { content?: ProcessContent }) {
  const eyebrow = content?.eyebrow ?? "— Process";
  const headline = content?.headline ?? "Method behind the <em>magic</em>.";
  const steps = content?.steps?.length ? content.steps : DEFAULT_STEPS;

  return (
    <section className="border-y border-ink-800 bg-ink-950">
      <div className="container py-32 md:py-40">
        <div className="grid lg:grid-cols-12 gap-8 mb-20">
          <div className="lg:col-span-6">
            <p className="eyebrow mb-6">{eyebrow}</p>
            <h2 className="display-lg text-balance">{emphasize(headline)}</h2>
          </div>
        </div>

        <div className={`grid md:grid-cols-2 lg:grid-cols-${Math.min(steps.length, 4)} gap-px bg-ink-800`}>
          {steps.map((step, i) => (
            <motion.div
              key={`${step.number}-${i}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-ink-950 p-10 relative group"
            >
              <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-fire to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
              <p className="font-display text-7xl font-light text-fire/40 mb-8 leading-none">
                {step.number}
              </p>
              <h3 className="font-display text-2xl font-medium mb-4 tracking-tight">{step.title}</h3>
              <p className="text-bone-300 leading-relaxed text-pretty">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
