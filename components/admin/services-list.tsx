"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";
import {
  reorderServices,
  toggleServiceActive,
  deleteService,
} from "@/features/services/actions";
import { getServiceIcon } from "@/lib/service-icons";

type ServiceRow = {
  _id: string;
  title: string;
  slug: string;
  tagline: string;
  icon: string;
  deliverablesCount: number;
  startingPrice?: string;
  active: boolean;
  order: number;
};

export function ServicesList({ services: initial }: { services: ServiceRow[] }) {
  const router = useRouter();
  const [services, setServices] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function move(idx: number, delta: -1 | 1) {
    const j = idx + delta;
    if (j < 0 || j >= services.length) return;
    const next = [...services];
    [next[idx], next[j]] = [next[j], next[idx]];
    setServices(next);
    startTransition(async () => {
      await reorderServices(next.map((s) => s._id));
      router.refresh();
    });
  }

  async function toggleActive(id: string, active: boolean) {
    setBusyId(id);
    await toggleServiceActive(id, active);
    setBusyId(null);
    setServices((prev) => prev.map((s) => (s._id === id ? { ...s, active } : s)));
    router.refresh();
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    setBusyId(id);
    const res = await deleteService(id);
    setBusyId(null);
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s._id !== id));
      router.refresh();
    } else {
      alert(res.error);
    }
  }

  return (
    <div className="border border-ink-800 rounded-sm divide-y divide-ink-800">
      {services.map((s, i) => {
        const Icon = getServiceIcon(s.icon);
        const isBusy = busyId === s._id;
        return (
          <article
            key={s._id}
            className={`flex items-center gap-4 p-5 transition-opacity ${isBusy ? "opacity-50" : ""} ${!s.active ? "bg-ink-950/40" : ""}`}
          >
            {/* Reorder */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0 || pending}
                className="text-bone-400 hover:text-fire disabled:opacity-30"
                title="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === services.length - 1 || pending}
                className="text-bone-400 hover:text-fire disabled:opacity-30"
                title="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Icon */}
            <div className="h-11 w-11 grid place-items-center border border-ink-700 rounded-sm bg-fire/5 text-fire flex-shrink-0">
              <Icon className="h-5 w-5" strokeWidth={1.5} />
            </div>

            {/* Title + tagline */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/admin/services/${s._id}`}
                  className={`font-medium hover:text-fire transition-colors ${!s.active ? "text-bone-400" : "text-bone"}`}
                >
                  {s.title}
                </Link>
                {!s.active && (
                  <span className="text-[10px] px-2 py-0.5 border border-ink-700 text-bone-400 rounded-full uppercase tracking-wider">
                    Hidden
                  </span>
                )}
                <span className="text-xs text-bone-400 font-mono">/{s.slug}</span>
              </div>
              <p className="text-sm text-bone-300 mt-0.5 line-clamp-1">{s.tagline}</p>
              <div className="text-xs text-bone-400 mt-1 flex items-center gap-3">
                <span>{s.deliverablesCount} deliverable{s.deliverablesCount === 1 ? "" : "s"}</span>
                {s.startingPrice && (
                  <>
                    <span>·</span>
                    <span>From {s.startingPrice}</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => toggleActive(s._id, !s.active)}
                disabled={isBusy}
                className={`h-9 w-9 grid place-items-center rounded-sm transition-colors ${
                  s.active
                    ? "text-bone-300 hover:bg-ink-900 hover:text-bone"
                    : "text-bone-400 hover:bg-fire/10 hover:text-fire"
                }`}
                title={s.active ? "Hide from public" : "Show on public"}
              >
                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : s.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <Link
                href={`/admin/services/${s._id}`}
                className="h-9 w-9 grid place-items-center text-bone-300 hover:bg-ink-900 hover:text-bone rounded-sm transition-colors"
                title="Edit"
              >
                <Pencil className="h-4 w-4" />
              </Link>
              <button
                onClick={() => remove(s._id, s.title)}
                disabled={isBusy}
                className="h-9 w-9 grid place-items-center text-bone-300 hover:bg-fire/10 hover:text-fire rounded-sm transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
