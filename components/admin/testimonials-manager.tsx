"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Star, X, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { upsertTestimonial, deleteTestimonial } from "@/features/projects/testimonials-actions";

type Item = {
  _id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar: string;
  rating: number;
  featured: boolean;
};

const EMPTY: Item = {
  _id: "",
  name: "",
  role: "",
  company: "",
  quote: "",
  avatar: "",
  rating: 5,
  featured: false,
};

export function TestimonialsManager({ items }: { items: Item[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!editing) return;
    setError(null);
    setSaving(true);
    const res = await upsertTestimonial(editing._id || null, {
      name: editing.name,
      role: editing.role,
      company: editing.company || undefined,
      quote: editing.quote,
      avatar: editing.avatar || undefined,
      rating: editing.rating,
      featured: editing.featured,
    });
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete testimonial from ${name}?`)) return;
    const res = await deleteTestimonial(id);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  return (
    <>
      <div className="mb-6">
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow text-bone px-5 py-2.5 rounded-full text-sm font-medium transition-all"
        >
          <Plus className="h-4 w-4" />
          Add testimonial
        </button>
      </div>

      {items.length === 0 ? (
        <div className="border border-ink-800 rounded-sm p-16 text-center">
          <p className="text-bone-300">No testimonials yet. Add your first.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((t) => (
            <article key={t._id} className="border border-ink-800 hover:border-fire/40 rounded-sm p-6 transition-colors relative group">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  {t.featured && <Star className="h-4 w-4 fill-fire text-fire" />}
                  <div className="flex">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-fire text-fire" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditing({ ...t })}
                    className="p-2 hover:bg-ink-800 rounded-sm text-bone-300 hover:text-bone transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(t._id, t.name)}
                    className="p-2 hover:bg-fire/10 rounded-sm text-bone-300 hover:text-fire transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <blockquote className="text-bone leading-relaxed mb-4">"{t.quote}"</blockquote>
              <div className="pt-4 border-t border-ink-800">
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-bone-300">
                  {t.role}{t.company ? ` · ${t.company}` : ""}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-[60] bg-ink/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-ink-950 border border-ink-800 rounded-sm max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-ink-800">
              <h3 className="font-display text-lg">{editing._id ? "Edit" : "New"} testimonial</h3>
              <button onClick={() => setEditing(null)} className="h-9 w-9 grid place-items-center hover:bg-ink-900 rounded-sm">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Input value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Quote *</Label>
                <Textarea
                  rows={4}
                  value={editing.quote}
                  onChange={(e) => setEditing({ ...editing, quote: e.target.value })}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <select
                    value={editing.rating}
                    onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })}
                    className="w-full bg-transparent border-0 border-b border-ink-700 h-12 text-base focus:outline-none focus:border-fire"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} star{n !== 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-3 cursor-pointer pb-3">
                  <input
                    type="checkbox"
                    checked={editing.featured}
                    onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                    className="peer sr-only"
                  />
                  <span className="relative h-5 w-9 rounded-full bg-ink-800 peer-checked:bg-fire transition-colors peer-checked:[&>span]:translate-x-4">
                    <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-bone transition-transform" />
                  </span>
                  <span className="text-sm">Show on homepage</span>
                </label>
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
    </>
  );
}
