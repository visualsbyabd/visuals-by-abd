"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Save, Check, Circle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { upsertMilestone, deleteMilestone } from "@/features/clients/portal-actions";

type Milestone = {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  dueDate?: string;
  completedAt?: string;
  order: number;
};

type EditState =
  | null
  | {
      _id?: string;
      title: string;
      description: string;
      status: "pending" | "in_progress" | "completed";
      dueDate: string;
      order: number;
    };

export function ProjectMilestonesPanel({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: Milestone[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    setEditing({
      title: "",
      description: "",
      status: "pending",
      dueDate: "",
      order: milestones.length,
    });
  }

  function startEdit(m: Milestone) {
    setEditing({
      _id: m._id,
      title: m.title,
      description: m.description ?? "",
      status: m.status,
      dueDate: m.dueDate ? m.dueDate.slice(0, 10) : "",
      order: m.order,
    });
  }

  async function save() {
    if (!editing) return;
    setError(null);
    setSaving(true);
    const res = await upsertMilestone(editing._id ?? null, {
      project: projectId,
      title: editing.title,
      description: editing.description || undefined,
      status: editing.status,
      dueDate: editing.dueDate || undefined,
      order: editing.order,
    });
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete milestone "${title}"?`)) return;
    await deleteMilestone(id);
    router.refresh();
  }

  return (
    <section className="border border-ink-800 rounded-sm">
      <header className="flex items-center justify-between p-6 border-b border-ink-800">
        <div>
          <h2 className="font-display text-lg font-medium">Milestones</h2>
          <p className="text-xs text-bone-400 mt-1">Project timeline visible to the client</p>
        </div>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 border border-ink-700 hover:border-fire hover:text-fire px-4 py-2 rounded-full text-sm transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add milestone
        </button>
      </header>

      {milestones.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-bone-300">No milestones yet. Add the first to start the timeline.</p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-800">
          {milestones.map((m) => {
            const done = m.status === "completed";
            const active = m.status === "in_progress";
            return (
              <li key={m._id} className="flex items-center gap-4 p-5 group hover:bg-ink-950 transition-colors">
                <span
                  className={`h-5 w-5 rounded-full border-2 grid place-items-center flex-shrink-0 ${
                    done ? "bg-fire border-fire" : active ? "bg-ink border-fire" : "bg-ink border-ink-700"
                  }`}
                >
                  {done ? (
                    <Check className="h-3 w-3 text-bone" strokeWidth={3} />
                  ) : active ? (
                    <Clock className="h-2.5 w-2.5 text-fire" strokeWidth={2.5} />
                  ) : (
                    <Circle className="h-2 w-2 text-bone-400" strokeWidth={2.5} />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${done ? "text-bone-400 line-through decoration-bone-400/40" : ""}`}>
                    {m.title}
                  </p>
                  <p className="text-xs text-bone-400 mt-0.5">
                    {done && m.completedAt
                      ? `Completed ${new Date(m.completedAt).toLocaleDateString()}`
                      : m.dueDate
                      ? `Due ${new Date(m.dueDate).toLocaleDateString()}`
                      : active
                      ? "In progress"
                      : "Upcoming"}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(m)}
                    className="p-2 hover:bg-ink-800 rounded-sm text-bone-300 hover:text-bone"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(m._id, m.title)}
                    className="p-2 hover:bg-fire/10 rounded-sm text-bone-300 hover:text-fire"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <div className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-ink-950 border border-ink-800 rounded-sm max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-ink-800">
              <h3 className="font-display text-lg">
                {editing._id ? "Edit" : "New"} milestone
              </h3>
              <button onClick={() => setEditing(null)} className="h-9 w-9 grid place-items-center hover:bg-ink-900 rounded-sm">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="e.g. Concept presentation"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={editing.status}
                    onChange={(e) =>
                      setEditing({ ...editing, status: e.target.value as Milestone["status"] })
                    }
                    className="w-full bg-transparent border-0 border-b border-ink-700 h-12 text-base focus:outline-none focus:border-fire"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={editing.dueDate}
                    onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
                  />
                </div>
              </div>
              {error && <p className="text-xs text-fire">{error}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-ink-800">
              <button onClick={() => setEditing(null)} className="px-5 py-2.5 text-sm text-bone-300 hover:text-bone">
                Cancel
              </button>
              <Button onClick={save} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
