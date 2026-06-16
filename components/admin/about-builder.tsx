"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronDown,
  Save,
  Plus,
  Trash2,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Film,
  Image as ImageIcon,
  X,
  GripVertical,
  ExternalLink,
} from "lucide-react";
import { updateAboutPage } from "@/features/about/actions";

type Media = { type: "image" | "video"; url: string; thumbnail?: string; alt?: string };
type TimelineEntry = { year: string; title: string; description: string };
type Achievement = { label: string; value: string };
type Tool = { name: string; description?: string; icon?: string; category?: string };

type AboutDoc = {
  heroHeadline: string;
  heroSubheadline?: string;
  heroDescription?: string;
  heroImage?: string;
  heroImageAlt?: string;
  journeyTitle: string;
  journeyContent: string;
  journeyMedia: Media[];
  journeyTimeline: TimelineEntry[];
  philosophyTitle: string;
  philosophyContent: string;
  experienceTitle: string;
  experienceContent?: string;
  achievements: Achievement[];
  toolsTitle: string;
  toolsDescription?: string;
  tools: Tool[];
  visionTitle: string;
  visionDescription: string;
  visionCtaLabel?: string;
  visionCtaHref?: string;
  enabled: boolean;
};

const SECTIONS = [
  { id: "hero", label: "01 — Hero" },
  { id: "journey", label: "02 — Journey" },
  { id: "philosophy", label: "03 — Philosophy" },
  { id: "experience", label: "04 — Experience" },
  { id: "tools", label: "05 — Tools & Workflow" },
  { id: "vision", label: "06 — Vision" },
] as const;

