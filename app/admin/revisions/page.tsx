import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { Revision } from "@/models/Revision";
import { Project } from "@/models/Project";
import { Client } from "@/models/Client";
import { GitPullRequestArrow, CheckCircle2, Clock, Wrench, Circle } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_META = {
  open: { label: "Open", icon: Circle, color: "text-fire border-fire/40 bg-fire/5" },
  in_review: { label: "In Review", icon: Clock, color: "text-bone-300 border-bone-300/40 bg-ink-900" },
  working: { label: "Working", icon: Wrench, color: "text-fire border-fire/40 bg-fire/10" },
  resolved: { label: "Resolved", icon: CheckCircle2, color: "text-fire border-fire/60 bg-fire/10" },
  closed: { label: "Closed", icon: CheckCircle2, color: "text-bone-400 border-ink-700 bg-ink-900" },
} as const;

const PRIORITY_STYLES = {
  low: "text-bone-400 border-ink-700",
  medium: "text-bone-300 border-ink-700",
  high: "text-fire border-fire/40 bg-fire/5",
} as const;

async function getData() {
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
      </div>

      {revisions.length === 0 ? (
        <div className="border border-ink-800 rounded-sm p-16 text-center">
          <GitPullRequestArrow className="h-10 w-10 text-bone-400 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-bone-300">No revisions logged yet.</p>
          <p className="text-xs text-bone-400 mt-2">Clients can submit revisions from their portal, or you can log them per project.</p>
        </div>
      ) : (
        <div className="border border-ink-800 rounded-sm divide-y divide-ink-800">
          {revisions.map((r) => {
            const meta = STATUS_META[r.status as keyof typeof STATUS_META];
            const Icon = meta.icon;
            return (
              <Link
                key={r._id}
                href={`/admin/projects/${r.project}`}
                className="flex items-start gap-4 p-5 hover:bg-ink-950 transition-colors group"
              >
                <span className={`mt-0.5 flex-shrink-0 h-8 w-8 rounded-full grid place-items-center border ${meta.color}`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium truncate group-hover:text-fire transition-colors">{r.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 border rounded-full uppercase tracking-wider ${PRIORITY_STYLES[r.priority as keyof typeof PRIORITY_STYLES]}`}>
                      {r.priority}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 border rounded-full uppercase tracking-wider ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-sm text-bone-400 line-clamp-1">{r.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-bone-400 flex-wrap">
                    <span>{r.clientName}</span>
                    <span>·</span>
                    <span>{r.projectTitle}</span>
                    <span>·</span>
                    <time>{new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
                    {r.commentsCount > 0 && (
                      <>
                        <span>·</span>
                        <span>{r.commentsCount} {r.commentsCount === 1 ? "reply" : "replies"}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
