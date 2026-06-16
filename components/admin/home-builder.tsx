"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { updateHomePage } from "@/features/home/actions";

type Step = { number: string; title: string; description: string };

export type HomeDoc = {
  heroEyebrow: string;
  heroHeadline: string;
  heroDescription: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroSecondaryCtaLabel?: string;
  heroSecondaryCtaHref?: string;
  featuredEyebrow: string;
  featuredHeadline: string;
  servicesEyebrow: string;
  servicesHeadline: string;
  servicesIntro?: string;
  aboutEyebrow: string;
  aboutHeadline: string;
  aboutBody: string;
  aboutCtaLabel?: string;
  aboutCtaHref?: string;
  processEyebrow: string;
  processHeadline: string;
  processSteps: Step[];
  testimonialsEyebrow: string;
  testimonialsHeadline: string;
  ctaEyebrow: string;
  ctaHeadline: string;
  ctaDescription?: string;
  ctaLabel: string;
  ctaHref: string;
  enabled: boolean;
};

const SECTIONS = [
  { id: "hero", label: "01 — Hero" },
  { id: "featured", label: "02 — Featured Work intro" },
  { id: "services", label: "03 — Services intro" },
  { id: "about", label: "04 — About preview" },
  { id: "process", label: "05 — Process" },
  { id: "testimonials", label: "06 — Testimonials intro" },
  { id: "cta", label: "07 — Contact CTA" },
] as const;

