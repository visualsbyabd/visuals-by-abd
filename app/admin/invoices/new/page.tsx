import { connectDB } from "@/lib/mongodb";
import { Client } from "@/models/Client";
import { Project } from "@/models/Project";
import { Invoice } from "@/models/Invoice";
import { InvoiceForm } from "@/components/admin/invoice-form";

async function getOptions() {
  await connectDB();
  const [clients, projects, lastInvoice] = await Promise.all([
    Client.find({ status: "active" }).sort({ name: 1 }).select("name company").lean(),
    Project.find({ clientRef: { $exists: true, $ne: null } })
      .sort({ createdAt: -1 })
      .select("title clientRef")
      .lean(),
    Invoice.findOne().sort({ createdAt: -1 }).select("number").lean(),
  ]);

  // Auto-suggest the next invoice number (INV-YYYY-NNN)
  const year = new Date().getFullYear();
  let nextNumber = `INV-${year}-001`;
  if (lastInvoice?.number) {
    const m = lastInvoice.number.match(/INV-(\d{4})-(\d+)$/);
    if (m) {
      const lastYear = parseInt(m[1]);
      const lastSeq = parseInt(m[2]);
      if (lastYear === year) {
        nextNumber = `INV-${year}-${String(lastSeq + 1).padStart(3, "0")}`;
      }
    }
  }

  return {
    clients: clients.map((c) => ({ _id: String(c._id), name: c.name, company: c.company })),
    projects: projects.map((p) => ({
      _id: String(p._id),
      title: p.title,
      client: p.clientRef ? String(p.clientRef) : undefined,
    })),
    nextNumber,
  };
}

export default async function NewInvoicePage() {
  const { clients, projects, nextNumber } = await getOptions();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-4xl">
      <InvoiceForm
        mode="create"
        clients={clients}
        projects={projects}
        initial={{
          number: nextNumber,
          client: "",
          project: "",
          items: [{ description: "", quantity: 1, unitPrice: 0 }],
          currency: "USD",
          taxRate: 0,
          status: "draft",
          issueDate: today,
          dueDate: "",
          notes: "",
        }}
      />
    </div>
  );
}
