"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { createService, updateService } from "@/features/services/actions";
import { SERVICE_ICON_NAMES, getServiceIcon } from "@/lib/service-icons";

export type ServiceFormData = {
  _id?: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  icon: string;
  deliverables: string[];
  startingPrice?: string;
  active: boolean;
};

const EMPTY: ServiceFormData = {
  title: "",
  slug: "",
  tagline: "",
  description: "",
  icon: "Sparkles",
  deliverables: [],
  startingPrice: "",
  active: true,
};

function slugifyClient(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ServiceForm({ initial }: { initial?: ServiceFormData }) {
  const router = useRouter();
  const [data, setData] = useState<ServiceFormData>(initial ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [newDeliverable, setNewDeliverable] = useState("");
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const isEdit = !!initial?._id;

  function patch(p: Partial<ServiceFormData>) {
    setData((d) => ({ ...d, ...p }));
  }

  function onTitleChange(title: string) {
    patch({ title });
    if (!slugTouched) {
      patch({ slug: slugifyClient(title) });
    }
  }

  function addDeliverable(raw?: string) {
    const text = (raw ?? newDeliverable).trim();
    if (!text) return;
    patch({ deliverables: [...data.deliverables, text] });
    setNewDeliverable("");
  }

  function removeDeliverable(i: number) {
    patch({ deliverables: data.deliverables.filter((_, idx) => idx !== i) });
  }

  function moveDeliverable(i: number, delta: -1 | 1) {
    const j = i + delta;
    if (j < 0 || j >= data.deliverables.length) return;
    const next = [...data.deliverables];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ deliverables: next });
  }

  function save() {
    setError(null);
    if (!data.title.trim()) return setError("Title required");
    if (!data.tagline.trim()) return setError("Tagline required");
    if (!data.description.trim()) return setError("Description required");

    startSaving(async () => {
      const payload = {
        title: data.title.trim(),
        slug: data.slug.trim(),
        tagline: data.tagline.trim(),
        description: data.description.trim(),
        icon: data.icon,
        deliverables: data.deliverables.filter((d) => d.trim()),
        startingPrice: data.startingPrice?.trim() || undefined,
        active: data.active,
      };
      const res = isEdit
        ? await updateService(initial!._id!, payload)
        : await createService(payload);
      if (res.ok) {
        setSavedAt(Date.now());
        setTimeout(() => setSavedAt(null), 2000);
        if (!isEdit) {
          router.push("/admin/services");
        } else {
          router.refresh();
        }
      } else {
        setError(res.error);
      }
    });
  }

  const Icon = getServiceIcon(data.icon);

  return (
    <div className="max-w-4xl space-y-8">
      <Link
        href="/admin/services"
        className="inline-flex items-center gap-2 text-sm text-bone-300 hover:text-fire transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All services
      </Link>

      <header>
        <p className="eyebrow mb-3">— Manage</p>
        <h1 className="display-md text-balance">
          {isEdit ? `Edit · ${initial!.title}` : "New service"}
        </h1>
      </header>

      {/* Visibility toggle */}
      <div className="flex items-center justify-between gap-4 p-4 border border-ink-800 rounded-sm">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.active}
            onChange={(e) => patch({ active: e.target.checked })}
            className="peer sr-only"
          />
          <span className="relative h-5 w-9 rounded-full bg-ink-800 peer-checked:bg-fire transition-colors peer-checked:[&>span]:translate-x-4">
            <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-bone transition-transform" />
          </span>
          <span className="text-sm flex items-center gap-1.5">
            {data.active ? (
              <>
                <Eye className="h-3.5 w-3.5 text-fire" />
                Active — visible on public site
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-bone-400" />
                Hidden from public site
              </>
            )}
          </span>
        </label>
      </div>

      {/* Core fields */}
      <section className="border border-ink-800 rounded-sm p-6 space-y-5">
        <Field label="Title *">
          <input
            value={data.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. Brand Identity"
            className="w-full bg-transparent border-0 border-b border-ink-700 h-11 text-base focus:outline-none focus:border-fire"
          />
        </Field>

        <Field label="Slug *" help="URL-safe identifier, lowercase, no spaces.">
          <input
            value={data.slug}
            onChange={(e) => {
              setSlugTouched(true);
              patch({ slug: slugifyClient(e.target.value) });
            }}
            placeholder="brand-identity"
            className="w-full bg-transparent border-0 border-b border-ink-700 h-11 text-sm focus:outline-none focus:border-fire font-mono"
          />
        </Field>

        <Field label="Tagline *" help="One-liner that appears under the title.">
          <input
            value={data.tagline}
            onChange={(e) => patch({ tagline: e.target.value })}
            placeholder="Identity systems that build recognition."
            className="w-full bg-transparent border-0 border-b border-ink-700 h-11 text-base focus:outline-none focus:border-fire"
          />
        </Field>

        <Field label="Description *">
          <textarea
            value={data.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="The longer description of what this service includes."
            rows={5}
            className="w-full bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40 resize-none leading-relaxed"
          />
        </Field>

        <Field label="Starting price (optional)" help="Displayed as 'From {value}' on the public page.">
          <input
            value={data.startingPrice ?? ""}
            onChange={(e) => patch({ startingPrice: e.target.value })}
            placeholder="$5K · €4K · negotiable"
            className="w-full bg-transparent border-0 border-b border-ink-700 h-11 text-sm focus:outline-none focus:border-fire"
          />
        </Field>
      </section>

      {/* Icon picker */}
      <section className="border border-ink-800 rounded-sm p-6 space-y-3">
        <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">Icon</label>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 grid place-items-center border border-fire/40 bg-fire/5 rounded-sm text-fire">
            <Icon className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-bone-300">
            Currently: <span className="text-fire font-medium">{data.icon}</span>
          </p>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
          {SERVICE_ICON_NAMES.map((name) => {
            const I = getServiceIcon(name);
            const active = data.icon === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => patch({ icon: name })}
                className={`h-12 w-12 grid place-items-center border rounded-sm transition-all ${
                  active
                    ? "border-fire bg-fire/10 text-fire"
                    : "border-ink-800 text-bone-300 hover:border-bone-300 hover:text-bone"
                }`}
                title={name}
              >
                <I className="h-4 w-4" strokeWidth={1.5} />
              </button>
            );
          })}
        </div>
      </section>

      {/* Deliverables */}
      <section className="border border-ink-800 rounded-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">Deliverables</label>
            <p className="text-xs text-bone-400 mt-1">Bullet list shown on the public service page.</p>
          </div>
        </div>
        {data.deliverables.length > 0 && (
          <ul className="space-y-1.5">
            {data.deliverables.map((d, i) => (
              <li
                key={i}
                className="flex items-center gap-2 border border-ink-800 rounded-sm px-3 py-2 bg-ink-900/30"
              >
                <span className="text-bone-400 font-mono text-xs w-6 text-right">{i + 1}</span>
                <input
                  value={d}
                  onChange={(e) =>
                    patch({
                      deliverables: data.deliverables.map((x, idx) => (idx === i ? e.target.value : x)),
                    })
                  }
                  className="flex-1 bg-transparent border-0 text-sm focus:outline-none"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveDeliverable(i, -1)}
                    disabled={i === 0}
                    className="h-6 w-6 grid place-items-center text-bone-400 hover:text-fire disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDeliverable(i, 1)}
                    disabled={i === data.deliverables.length - 1}
                    className="h-6 w-6 grid place-items-center text-bone-400 hover:text-fire disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDeliverable(i)}
                    className="h-6 w-6 grid place-items-center text-bone-400 hover:text-fire"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2">
          <input
            value={newDeliverable}
            onChange={(e) => setNewDeliverable(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDeliverable();
              }
            }}
            placeholder="Add a deliverable…"
            className="flex-1 bg-ink-900 border border-ink-800 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-fire/40"
          />
          <button
            type="button"
            onClick={() => addDeliverable()}
            className="inline-flex items-center gap-1 border border-ink-700 hover:border-fire hover:text-fire px-3 py-2 text-xs rounded-sm transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>
      </section>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-20 flex items-center justify-end gap-3 p-3 bg-ink-950/90 backdrop-blur border border-ink-800 rounded-sm">
        {error && (
          <div className="flex items-center gap-2 text-xs text-fire mr-auto">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}
        {savedAt && !error && (
          <div className="flex items-center gap-2 text-xs text-fire mr-auto">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved
          </div>
        )}
        <Link href="/admin/services" className="px-4 py-2 text-sm text-bone-300 hover:text-bone">
          Cancel
        </Link>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow disabled:opacity-50 text-bone px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-[0_0_40px_-10px_rgba(214,40,40,0.6)]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create service"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">{label}</label>
      {children}
      {help && <p className="text-xs text-bone-400">{help}</p>}
    </div>
  );
}