export function HomeBuilder({ initial }: { initial: HomeDoc }) {
  const router = useRouter();
  const [data, setData] = useState<HomeDoc>(initial);
  const [open, setOpen] = useState<string>("hero");
  const [saving, startSaving] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<HomeDoc>) {
    setData((d) => ({ ...d, ...p }));
  }

  function save() {
    setError(null);
    startSaving(async () => {
      const res = await updateHomePage(data);
      if (res.ok) {
        setSavedAt(Date.now());
        setTimeout(() => setSavedAt(null), 2500);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 p-4 border border-ink-800 rounded-sm flex-wrap">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.enabled}
            onChange={(e) => patch({ enabled: e.target.checked })}
            className="peer sr-only"
          />
          <span className="relative h-5 w-9 rounded-full bg-ink-800 peer-checked:bg-fire transition-colors peer-checked:[&>span]:translate-x-4">
            <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-bone transition-transform" />
          </span>
          <span className="text-sm">
            Use CMS content on the homepage
            <span className="block text-xs text-bone-400">
              When off, the hardcoded fallback renders instead.
            </span>
          </span>
        </label>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-bone-300 hover:text-fire transition-colors"
        >
          View live homepage
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {SECTIONS.map((s) => (
        <section key={s.id} className="border border-ink-800 rounded-sm overflow-hidden">
          <button
            onClick={() => setOpen(open === s.id ? "" : s.id)}
            className="w-full flex items-center justify-between p-5 hover:bg-ink-950 transition-colors"
          >
            <p className="font-display text-lg font-medium">{s.label}</p>
            <ChevronDown
              className={`h-4 w-4 text-bone-400 transition-transform ${open === s.id ? "rotate-180" : ""}`}
            />
          </button>
          {open === s.id && (
            <div className="p-6 border-t border-ink-800 space-y-5 bg-ink-950">
              {s.id === "hero" && <HeroSection data={data} patch={patch} />}
              {s.id === "featured" && <FeaturedSection data={data} patch={patch} />}
              {s.id === "services" && <ServicesSection data={data} patch={patch} />}
              {s.id === "about" && <AboutSection data={data} patch={patch} />}
              {s.id === "process" && <ProcessSection data={data} patch={patch} />}
              {s.id === "testimonials" && <TestimonialsSection data={data} patch={patch} />}
              {s.id === "cta" && <CtaSection data={data} patch={patch} />}
            </div>
          )}
        </section>
      ))}

      <div className="sticky bottom-4 z-20 mt-8 flex items-center justify-end gap-3 p-3 bg-ink-950/90 backdrop-blur border border-ink-800 rounded-sm">
        {error && (
          <div className="flex items-center gap-2 text-xs text-fire mr-auto">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}
        {savedAt && !error && (
          <div className="flex items-center gap-2 text-xs text-fire mr-auto">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved · live in a moment
          </div>
        )}
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow disabled:opacity-50 text-bone px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-[0_0_40px_-10px_rgba(214,40,40,0.6)]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

/* ─────────── Section blocks ─────────── */

function HeroSection({ data, patch }: { data: HomeDoc; patch: (p: Partial<HomeDoc>) => void }) {
  return (
    <>
      <FieldText label="Eyebrow line" value={data.heroEyebrow} onChange={(v) => patch({ heroEyebrow: v })} />
      <FieldText
        label="Headline *"
        value={data.heroHeadline}
        onChange={(v) => patch({ heroHeadline: v })}
        help="Wrap an italic word in <em>…</em> for fire-red emphasis."
      />
      <FieldTextarea
        label="Description"
        value={data.heroDescription}
        onChange={(v) => patch({ heroDescription: v })}
        rows={3}
      />
      <CtaPair
        label="Primary CTA"
        labelValue={data.heroPrimaryCtaLabel}
        hrefValue={data.heroPrimaryCtaHref}
        onLabelChange={(v) => patch({ heroPrimaryCtaLabel: v })}
        onHrefChange={(v) => patch({ heroPrimaryCtaHref: v })}
      />
      <CtaPair
        label="Secondary CTA"
        labelValue={data.heroSecondaryCtaLabel ?? ""}
        hrefValue={data.heroSecondaryCtaHref ?? ""}
        onLabelChange={(v) => patch({ heroSecondaryCtaLabel: v })}
        onHrefChange={(v) => patch({ heroSecondaryCtaHref: v })}
      />
    </>
  );
}

function FeaturedSection({ data, patch }: { data: HomeDoc; patch: (p: Partial<HomeDoc>) => void }) {
  return (
    <>
      <FieldText label="Eyebrow" value={data.featuredEyebrow} onChange={(v) => patch({ featuredEyebrow: v })} />
      <FieldText label="Headline" value={data.featuredHeadline} onChange={(v) => patch({ featuredHeadline: v })} />
      <Note>Projects shown here come from the projects with "Featured" enabled. Manage them under <strong>Admin → Projects</strong>.</Note>
    </>
  );
}

function ServicesSection({ data, patch }: { data: HomeDoc; patch: (p: Partial<HomeDoc>) => void }) {
  return (
    <>
      <FieldText label="Eyebrow" value={data.servicesEyebrow} onChange={(v) => patch({ servicesEyebrow: v })} />
      <FieldText label="Headline" value={data.servicesHeadline} onChange={(v) => patch({ servicesHeadline: v })} />
      <FieldTextarea label="Intro paragraph" value={data.servicesIntro ?? ""} onChange={(v) => patch({ servicesIntro: v })} rows={3} />
      <Note>Service cards come from <strong>Admin → Services</strong>.</Note>
    </>
  );
}

function AboutSection({ data, patch }: { data: HomeDoc; patch: (p: Partial<HomeDoc>) => void }) {
  return (
    <>
      <FieldText label="Eyebrow" value={data.aboutEyebrow} onChange={(v) => patch({ aboutEyebrow: v })} />
      <FieldText label="Headline" value={data.aboutHeadline} onChange={(v) => patch({ aboutHeadline: v })} />
      <FieldTextarea
        label="Body"
        value={data.aboutBody}
        onChange={(v) => patch({ aboutBody: v })}
        rows={5}
        help="Paragraphs separated by blank lines."
      />
      <CtaPair
        label="CTA"
        labelValue={data.aboutCtaLabel ?? ""}
        hrefValue={data.aboutCtaHref ?? ""}
        onLabelChange={(v) => patch({ aboutCtaLabel: v })}
        onHrefChange={(v) => patch({ aboutCtaHref: v })}
      />
    </>
  );
}

function ProcessSection({ data, patch }: { data: HomeDoc; patch: (p: Partial<HomeDoc>) => void }) {
  function updateStep(i: number, next: Step) {
    patch({ processSteps: data.processSteps.map((s, idx) => (idx === i ? next : s)) });
  }
  function removeStep(i: number) {
    patch({ processSteps: data.processSteps.filter((_, idx) => idx !== i) });
  }
  function addStep() {
    const n = data.processSteps.length + 1;
    patch({
      processSteps: [
        ...data.processSteps,
        { number: String(n).padStart(2, "0"), title: "", description: "" },
      ],
    });
  }
  function move(i: number, delta: -1 | 1) {
    const j = i + delta;
    if (j < 0 || j >= data.processSteps.length) return;
    const next = [...data.processSteps];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ processSteps: next });
  }

  return (
    <>
      <FieldText label="Eyebrow" value={data.processEyebrow} onChange={(v) => patch({ processEyebrow: v })} />
      <FieldText label="Headline" value={data.processHeadline} onChange={(v) => patch({ processHeadline: v })} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">Steps</label>
          <button
            type="button"
            onClick={addStep}
            className="inline-flex items-center gap-1 text-xs border border-ink-700 hover:border-fire hover:text-fire px-2.5 py-1 rounded-full transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add step
          </button>
        </div>
        {data.processSteps.length === 0 ? (
          <p className="text-xs text-bone-400 border border-dashed border-ink-700 rounded-sm py-4 text-center">
            No steps yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.processSteps.map((step, i) => (
              <li key={i} className="border border-ink-800 rounded-sm p-3 bg-ink-900/30">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-2">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-bone-400 hover:text-fire disabled:opacity-30">
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </button>
                    <span className="text-[10px] text-bone-400 font-mono py-0.5">{i + 1}</span>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === data.processSteps.length - 1} className="text-bone-400 hover:text-fire disabled:opacity-30">
                      <GripVertical className="h-3 w-3 -rotate-90" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-[80px_1fr] gap-3">
                      <input
                        value={step.number}
                        onChange={(e) => updateStep(i, { ...step, number: e.target.value })}
                        placeholder="01"
                        className="bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 font-mono"
                      />
                      <input
                        value={step.title}
                        onChange={(e) => updateStep(i, { ...step, title: e.target.value })}
                        placeholder="Title"
                        className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40"
                      />
                    </div>
                    <textarea
                      value={step.description}
                      onChange={(e) => updateStep(i, { ...step, description: e.target.value })}
                      placeholder="Describe what happens at this step"
                      rows={2}
                      className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 resize-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    className="p-1.5 hover:bg-fire/10 rounded-sm text-bone-300 hover:text-fire transition-colors flex-shrink-0"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function TestimonialsSection({ data, patch }: { data: HomeDoc; patch: (p: Partial<HomeDoc>) => void }) {
  return (
    <>
      <FieldText label="Eyebrow" value={data.testimonialsEyebrow} onChange={(v) => patch({ testimonialsEyebrow: v })} />
      <FieldText label="Headline" value={data.testimonialsHeadline} onChange={(v) => patch({ testimonialsHeadline: v })} />
      <Note>Testimonials shown here come from records with "Featured" enabled. Manage them under <strong>Admin → Testimonials</strong>.</Note>
    </>
  );
}

function CtaSection({ data, patch }: { data: HomeDoc; patch: (p: Partial<HomeDoc>) => void }) {
  return (
    <>
      <FieldText label="Eyebrow" value={data.ctaEyebrow} onChange={(v) => patch({ ctaEyebrow: v })} />
      <FieldText label="Headline" value={data.ctaHeadline} onChange={(v) => patch({ ctaHeadline: v })} />
      <FieldTextarea label="Description" value={data.ctaDescription ?? ""} onChange={(v) => patch({ ctaDescription: v })} rows={3} />
      <CtaPair
        label="CTA button"
        labelValue={data.ctaLabel}
        hrefValue={data.ctaHref}
        onLabelChange={(v) => patch({ ctaLabel: v })}
        onHrefChange={(v) => patch({ ctaHref: v })}
      />
    </>
  );
}

/* ─────────── Atomics ─────────── */

function FieldText({
  label, value, onChange, placeholder, help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-0 border-b border-ink-700 h-11 text-sm focus:outline-none focus:border-fire"
      />
      {help && <p className="text-xs text-bone-400">{help}</p>}
    </div>
  );
}

function FieldTextarea({
  label, value, onChange, placeholder, rows = 4, help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  help?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 resize-none leading-relaxed"
      />
      {help && <p className="text-xs text-bone-400">{help}</p>}
    </div>
  );
}

function CtaPair({
  label, labelValue, hrefValue, onLabelChange, onHrefChange,
}: {
  label: string;
  labelValue: string;
  hrefValue: string;
  onLabelChange: (v: string) => void;
  onHrefChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">{label}</label>
      <div className="grid grid-cols-2 gap-3">
        <input
          value={labelValue}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="Button label"
          className="bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40"
        />
        <input
          value={hrefValue}
          onChange={(e) => onHrefChange(e.target.value)}
          placeholder="/path or https://..."
          className="bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 font-mono"
        />
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-fire/30 bg-fire/5 p-3 text-xs text-bone-300">
      {children}
    </div>
  );
}