export function AboutBuilder({ initial }: { initial: AboutDoc }) {
  const router = useRouter();
  const [data, setData] = useState<AboutDoc>(initial);
  const [openSection, setOpenSection] = useState<string>("hero");
  const [saving, startSaving] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch(p: Partial<AboutDoc>) {
    setData((d) => ({ ...d, ...p }));
  }

  function save() {
    setError(null);
    startSaving(async () => {
      const res = await updateAboutPage(data);
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
      {/* Toggle + preview link */}
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
            Use CMS content on /about
            <span className="block text-xs text-bone-400">
              When off, the legacy hardcoded About page renders instead.
            </span>
          </span>
        </label>
        <a
          href="/about"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-bone-300 hover:text-fire transition-colors"
        >
          View live page
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Sections */}
      {SECTIONS.map((s) => (
        <section
          key={s.id}
          className="border border-ink-800 rounded-sm overflow-hidden"
        >
          <button
            onClick={() => setOpenSection(openSection === s.id ? "" : s.id)}
            className="w-full flex items-center justify-between p-5 hover:bg-ink-950 transition-colors"
          >
            <p className="font-display text-lg font-medium">{s.label}</p>
            <ChevronDown
              className={`h-4 w-4 text-bone-400 transition-transform ${openSection === s.id ? "rotate-180" : ""}`}
            />
          </button>
          {openSection === s.id && (
            <div className="p-6 border-t border-ink-800 space-y-5 bg-ink-950">
              {s.id === "hero" && <HeroSection data={data} patch={patch} />}
              {s.id === "journey" && <JourneySection data={data} patch={patch} />}
              {s.id === "philosophy" && <PhilosophySection data={data} patch={patch} />}
              {s.id === "experience" && <ExperienceSection data={data} patch={patch} />}
              {s.id === "tools" && <ToolsSection data={data} patch={patch} />}
              {s.id === "vision" && <VisionSection data={data} patch={patch} />}
            </div>
          )}
        </section>
      ))}

      {/* Sticky save bar */}
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

/* ─────────── Sections ─────────── */

function HeroSection({ data, patch }: { data: AboutDoc; patch: (p: Partial<AboutDoc>) => void }) {
  return (
    <>
      <FieldText
        label="Headline *"
        value={data.heroHeadline}
        onChange={(v) => patch({ heroHeadline: v })}
        placeholder="Designer. Editor. Director. Maker."
        help="Wrap an italic word in <em>…</em> to emphasize it."
      />
      <FieldText
        label="Subheadline"
        value={data.heroSubheadline ?? ""}
        onChange={(v) => patch({ heroSubheadline: v })}
        placeholder="Optional eyebrow line"
      />
      <FieldTextarea
        label="Description"
        value={data.heroDescription ?? ""}
        onChange={(v) => patch({ heroDescription: v })}
        placeholder="Two or three sentences setting the stage."
        rows={4}
      />
      <FieldImageUpload
        label="Hero image"
        value={data.heroImage}
        onChange={(v) => patch({ heroImage: v })}
        folder="profile"
      />
      <FieldText
        label="Hero image alt text"
        value={data.heroImageAlt ?? ""}
        onChange={(v) => patch({ heroImageAlt: v })}
        placeholder="Describe what's in the image for accessibility"
      />
    </>
  );
}

function JourneySection({
  data,
  patch,
}: {
  data: AboutDoc;
  patch: (p: Partial<AboutDoc>) => void;
}) {
  return (
    <>
      <FieldText
        label="Title"
        value={data.journeyTitle}
        onChange={(v) => patch({ journeyTitle: v })}
      />
      <FieldTextarea
        label="Intro content"
        value={data.journeyContent}
        onChange={(v) => patch({ journeyContent: v })}
        placeholder="A paragraph or two before the timeline"
        rows={3}
      />

      <RepeaterList
        label="Timeline entries"
        items={data.journeyTimeline}
        onChange={(items) => patch({ journeyTimeline: items })}
        empty={{ year: "", title: "", description: "" }}
        renderItem={(item, onChange) => (
          <div className="grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-3">
            <input
              value={item.year}
              onChange={(e) => onChange({ ...item, year: e.target.value })}
              placeholder="Year"
              className="bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 font-mono"
            />
            <div className="space-y-2">
              <input
                value={item.title}
                onChange={(e) => onChange({ ...item, title: e.target.value })}
                placeholder="Title (e.g. Moved into motion)"
                className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40"
              />
              <textarea
                value={item.description}
                onChange={(e) => onChange({ ...item, description: e.target.value })}
                placeholder="What happened that year?"
                rows={2}
                className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 resize-none"
              />
            </div>
          </div>
        )}
      />

      <MediaListEditor
        label="Inline media (images or videos)"
        items={data.journeyMedia}
        onChange={(items) => patch({ journeyMedia: items })}
      />
    </>
  );
}

function PhilosophySection({
  data,
  patch,
}: {
  data: AboutDoc;
  patch: (p: Partial<AboutDoc>) => void;
}) {
  return (
    <>
      <FieldText
        label="Title"
        value={data.philosophyTitle}
        onChange={(v) => patch({ philosophyTitle: v })}
      />
      <FieldTextarea
        label="Content"
        value={data.philosophyContent}
        onChange={(v) => patch({ philosophyContent: v })}
        placeholder="Your philosophy. Paragraphs separated by blank lines."
        rows={8}
      />
    </>
  );
}

function ExperienceSection({
  data,
  patch,
}: {
  data: AboutDoc;
  patch: (p: Partial<AboutDoc>) => void;
}) {
  return (
    <>
      <FieldText
        label="Title"
        value={data.experienceTitle}
        onChange={(v) => patch({ experienceTitle: v })}
      />
      <FieldTextarea
        label="Description"
        value={data.experienceContent ?? ""}
        onChange={(v) => patch({ experienceContent: v })}
        placeholder="Optional intro"
        rows={3}
      />

      <RepeaterList
        label="Achievements & statistics"
        items={data.achievements}
        onChange={(items) => patch({ achievements: items })}
        empty={{ label: "", value: "" }}
        renderItem={(item, onChange) => (
          <div className="grid grid-cols-2 gap-3">
            <input
              value={item.value}
              onChange={(e) => onChange({ ...item, value: e.target.value })}
              placeholder="Value (e.g. 40+)"
              className="bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 font-display text-base"
            />
            <input
              value={item.label}
              onChange={(e) => onChange({ ...item, label: e.target.value })}
              placeholder="Label (e.g. brand identities shipped)"
              className="bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40"
            />
          </div>
        )}
      />
    </>
  );
}

function ToolsSection({
  data,
  patch,
}: {
  data: AboutDoc;
  patch: (p: Partial<AboutDoc>) => void;
}) {
  return (
    <>
      <FieldText label="Title" value={data.toolsTitle} onChange={(v) => patch({ toolsTitle: v })} />
      <FieldTextarea
        label="Description"
        value={data.toolsDescription ?? ""}
        onChange={(v) => patch({ toolsDescription: v })}
        placeholder="Optional context"
        rows={2}
      />

      <RepeaterList
        label="Tools (grouped by category)"
        items={data.tools}
        onChange={(items) => patch({ tools: items })}
        empty={{ name: "", description: "", category: "" }}
        renderItem={(item, onChange) => (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={item.category ?? ""}
                onChange={(e) => onChange({ ...item, category: e.target.value })}
                placeholder="Category (e.g. Motion)"
                className="bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40"
              />
              <input
                value={item.name}
                onChange={(e) => onChange({ ...item, name: e.target.value })}
                placeholder="Tools (e.g. After Effects · Cinema 4D · Blender)"
                className="bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40"
              />
            </div>
            <input
              value={item.description ?? ""}
              onChange={(e) => onChange({ ...item, description: e.target.value })}
              placeholder="Optional one-line description"
              className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40"
            />
          </div>
        )}
      />
    </>
  );
}

function VisionSection({
  data,
  patch,
}: {
  data: AboutDoc;
  patch: (p: Partial<AboutDoc>) => void;
}) {
  return (
    <>
      <FieldText label="Title" value={data.visionTitle} onChange={(v) => patch({ visionTitle: v })} />
      <FieldTextarea
        label="Description"
        value={data.visionDescription}
        onChange={(v) => patch({ visionDescription: v })}
        placeholder="Where you're heading next"
        rows={5}
      />
      <div className="grid grid-cols-2 gap-3">
        <FieldText
          label="CTA label"
          value={data.visionCtaLabel ?? ""}
          onChange={(v) => patch({ visionCtaLabel: v })}
          placeholder="Start a project"
        />
        <FieldText
          label="CTA URL"
          value={data.visionCtaHref ?? ""}
          onChange={(v) => patch({ visionCtaHref: v })}
          placeholder="/contact"
        />
      </div>
    </>
  );
}

/* ─────────── Atomics ─────────── */

function FieldText({
  label,
  value,
  onChange,
  placeholder,
  help,
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
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
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
    </div>
  );
}

function FieldImageUpload({
  label,
  value,
  onChange,
  folder,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  folder: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">{label}</label>
      {value ? (
        <div className="flex items-center gap-3 p-3 border border-ink-800 rounded-sm">
          <div className="relative h-16 w-24 rounded-sm overflow-hidden bg-ink-900 flex-shrink-0">
            <Image src={value} alt="" fill className="object-cover" sizes="96px" />
          </div>
          <span className="text-sm truncate flex-1 text-bone-300">{value.split("/").pop()}</span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-bone-300 hover:text-fire"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-ink-700 hover:border-fire/40 rounded-sm py-5 transition-all flex items-center justify-center gap-2 text-sm text-bone-300 hover:text-fire"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload image"}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
        className="hidden"
      />
      {error && <p className="text-xs text-fire">{error}</p>}
    </div>
  );
}

function RepeaterList<T>({
  label,
  items,
  onChange,
  renderItem,
  empty,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, onItemChange: (next: T) => void) => React.ReactNode;
  empty: T;
}) {
  function update(i: number, next: T) {
    onChange(items.map((it, idx) => (idx === i ? next : it)));
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...items, structuredClone(empty)]);
  }
  function move(i: number, delta: -1 | 1) {
    const j = i + delta;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">{label}</label>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-xs border border-ink-700 hover:border-fire hover:text-fire px-2.5 py-1 rounded-full transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-bone-400 border border-dashed border-ink-700 rounded-sm py-4 text-center">
          Nothing here yet — click Add to create the first entry.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="border border-ink-800 rounded-sm p-3 space-y-3 bg-ink-900/30">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-2">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="text-bone-400 hover:text-fire disabled:opacity-30"
                    title="Move up"
                  >
                    <GripVertical className="h-3 w-3 rotate-90" />
                  </button>
                  <span className="text-[10px] text-bone-400 font-mono py-0.5">{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    className="text-bone-400 hover:text-fire disabled:opacity-30"
                    title="Move down"
                  >
                    <GripVertical className="h-3 w-3 -rotate-90" />
                  </button>
                </div>
                <div className="flex-1">{renderItem(item, (next) => update(i, next))}</div>
                <button
                  type="button"
                  onClick={() => remove(i)}
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
  );
}

function MediaListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: Media[];
  onChange: (items: Media[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: FileList) {
    setError(null);
    setUploading(true);
    try {
      const added: Media[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", file.type.startsWith("video/") ? "videos" : "profile");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        if (data.type !== "image" && data.type !== "video") {
          throw new Error("Only images and videos allowed");
        }
        added.push({ type: data.type, url: data.url });
      }
      onChange([...items, ...added]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }
  function updateAlt(idx: number, alt: string) {
    onChange(items.map((m, i) => (i === idx ? { ...m, alt } : m)));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">{label}</label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1 text-xs border border-ink-700 hover:border-fire hover:text-fire px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {uploading ? "Uploading..." : "Add media"}
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-bone-400 border border-dashed border-ink-700 rounded-sm py-4 text-center">
          No media yet.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((m, i) => (
            <li key={i} className="space-y-2">
              <div className="relative aspect-video bg-ink-900 border border-ink-800 rounded-sm overflow-hidden">
                {m.type === "image" ? (
                  <Image src={m.url} alt={m.alt ?? ""} fill className="object-cover" sizes="200px" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    <Film className="h-6 w-6 text-bone-400" strokeWidth={1.5} />
                  </div>
                )}
                <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 border rounded-full uppercase tracking-wider backdrop-blur bg-ink/60 border-ink-700 text-bone">
                  {m.type === "image" ? <ImageIcon className="h-2.5 w-2.5" /> : <Film className="h-2.5 w-2.5" />}
                  {m.type}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-1.5 right-1.5 h-6 w-6 grid place-items-center bg-ink/80 backdrop-blur hover:bg-fire/20 rounded-sm text-bone-300 hover:text-fire"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <input
                value={m.alt ?? ""}
                onChange={(e) => updateAlt(i, e.target.value)}
                placeholder="Alt text"
                className="w-full bg-ink-900 border border-ink-800 px-2 py-1 text-xs rounded-sm focus:outline-none focus:border-fire/40"
              />
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-fire">{error}</p>}
    </div>
  );
}
