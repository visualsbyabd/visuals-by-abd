import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/models/Invoice";
import { Client } from "@/models/Client";
import { Plus, Receipt, Download } from "lucide-react";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  draft: "border-ink-700 text-bone-300 bg-ink-900",
  sent: "border-bone-300 text-bone bg-ink-900",
  paid: "border-fire/40 text-fire bg-fire/5",
  overdue: "border-fire text-fire bg-fire/10",
  cancelled: "border-ink-700 text-bone-400 bg-ink-900",
};

async function getData() {
  try {
    await connectDB();
    const invoices = await Invoice.find()
      .sort({ issueDate: -1 })
      .populate<{ client: { _id: string; name: string; company?: string } }>("client", "name company")
      .lean();
    const totalOutstanding = invoices
      .filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((s, i) => s + i.total, 0);
    return {
      invoices: invoices.map((i) => ({
        _id: String(i._id),
        number: i.number,
        clientName: i.client?.name ?? "Deleted client",
        clientCompany: i.client?.company,
        total: i.total,
        currency: i.currency,
        status: i.status,
        issueDate: i.issueDate?.toISOString(),
        dueDate: i.dueDate?.toISOString(),
      })),
      totalOutstanding,
    };
  } catch {
    return { invoices: [], totalOutstanding: 0 };
  }
}

export default async function AdminInvoicesPage() {
  const { invoices, totalOutstanding } = await getData();

  return (
    <div>
      <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
        <div>
          <p className="eyebrow mb-3">— Billing</p>
          <h1 className="display-md text-balance">Invoices</h1>
          <p className="text-bone-300 mt-2">
            {invoices.length} total ·{" "}
            <span className="text-fire">${totalOutstanding.toFixed(2)}</span> outstanding
          </p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow text-bone px-6 py-3 rounded-full transition-all text-sm font-medium shadow-[0_0_40px_-10px_rgba(214,40,40,0.6)]"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="border border-ink-800 rounded-sm p-16 text-center">
          <Receipt className="h-10 w-10 text-bone-400 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-bone-300 mb-6">No invoices yet.</p>
          <Link
            href="/admin/invoices/new"
            className="inline-flex items-center gap-2 border border-ink-700 hover:border-fire hover:text-fire px-5 py-2.5 rounded-full text-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            Create first invoice
          </Link>
        </div>
      ) : (
        <div className="border border-ink-800 rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-800 bg-ink-950">
                <th className="text-left text-xs uppercase tracking-[0.2em] text-bone-400 px-6 py-3 font-medium">
                  Number
                </th>
                <th className="text-left text-xs uppercase tracking-[0.2em] text-bone-400 px-6 py-3 font-medium">
                  Client
                </th>
                <th className="text-right text-xs uppercase tracking-[0.2em] text-bone-400 px-6 py-3 font-medium">
                  Amount
                </th>
                <th className="text-left text-xs uppercase tracking-[0.2em] text-bone-400 px-6 py-3 font-medium hidden md:table-cell">
                  Issued
                </th>
                <th className="text-left text-xs uppercase tracking-[0.2em] text-bone-400 px-6 py-3 font-medium">
                  Status
                </th>
                <th className="text-right text-xs uppercase tracking-[0.2em] text-bone-400 px-6 py-3 font-medium w-20">
                  PDF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-ink-950 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/invoices/${inv._id}`} className="font-mono text-sm hover:text-fire transition-colors">
                      {inv.number}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{inv.clientName}</p>
                    {inv.clientCompany && (
                      <p className="text-xs text-bone-400">{inv.clientCompany}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-mono">
                    {inv.currency} {inv.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-bone-300 hidden md:table-cell">
                    {inv.issueDate
                      ? new Date(inv.issueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-3 py-1 border rounded-full uppercase tracking-wider ${statusStyles[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={`/api/invoices/${inv._id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-bone-300 hover:text-fire transition-colors"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
