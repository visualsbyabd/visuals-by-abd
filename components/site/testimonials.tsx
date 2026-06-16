"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

type Testimonial = {
  _id: string;
  name: string;
  role: string;
  company?: string;
  quote: string;
};

export type TestimonialsContent = { eyebrow?: string; headline?: string };

function emphasize(text: string) {
  const parts = text.split(/(<em>.*?<\/em>)/gi);
  return parts.map((p, i) => {
    const m = /<em>(.*?)<\/em>/i.exec(p);
    if (m) return <span key={i} className="italic font-light text-fire">{m[1]}</span>;
    return <span key={i}>{p}</span>;
  });
}

export function Testimonials({
  items,
  content,
}: {
  items: Testimonial[];
  content?: TestimonialsContent;
}) {
  if (!items.length) return null;
  const eyebrow = content?.eyebrow ?? "— Kind Words";
  const headline = content?.headline ?? "What clients say after we <em>ship</em>.";

  return (
    <section className="container py-32 md:py-40">
      <div className="grid lg:grid-cols-12 gap-8 mb-20">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-6">{eyebrow}</p>
          <h2 className="display-lg text-balance">{emphasize(headline)}</h2>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
        {items.slice(0, 4).map((t, i) => (
          <motion.figure
            key={t._id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.1 }}
            className="group relative border border-ink-800 hover:border-fire/40 p-8 lg:p-10 transition-colors duration-500"
          >
            <Quote className="h-8 w-8 text-fire mb-6" strokeWidth={1.5} />
            <blockquote className="font-display text-xl lg:text-2xl font-light leading-relaxed text-balance">
              "{t.quote}"
            </blockquote>
            <figcaption className="mt-8 pt-6 border-t border-ink-800">
              <p className="font-medium text-bone">{t.name}</p>
              <p className="text-sm text-bone-300 mt-1">
                {t.role}{t.company ? ` · ${t.company}` : ""}
              </p>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
