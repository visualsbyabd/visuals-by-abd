import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { Client } from "@/models/Client";
import { Project } from "@/models/Project";
import { Plus, ArrowUpRight, Mail, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

async function getClients() {
  try {
    await connectDB();
    const clients = await Client.find().sort({ createdAt: -1 }).lean();
    const counts = await Project.aggregate([
      { $match: { clientRef: { $ne: null } } },
      { $group: { _id: "$clientRef", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    return clients.map((c) => ({
      _id: String(c._id),
      name: c.name,
      company: c.company,
      email: c.email,
      status: c.status,
      hasPortalAccess: !!c.user,
      projectCount: countMap.get(String(c._id)) ?? 0,
    }));
  } catch {
    return [];
  }
}

export default async function AdminClientsPage() {
  const clients = await getClients();
  const active = clients.filter((c) => c.status === "active").length;

  return (
    <div>
      <div className="flex items-end justify-between gap-6 flex-wrap mb-12">
        <div>
          <p className="eyebrow mb-3">— Manage</p>
          <h1 className="display-md text-balance">Clients</h1>
          <p className="text-bone-300 mt-2">{active} active · {clients.length} total</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow text-bone px-6 py-3 rounded-full transition-all text-sm font-medium shadow-[0_0_40px_-10px_rgba(214,40,40,0.6)]"
        >
          <Plus className="h-4 w-4" />
          New Client
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="border border-ink-800 rounded-sm p-16 text-center">
          <p className="text-bone-300 mb-6">No clients yet. Add your first.</p>
          <Link
            href="/admin/clients/new"
            className="inline-flex items-center gap-2 border border-ink-700 hover:border-fire hover:text-fire px-5 py-2.5 rounded-full text-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            Create client
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <Link
              key={c._id}
              href={`/admin/clients/${c._id}`}
              className="group border border-ink-800 hover:border-fire/40 rounded-sm p-6 transition-all relative"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="h-12 w-12 rounded-full bg-fire/20 border border-fire/40 grid place-items-center text-fire font-medium">
                  {c.name.slice(0, 1).toUpperCase()}
                </div>
                <ArrowUpRight className="h-4 w-4 text-bone-400 group-hover:text-fire group-hover:rotate-45 transition-all" />
              </div>
              <h3 className="font-display text-xl font-medium mb-1 group-hover:text-fire transition-colors">
                {c.name}
              </h3>
              {c.company && (
                <p className="text-sm text-bone-300 mb-4 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> {c.company}
                </p>
              )}
              <p className="text-xs text-bone-400 mb-6 flex items-center gap-1.5 truncate">
                <Mail className="h-3 w-3 flex-shrink-0" /> {c.email}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-ink-800 text-xs">
                <span className="text-bone-300">
                  {c.projectCount} project{c.projectCount !== 1 ? "s" : ""}
                </span>
                <span
                  className={`px-2 py-1 rounded-full border ${
                    c.hasPortalAccess
                      ? "border-fire/40 text-fire bg-fire/5"
                      : "border-ink-700 text-bone-400"
                  }`}
                >
                  {c.hasPortalAccess ? "Portal" : "No portal"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
