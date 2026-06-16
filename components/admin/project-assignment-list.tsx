"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { assignProjectToClient } from "@/features/clients/actions";

type Unassigned = { _id: string; title: string };

export function ProjectAssignmentList({
  clientId,
  unassigned,
}: {
  clientId: string;
  unassigned: Unassigned[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function assign(projectId: string) {
    setBusy(projectId);
    const res = await assignProjectToClient(projectId, clientId);
    setBusy(null);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      alert(res.error);
    }
  }

  if (unassigned.length === 0) {
    return (
      <p className="text-xs text-bone-400">
        No unassigned projects available. Create new projects from the Projects page, then assign them here.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border border-ink-700 hover:border-fire hover:text-fire px-4 py-2 rounded-full text-sm transition-all"
      >
        <Plus className="h-3.5 w-3.5" />
        Assign existing project
      </button>
    );
  }

  return (
    <div className="border border-ink-800 rounded-sm">
      <p className="px-4 py-2 text-xs uppercase tracking-[0.2em] text-bone-300 border-b border-ink-800">
        Pick a project to assign
      </p>
      <ul className="max-h-72 overflow-y-auto">
        {unassigned.map((p) => (
          <li key={p._id}>
            <button
              onClick={() => assign(p._id)}
              disabled={busy === p._id}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-ink-900 transition-colors border-b border-ink-800 last:border-b-0 disabled:opacity-50"
            >
              <span className="truncate">{p.title}</span>
              {busy === p._id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-fire" />
              ) : (
                <span className="text-fire text-xs">Assign →</span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() => setOpen(false)}
        className="w-full px-4 py-2 text-xs text-bone-400 hover:text-bone border-t border-ink-800"
      >
        Cancel
      </button>
    </div>
  );
}
