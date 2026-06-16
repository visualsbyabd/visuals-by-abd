"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, Save, AlertCircle, ArrowLeft, Send, CheckCircle2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { upsertInvoice, setInvoiceStatus, deleteInvoice } from "@/features/clients/portal-actions";

type ClientOption = { _id: string; name: string; company?: string };
type ProjectOption = { _id: string; title: string; client?: string };
type LineItem = { description: string; quantity: number; unitPrice: number };

type Initial = {
  _id?: string;
  number: string;
  client: string;
  project: string;
  items: LineItem[];
  currency: string;
  taxRate: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issueDate: string;
  dueDate: string;
  notes: string;
};

export function InvoiceForm({
  mode,
  initial,
  clients,
  projects,
}: {
  mode: "create" | "edit";
  initial: Initial;
  clients: ClientOption[];
  projects: ProjectOption[];
}) {
  const router = useRouter();
  const [data, setData] = useState<Initial>(initial);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectsForClient = useMemo(
    () => projects.filter((p) => !data.client || !p.client || p.client === data.client),
    [projects, data.client]
  );

  const totals = useMemo(() => {
    const subtotal = data.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const taxAmount = subtotal * (data.taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [data.items, data.taxRate]);

  function updateItem(i: number, patch: Partial<LineItem>) {
    setData((d) => ({
      ...d,
      items: d.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    }));
  }

  function addItem() {
    setData((d) => ({
      ...d,
      items: [...d.items, { description: "", quantity: 1, unitPrice: 0 }],
    }));
  }

  function removeItem(i: number) {
    setData((d) => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }));
  }

  async function save(nextStatus?: Initial["status"]) {
    setError(null);
    setSaving(true);
    const payload = {
      number: data.number,
      client: data.client,
      project: data.project || undefined,
      items: data.items,
      currency: data.currency,
      taxRate: data.taxRate,
      status: nextStatus ?? data.status,
      issueDate: data.issueDate,
      dueDate: data.dueDate || undefined,
      notes: data.notes || undefined,
    };
    const res = await upsertInvoice(initial._id ?? null, payload);
    setSaving(false);
    if (res.ok) {
      router.push("/admin/invoices");
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  async function markPaid() {
    if (!initial._id) return;
    setActing(true);
    await setInvoiceStatus(initial._id, "paid");
    setActing(false);
    router.refresh();
  }

  async function remove() {
    if (!initial._id) return;
    if (!confirm(`Delete invoice ${initial.number}?`)) return;
    setActing(true);
    await deleteInvoice(initial._id);
    setActing(false);
    router.push("/admin/invoices");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-2 text-sm text-bone-300 hover:text-fire transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All invoices
      </Link>

      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="eyebrow mb-3">— {mode === "create" ? "New" : "Edit"}</p>
          <h1 className="display-md">
            {mode === "create" ? "Create invoice" : `Invoice ${initial.number}`}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {mode === "edit" && (
            <a
              href={`/api/invoices/${initial._id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-ink-700 hover:border-fire hover:text-fire px-4 py-2 rounded-full text-sm transition-all"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          )}
          {mode === "edit" && data.status !== "paid" && data.status !== "cancelled" && (
            <button
              onClick={markPaid}
              disabled={acting}
              className="inline-flex items-center gap-2 border border-fire/40 text-fire hover:bg-fire/10 px-4 py-2 rounded-full text-sm transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark paid
            </button>
          )}
          {mode === "edit" && (
            <button
              onClick={remove}
              disabled={acting}
              className="inline-flex items-center gap-2 border border-ink-700 hover:border-fire hover:text-fire px-4 py-2 rounded-full text-sm transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Basics */}
      <section className="border border-ink-800 rounded-sm p-6 space-y-5">
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="space-y-2">
            <Label>Invoice number *</Label>
            <Input
              value={data.number}
              onChange={(e) => setData({ ...data, number: e.target.value })}
              placeholder="INV-2026-001"
            />
          </div>
          <div className="space-y-2">
            <Label>Issue date</Label>
            <Input
              type="date"
              value={data.issueDate}
              onChange={(e) => setData({ ...data, issueDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Due date</Label>
            <Input
              type="date"
              value={data.dueDate}
              onChange={(e) => setData({ ...data, dueDate: e.target.value })}
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Client *</Label>
            <select
              value={data.client}
              onChange={(e) => setData({ ...data, client: e.target.value, project: "" })}
              className="w-full bg-transparent border-0 border-b border-ink-700 h-12 text-base focus:outline-none focus:border-fire"
            >
              <option value="">— Select client —</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}{c.company ? ` · ${c.company}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Linked project (optional)</Label>
            <select
              value={data.project}
              onChange={(e) => setData({ ...data, project: e.target.value })}
              className="w-full bg-transparent border-0 border-b border-ink-700 h-12 text-base focus:outline-none focus:border-fire"
            >
              <option value="">— None —</option>
              {projectsForClient.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Line items */}
      <section className="border border-ink-800 rounded-sm">
        <header className="px-6 py-4 border-b border-ink-800 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium">Line items</h2>
          <button
            onClick={addItem}
            className="inline-flex items-center gap-2 border border-ink-700 hover:border-fire hover:text-fire px-3 py-1.5 rounded-full text-xs transition-all"
          >
            <Plus className="h-3 w-3" />
            Add row
          </button>
        </header>
        <div className="p-6">
          {data.items.length === 0 ? (
            <p className="text-sm text-bone-400 text-center py-4">Add a line item to get started.</p>
          ) : (
            <div className="space-y-2">
              {data.items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-12 sm:col-span-6">
                    <Input
                      value={it.description}
                      onChange={(e) => updateItem(i, { description: e.target.value })}
                      placeholder="Description"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={it.quantity}
                      onChange={(e) => updateItem(i, { quantity: parseFloat(e.target.value) || 0 })}
                      placeholder="Qty"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={it.unitPrice}
                      onChange={(e) => updateItem(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                      placeholder="Unit price"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="col-span-2 sm:col-span-1 h-12 grid place-items-center text-bone-300 hover:text-fire transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-ink-800 grid sm:grid-cols-2 gap-5 items-end">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Currency</Label>
                <select
                  value={data.currency}
                  onChange={(e) => setData({ ...data, currency: e.target.value })}
                  className="w-full bg-transparent border-0 border-b border-ink-700 h-12 text-base focus:outline-none focus:border-fire"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="EGP">EGP</option>
                  <option value="AED">AED</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tax %</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={data.taxRate}
                  onChange={(e) => setData({ ...data, taxRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="text-right font-mono space-y-1">
              <p className="text-sm text-bone-300">
                Subtotal: <span className="text-bone">{data.currency} {totals.subtotal.toFixed(2)}</span>
              </p>
              {totals.taxAmount > 0 && (
                <p className="text-sm text-bone-300">
                  Tax: <span className="text-bone">{data.currency} {totals.taxAmount.toFixed(2)}</span>
                </p>
              )}
              <p className="text-2xl text-fire font-display font-medium">
                {data.currency} {totals.total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border border-ink-800 rounded-sm p-6 space-y-5">
        <div className="space-y-2">
          <Label>Notes (visible to client)</Label>
          <Textarea
            rows={3}
            value={data.notes}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            placeholder="Payment instructions, thank-you note, terms…"
          />
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 border border-fire/40 bg-fire/5 px-4 py-3 text-sm text-fire rounded-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-ink/80 backdrop-blur py-4 -mx-6 lg:-mx-10 px-6 lg:px-10 border-t border-ink-800">
        <Button
          variant="outline"
          onClick={() => save("draft")}
          disabled={saving}
        >
          <Save className="h-4 w-4" />
          Save as draft
        </Button>
        <Button onClick={() => save("sent")} disabled={saving}>
          <Send className="h-4 w-4" />
          {saving ? "Saving..." : "Save & send"}
        </Button>
      </div>
    </div>
  );
}
