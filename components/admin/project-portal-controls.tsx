"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Eye, EyeOff, Loader2 } from "lucide-react";
import { assignProjectToClient, updateProjectProgress } from "@/features/clients/actions";

type ClientOption = { _id: string; name: string; company?: string };

export function ProjectPortalControls({
  projectId,
  currentClientId,
  currentProgress,
  portalVisible,
  clients,
}: {
  projectId: string;
  currentClientId: string;
  currentProgress: number;
  portalVisible: boolean;
  clients: ClientOption[];
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(currentClientId);
  const [progress, setProgress] = useState(currentProgress);
  const [pending, startTransition] = useTransition();
  const [savingProgress, setSavingProgress] = useState(false);

  function assignClient(value: string) {
    setClientId(value);
    startTransition(async () => {
      await assignProjectToClient(projectId, value || null);
      router.refresh();
    });
  }

  async function saveProgress() {
    if (progress === currentProgress) return;
    setSavingProgress(true);
    await updateProjectProgress(projectId, progress);
    setSavingProgress(false);
    router.refresh();
  }

  return (
    <section className="border border-fire/40 bg-fire/5 rounded-sm relative overflow-hidden">
      <div
        className="absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #D62828 0%, transparent 70%)" }}
      />
      <div className="relative p-6">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-fire" />
          <p className="eyebrow">— Client Portal</p>
        </div>
        <h2 className="font-display text-xl font-medium mb-6">
          {portalVisible ? "This project is visible in the client portal." : "Not yet shared with a client."}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-bone-300 mb-2">
              Assigned client
            </label>
            <div className="relative">
              <select
                value={clientId}
                onChange={(e) => assignClient(e.target.value)}
                disabled={pending}
                className="w-full bg-ink border border-ink-700 px-4 py-2.5 text-sm rounded-sm focus:outline-none focus:border-fire/40 transition-colors disabled:opacity-50"
              >
                <option value="">— Unassigned (hidden from portal) —</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {c.company ? ` · ${c.company}` : ""}
                  </option>
                ))}
              </select>
              {pending && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-fire" />
              )}
            </div>
            <p className="text-xs text-bone-400 mt-2">
              {portalVisible ? (
                <span className="inline-flex items-center gap-1 text-fire">
                  <Eye className="h-3 w-3" /> Visible in portal
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <EyeOff className="h-3 w-3" /> Hidden — assign a client to share
                </span>
              )}
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-bone-300 mb-2">
              Progress · <span className="text-fire font-mono">{progress}%</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                onMouseUp={saveProgress}
                onTouchEnd={saveProgress}
                disabled={!portalVisible || savingProgress}
                className="flex-1 accent-fire disabled:opacity-50"
              />
              {savingProgress && <Loader2 className="h-4 w-4 animate-spin text-fire flex-shrink-0" />}
            </div>
            <p className="text-xs text-bone-400 mt-2">
              {portalVisible ? "Updates the client's progress bar in real time." : "Assign a client first."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
