import { connectDB } from "@/lib/mongodb";
import { Revision } from "@/models/Revision";
import { Project } from "@/models/Project";
import { Client } from "@/models/Client";
import { RevisionRow, EmptyState, type AdminRevision } from "@/components/admin/revision-row";

export const dynamic = "force-dynamic";

async function getData(): Promise<AdminRevision[]> {
  await connectDB();
  const revisions = await Revision.find().sort({ createdAt: -1 }).limit(200).lean();
  const projectIds = [...new Set(revisions.map((r) => String(r.project)))];
  const clientIds = [...new Set(revisions.map((r) => String(r.client)))];
  const [projects, clients] = await Promise.all([
    Project.find({ _id: { $in: projectIds } }).select("title").lean(),
    Client.find({ _id: { $in: clientIds } }).select("name").lean(),
  ]);
  const projectMap = new Map(projects.map((p) => [String(p._id), p.title]));
  const clientMap = new Map(clients.map((c) => [String(c._id), c.name]));

  return revisions.map((r) => ({
    _id: String(r._id),
    title: r.title,
    description: r.description,
    priority: r.priority,
    status: r.status,
    project: String(r.project),
    projectTitle: projectMap.get(String(r.project)) ?? "Unknown project",
    clientName: clientMap.get(String(r.client)) ?? "Unknown",
    createdAt: r.createdAt.toISOString(),
    commentsCount: (r.comments ?? []).length,
    attachmentsCount: (r.attachments ?? []).length,
  }));
}

export default async function AdminRevisionsPage() {
  const revisions = await getData();
  const open = revisions.filter((r) =>
    ["open", "in_review", "working"].includes(r.status)
  ).length;

  return (
    <div>
      <div className="mb-12">
        <p className="eyebrow mb-3">— Studio</p>
        <h1 className="display-md text-balance">Revisions</h1>
        <p className="text-bone-300 mt-2">
          {revisions.length === 0
            ? "No revisions logged yet across any project."
            : `${open} open · ${revisions.length} total across all projects.`}
        </p>
        <p className="text-xs text-bone-400 mt-3">
          To add a new revision, open a specific project and use the Revisions panel — they're always
          scoped to a single project. From this page you can edit or delete any revision across all projects.
        </p>
      </div>

      {revisions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="border border-ink-800 rounded-sm divide-y divide-ink-800">
          {revisions.map((r) => (
            <RevisionRow key={r._id} revision={r} />
          ))}
        </div>
      )}
    </div>
  );
}
