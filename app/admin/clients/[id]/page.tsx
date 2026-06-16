import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/mongodb";
import { Client } from "@/models/Client";
import { Project } from "@/models/Project";
import { Invoice } from "@/models/Invoice";
import { ClientForm } from "@/components/admin/client-form";
import { ProjectAssignmentList } from "@/components/admin/project-assignment-list";
import { ArrowLeft, Mail, Building2, Phone, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

async function getData(id: string) {
  try {
    await connectDB();
    const client = await Client.findById(id).lean();
    if (!client) return null;

    const [assignedProjects, unassignedProjects, invoices] = await Promise.all([
      Project.find({ clientRef: id }).sort({ createdAt: -1 }).select("title slug status progress coverImage portalVisible").lean(),
      Project.find({ $or: [{ clientRef: { $exists: false } }, { clientRef: null }] })
        .sort({ createdAt: -1 })
        .select("title slug")
        .limit(50)
        .lean(),
      Invoice.find({ client: id }).sort({ issueDate: -1 }).limit(10).lean(),
    ]);

    return {
      client: JSON.parse(JSON.stringify(client)),
      assignedProjects: assignedProjects.map((p) => ({
        _id: String(p._id),
        title: p.title,
        slug: p.slug,
        status: p.status,
        progress: p.progress ?? 0,
        coverImage: p.coverImage,
        portalVisible: p.portalVisible,
      })),
      unassignedProjects: unassignedProjects.map((p) => ({
        _id: String(p._id),
        title: p.title,
      })),
      invoices: invoices.map((i) => ({
        _id: String(i._id),
        number: i.number,
        status: i.status,
        total: i.total,
        currency: i.currency,
        issueDate: i.issueDate?.toISOString(),
      })),
    };
  } catch {
    return null;
  }
}

const statusColors: Record<string, string> = {
  published: "text-fire border-fire/40 bg-fire/5",
  draft: "text-bone-300 border-ink-700 bg-ink-900",
  archived: "text-bone-400 border-ink-700 bg-ink-900",
  paid: "text-fire border-fire/40 bg-fire/5",
  sent: "text-bone border-ink-700 bg-ink-900",
  overdue: "text-fire border-fire/40 bg-fire/10",
  cancelled: "text-bone-400 border-ink-700 bg-ink-900",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();
  const { client, assignedProjects, unassignedProjects, invoices } = data;

  return (
    <div>
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-sm text-bone-300 hover:text-fire mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All clients
      </Link>

      {/* Header card */}
      <div className="border border-ink-800 rounded-sm p-8 mb-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #D62828 0%, transparent 70%)" }} />
        <div className="flex items-start gap-6 relative">
          <div className="h-16 w-16 rounded-full bg-fire/20 border border-fire/40 grid place-items-center text-fire font-display text-xl">
            {client.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="display-md mb-2">{client.name}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-bone-300">
              {client.company && (
                <span className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" /> {client.company}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> {client.email}
              </span>
              {client.phone && (
                <span className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {client.phone}
                </span>
              )}
            </div>
            {client.user && (
              <p className="mt-3 text-xs text-fire flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-fire animate-glow-pulse" />
                Has portal access
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main col */}
        <div className="lg:col-span-2 space-y-8">
          {/* Projects */}
          <section className="border border-ink-800 rounded-sm">
            <h2 className="px-6 py-4 border-b border-ink-800 text-xs uppercase tracking-[0.2em] text-bone-300 font-medium">
              Projects ({assignedProjects.length})
            </h2>
            <div className="p-6">
              {assignedProjects.length === 0 ? (
                <p className="text-sm text-bone-400 mb-6">
                  No projects assigned to this client yet.
                </p>
              ) : (
                <ul className="divide-y divide-ink-800 -m-6 mb-6">
                  {assignedProjects.map((p) => (
                    <li key={p._id}>
                      <Link
                        href={`/admin/projects/${p._id}`}
                        className="flex items-center gap-4 p-6 hover:bg-ink-900 transition-colors group"
                      >
                        <div className="relative h-14 w-20 rounded-sm bg-ink-900 overflow-hidden flex-shrink-0">
                          {p.coverImage ? (
                            <Image src={p.coverImage} alt="" fill className="object-cover" sizes="80px" />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:text-fire transition-colors">
                            {p.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 border rounded-full uppercase tracking-wider ${statusColors[p.status]}`}>
                              {p.status}
                            </span>
                            {p.portalVisible && (
                              <span className="text-xs px-2 py-0.5 border border-fire/40 text-fire bg-fire/5 rounded-full uppercase tracking-wider">
                                Portal
                              </span>
                            )}
                          </div>
                          {p.progress > 0 && (
                            <div className="mt-2 flex items-center gap-2 max-w-xs">
                              <div className="flex-1 h-1 bg-ink-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-fire"
                                  style={{ width: `${p.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-bone-400">{p.progress}%</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <ProjectAssignmentList
                clientId={id}
                unassigned={unassignedProjects}
              />
            </div>
          </section>

          {/* Invoices */}
          <section className="border border-ink-800 rounded-sm">
            <div className="px-6 py-4 border-b border-ink-800 flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-[0.2em] text-bone-300 font-medium">
                Invoices ({invoices.length})
              </h2>
              <Link href="/admin/invoices/new" className="text-xs text-fire hover:underline">
                + New invoice
              </Link>
            </div>
            <div className="p-6">
              {invoices.length === 0 ? (
                <p className="text-sm text-bone-400">No invoices yet.</p>
              ) : (
                <ul className="divide-y divide-ink-800 -m-6">
                  {invoices.map((inv) => (
                    <li key={inv._id} className="flex items-center justify-between p-6 hover:bg-ink-900 transition-colors">
                      <div>
                        <p className="font-mono text-sm">{inv.number}</p>
                        <p className="text-xs text-bone-400 mt-1">
                          {inv.currency} {inv.total.toFixed(2)}
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1 border rounded-full uppercase tracking-wider ${statusColors[inv.status] ?? statusColors.draft}`}>
                        {inv.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Edit form */}
        <div className="lg:col-span-1">
          <h2 className="eyebrow mb-6">— Edit client</h2>
          <ClientForm
            mode="edit"
            initial={{
              _id: id,
              name: client.name,
              company: client.company,
              email: client.email,
              phone: client.phone,
              status: client.status,
              notes: client.notes,
              hasPortalAccess: !!client.user,
            }}
          />
        </div>
      </div>
    </div>
  );
}
