import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/models/Invoice";
import { Receipt, Download } from "lucide-react";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  draft: "border-ink-700 text-bone-300 bg-ink-900",
  sent: "border-bone-300 text-bone bg-ink-900",
  paid: "border-fire/40 text-fire bg-fire/5",
  overdue: "border-fire text-fire bg-fire/10",
  cancelled: "border-ink-700 text-bone-400 bg-ink-900",
};

async function getInvoices() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "client" || !session.user.clientId) return [];

  await connectDB();
  const invoices = await Invoice.find({ client: session.user.clientId })
    .sort({ issueDate: -1 })
    .lean();
  return invoices.map((i) => ({
    _id: String(i._id),
    number: i.number,
    status: i.status,
    currency: i.currency,
    subtotal: i.subtotal,
    taxAmount: i.taxAmount,
    total: i.total,
    issueDate: i.issueDate?.toISOString(),
    dueDate: i.dueDate?.toISOString(),
    paidDate: i.paidDate?.toISOString(),
    items: i.items,
    notes: i.notes,
  }));
}

export default async function PortalInvoicesPage() {
  const invoices = await getInvoices();
  if (!invoices) redirect("/login");

  const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const outstandingTotal = outstanding.reduce((s, i) => s + i.total, 0);

  return (
    <div>
      <div className="mb-12">
        <p className="eyebrow mb-3">— Billing</p>
        <h1 className="display-md text-balance">Invoices</h1>
        {outstanding.length > 0 ? (
          <p className="text-bone-300 mt-2">
            <span className="text-fire">{outstanding[0].currency} {outstandingTotal.toFixed(2)}</span> outstanding across {outstanding.length} invoice{outstanding.length === 1 ? "" : "s"}
          </p>
        ) : (
          <p className="text-bone-300 mt-2">All paid up.</p>
        )}
      </div>

      {invoices.length === 0 ? (
        <div className="border border-ink-800 rounded-sm p-16 text-center">
          <Receipt className="h-10 w-10 text-bone-400 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-bone-300">No invoices yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv) => (
            <article
              key={inv._id}
              className="border border-ink-800 hover:border-fire/40 rounded-sm overflow-hidden transition-colors"
            >
              <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-ink-800 flex-wrap">
                <div className="flex items-center gap-4">
                  <p className="font-mono text-sm">{inv.number}</p>
                  <span className={`text-xs px-3 py-1 border rounded-full uppercase tracking-wider ${statusStyles[inv.status]}`}>
                    {inv.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href={`/api/invoices/${inv._id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-bone-300 hover:text-fire transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </a>
                  <div className="text-right">
                    <p className="font-display text-2xl font-medium">
                      {inv.currency} {inv.total.toFixed(2)}
                    </p>
                    <p className="text-xs text-bone-400 mt-0.5">
                      Issued {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      {inv.dueDate && ` · Due ${new Date(inv.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                      {inv.paidDate && ` · Paid ${new Date(inv.paidDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
                    </p>
                  </div>
                </div>
              </header>
              <div className="p-6">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-[0.2em] text-bone-400">
                    <tr>
                      <th className="text-left font-medium pb-3">Item</th>
                      <th className="text-right font-medium pb-3 w-20">Qty</th>
                      <th className="text-right font-medium pb-3 w-28">Rate</th>
                      <th className="text-right font-medium pb-3 w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800">
                    {inv.items.map((it, i) => (
                      <tr key={i}>
                        <td className="py-3">{it.description}</td>
                        <td className="text-right text-bone-300">{it.quantity}</td>
                        <td className="text-right text-bone-300">{inv.currency} {it.unitPrice.toFixed(2)}</td>
                        <td className="text-right font-mono">{inv.currency} {(it.quantity * it.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-ink-700">
                    <tr>
                      <td colSpan={3} className="text-right pt-3 text-bone-300">Subtotal</td>
                      <td className="text-right pt-3 font-mono">{inv.currency} {inv.subtotal.toFixed(2)}</td>
                    </tr>
                    {inv.taxAmount > 0 && (
                      <tr>
                        <td colSpan={3} className="text-right pt-1 text-bone-300">Tax</td>
                        <td className="text-right pt-1 font-mono">{inv.currency} {inv.taxAmount.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={3} className="text-right pt-2 font-medium">Total</td>
                      <td className="text-right pt-2 font-mono text-fire font-medium">
                        {inv.currency} {inv.total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                {inv.notes && (
                  <p className="mt-6 pt-4 border-t border-ink-800 text-sm text-bone-300 italic">{inv.notes}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
