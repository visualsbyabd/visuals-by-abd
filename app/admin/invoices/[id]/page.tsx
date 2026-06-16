import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Client } from "@/models/Client";
import { Project } from "@/models/Project";
import { Invoice } from "@/models/Invoice";
import { InvoiceForm } from "@/components/admin/invoice-form";

export const dynamic = "force-dynamic";

async function getData(id: string) {
  try {
    await connectDB();
    const invoice = await Invoice.findById(id).lean();
    if (!invoice) return null;
    const [clients, projects] = await Promise.all([
      Client.find({ status: "active" }).sort({ name: 1 }).select("name company").lean(),
      Project.find({ clientRef: { $exists: true, $ne: null } })
        .sort({ createdAt: -1 })
        .select("title clientRef")
        .lean(),
    ]);
    return {
      invoice,
      clients: clients.map((c) => ({ _id: String(c._id), name: c.name, company: c.company })),
      projects: projects.map((p) => ({
        _id: String(p._id),
        title: p.title,
        client: p.clientRef ? String(p.clientRef) : undefined,
      })),
    };
  } catch {
    return null;
  }
}

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();
  const inv = data.invoice;

  return (
    <div className="max-w-4xl">
      <InvoiceForm
        mode="edit"
        clients={data.clients}
        projects={data.projects}
        initial={{
          _id: id,
          number: inv.number,
          client: String(inv.client),
          project: inv.project ? String(inv.project) : "",
          items: inv.items.map((it: { description: string; quantity: number; unitPrice: number }) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
          currency: inv.currency,
          taxRate: inv.taxRate ?? 0,
          status: inv.status,
          issueDate: inv.issueDate ? new Date(inv.issueDate).toISOString().slice(0, 10) : "",
          dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : "",
          notes: inv.notes ?? "",
        }}
      />
    </div>
  );
}
