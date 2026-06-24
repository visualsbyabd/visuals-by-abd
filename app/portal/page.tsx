import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { Invoice } from "@/models/Invoice";
import { Deliverable } from "@/models/Deliverable";
import { Client } from "@/models/Client";
import { ArrowUpRight, FolderKanban, Receipt, FileCheck2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const session = await auth();
  if (!session?.user) return null;
  await connectDB();

  // For staff viewing the portal as themselves, show no client-specific data
  if (session.user.role !== "client") {
    return { staffPreview: true as const };
  }

  const client = session.user.clientId
    ? await Client.findById(session.user.clientId).lean()
    : null;
  if (!client) return { noClient: true as const };

  const projects = await Project.find({ clientRef: client._id, portalVisible: true })
    .sort({ createdAt: -1 })
    .lean();

  const projectIds = projects.map((p) => p._id);
  const [pendingDeliverables, invoices] = await Promise.all([
    Deliverable.find({ project: { $in: projectIds }, status: "in_review" })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate<{ project: { _id: string; title: string } }>("project", "title")
      .lean(),
    Invoice.find({ client: client._id, status: { $in: ["sent", "overdue"] } }).sort({ dueDate: 1 }).lean(),
  ]);

  return {
    client: { name: client.name, company: client.company, _id: String(client._id) },
    projects: projects.map((p) => ({
      _id: String(p._id),
      title: p.title,
      coverImage: p.coverImage,
      category: p.category,
      progress: p.progress ?? 0,
    })),
    pendingDeliverables: pendingDeliverables.map((d) => ({
      _id: String(d._id),
      title: d.title,
      project: { _id: String(d.project._id), title: d.project.title },
    })),
    invoices: invoices.map((i) => ({
      _id: String(i._id),
      number: i.number,
      total: i.total,
      currency: i.currency,
      status: i.status,
      dueDate: i.dueDate?.toISOString(),
    })),
  };
}

export default async function PortalDashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/login");

  if ("staffPreview" in data) {
    return (
      <div>
        <p className="eyebrow mb-3">— Portal preview</p>
        <h1 className="display-md mb-6">Staff view</h1>
        <div className="border border-fire/40 bg-fire/5 p-6 rounded-sm">
          <p className="text-bone leading-relaxed">
            You're viewing the client portal as a staff user — there's no client-specific data to
            show. Sign in as a client account to see the real portal experience.
          </p>
        </div>
      </div>
    );
  }

  if ("noClient" in data) {
    return (
      <div className="text-center py-24">
        <p className="eyebrow mb-3 justify-center">— Setup pending</p>
        <h1 className="display-md mb-4">Account not linked yet.</h1>
        <p className="text-bone-300 max-w-md mx-auto">
          Your portal account isn't linked to a client record. Reach out to your project lead and
          they'll connect everything.
        </p>
      </div>
    );
  }

  const { client, projects, pendingDeliverables, invoices } = data;
  const activeProjects = projects.length;
  const inReview = pendingDeliverables.length;
  const outstanding = invoices.length;

  return (
    <div>
      <div className="mb-12">
        <p className="eyebrow mb-3">— Overview</p>
        <h1 className="display-md text-balance">
          Hi {client.name.split(" ")[0]}, <span className="italic font-light text-fire">here's your studio.</span>
        </h1>
        {client.company && (
          <p className="text-bone-300 mt-2">{client.company}</p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        <StatCard label="Active projects" value={activeProjects.toString()} icon={FolderKanban} accent={activeProjects > 0} />
        <StatCard label="Awaiting your review" value={inReview.toString()} icon={FileCheck2} accent={inReview > 0} />
        <StatCard label="Outstanding invoices" value={outstanding.toString()} icon={Receipt} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Projects */}
        <section className="lg:col-span-2 border border-ink-800 rounded-sm">
          <header className="flex items-center justify-between p-6 border-b border-ink-800">
            <h2 className="font-display text-lg font-medium">Your Projects</h2>
            <Link
              href="/portal/projects"
              className="text-sm text-bone-300 hover:text-fire transition-colors inline-flex items-center gap-1 group"
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:rotate-45" />
            </Link>
          </header>
          {projects.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-bone-300">No active projects yet. We'll let you know when we kick off.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-800">
              {projects.slice(0, 5).map((p) => (
                <li key={p._id}>
                  <Link
                    href={`/portal/projects/${p._id}`}
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
                      <p className="text-xs text-bone-400 uppercase tracking-wider mt-1 capitalize">
                        {p.category.replace("-", " ")}
                      </p>
                      <div className="mt-2 flex items-center gap-3 max-w-xs">
                        <div className="flex-1 h-1 bg-ink-800 rounded-full overflow-hidden">
                          <div className="h-full bg-fire transition-all" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs text-bone-400 font-mono">{p.progress}%</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right column: pending + invoices */}
        <div className="space-y-6">
          <section className="border border-ink-800 rounded-sm">
            <h2 className="px-5 py-3 border-b border-ink-800 text-xs uppercase tracking-[0.2em] text-bone-300 font-medium flex items-center justify-between">
              Awaiting Review
              {inReview > 0 && <span className="text-fire">{inReview}</span>}
            </h2>
            <div className="p-5">
              {pendingDeliverables.length === 0 ? (
                <p className="text-sm text-bone-400">Nothing waiting on you right now.</p>
              ) : (
                <ul className="space-y-3">
                  {pendingDeliverables.map((d) => (
                    <li key={d._id}>
                      <Link
                        href={`/portal/projects/${d.project._id}`}
                        className="block group"
                      >
                        <p className="text-sm group-hover:text-fire transition-colors truncate">{d.title}</p>
                        <p className="text-xs text-bone-400 truncate">{d.project.title}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="border border-ink-800 rounded-sm">
            <h2 className="px-5 py-3 border-b border-ink-800 text-xs uppercase tracking-[0.2em] text-bone-300 font-medium">
              Open Invoices
            </h2>
            <div className="p-5">
              {invoices.length === 0 ? (
                <p className="text-sm text-bone-400">All caught up.</p>
              ) : (
                <ul className="space-y-3">
                  {invoices.map((i) => (
                    <li key={i._id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-mono">{i.number}</p>
                        <p className="text-xs text-bone-400">{i.currency} {i.total.toFixed(2)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 border rounded-full uppercase tracking-wider ${
                        i.status === "overdue" ? "border-fire text-fire bg-fire/10" : "border-ink-700 text-bone-300"
                      }`}>
                        {i.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent?: boolean;
}) {
  return (
    <div className={`border rounded-sm p-6 relative overflow-hidden ${accent ? "border-fire/40 bg-fire/5" : "border-ink-800"}`}>
      {accent && (
        <div
          className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #D62828 0%, transparent 70%)" }}
        />
      )}
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs uppercase tracking-[0.2em] text-bone-300">{label}</span>
          <Icon className="h-4 w-4 text-fire" strokeWidth={1.5} />
        </div>
        <p className="font-display text-4xl font-medium tracking-tight">{value}</p>
      </div>
    </div>
  );
}
