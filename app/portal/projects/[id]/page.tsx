import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { Deliverable } from "@/models/Deliverable";
import { Message } from "@/models/Message";
import { Milestone } from "@/models/Milestone";
import { Task } from "@/models/Task";
import { Revision } from "@/models/Revision";
import { User } from "@/models/User";
import { DeliverableCard } from "@/components/portal/deliverable-card";
import { MessagesThread } from "@/components/portal/messages-thread";
import { MilestonesPanel } from "@/components/portal/milestones-panel";
import { KanbanBoard, type Task as KanbanTask } from "@/components/kanban-board";
import { RevisionsPanel, type Revision as RevisionView } from "@/components/revisions-panel";
import { ArrowLeft, FileCheck2, MessageCircle, Flag, ListChecks } from "lucide-react";
import { clientCanAccessProject } from "@/lib/portal-utils";

export const dynamic = "force-dynamic";

async function getData(projectId: string, userId: string, role: string) {
  if (role === "client") {
    const ok = await clientCanAccessProject(userId, projectId);
    if (!ok) return null;
  }

  await connectDB();
  const project = await Project.findById(projectId).lean();
  if (!project) return null;

  const taskFilter = role === "client" ? { project: projectId, visibleToClient: true } : { project: projectId };

  const [deliverables, milestones, rawMessages, rawTasks, rawRevisions] = await Promise.all([
    Deliverable.find({ project: projectId }).sort({ createdAt: -1 }).lean(),
    Milestone.find({ project: projectId }).sort({ order: 1, createdAt: 1 }).lean(),
    Message.find({ project: projectId }).sort({ createdAt: 1 }).lean(),
    Task.find(taskFilter).sort({ status: 1, order: 1 }).lean(),
    Revision.find({ project: projectId }).sort({ createdAt: -1 }).lean(),
  ]);

  // Hydrate users for messages + task comments + revisions
  const userIds = new Set<string>();
  for (const m of rawMessages) userIds.add(String(m.sender));
  for (const t of rawTasks) for (const c of t.comments) userIds.add(String(c.user));
  for (const r of rawRevisions) {
    userIds.add(String(r.createdBy));
    for (const c of r.comments) userIds.add(String(c.user));
  }
  const users = userIds.size
    ? await User.find({ _id: { $in: Array.from(userIds) } }).select("name role").lean()
    : [];
  const userMap = new Map(users.map((u) => [String(u._id), { _id: String(u._id), name: u.name, role: u.role }]));

  const tasks: KanbanTask[] = rawTasks.map((t) => ({
    _id: String(t._id),
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate?.toISOString(),
    visibleToClient: t.visibleToClient,
    comments: t.comments.map((c) => ({
      _id: c._id ? String(c._id) : undefined,
      user: userMap.get(String(c.user)) ?? { _id: String(c.user), name: "Unknown", role: "client" },
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    })),
  }));

  const revisions: RevisionView[] = rawRevisions.map((r) => ({
    _id: String(r._id),
    title: r.title,
    description: r.description,
    priority: r.priority,
    status: r.status,
    attachments: r.attachments ?? [],
    comments: (r.comments ?? []).map((c) => ({
      user: userMap.get(String(c.user)) ?? { _id: String(c.user), name: "Unknown", role: "client" },
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    })),
    createdBy: userMap.get(String(r.createdBy)) ?? { _id: String(r.createdBy), name: "Unknown", role: "client" },
    createdAt: r.createdAt.toISOString(),
    resolvedAt: r.resolvedAt?.toISOString(),
  }));

  return {
    project: {
      _id: String(project._id),
      title: project.title,
      description: project.description,
      coverImage: project.coverImage,
      category: project.category,
      progress: project.progress ?? 0,
    },
    deliverables: deliverables.map((d) => ({
      _id: String(d._id),
      title: d.title,
      description: d.description,
      url: d.url,
      thumbnailUrl: d.thumbnailUrl,
      type: d.type,
      status: d.status,
      feedback: d.feedback,
      version: d.version,
      createdAt: d.createdAt.toISOString(),
    })),
    milestones: milestones.map((m) => ({
      _id: String(m._id),
      title: m.title,
      description: m.description,
      status: m.status,
      dueDate: m.dueDate?.toISOString(),
      completedAt: m.completedAt?.toISOString(),
    })),
    messages: rawMessages.map((m) => ({
      _id: String(m._id),
      body: m.body,
      attachments: m.attachments,
      sender: userMap.get(String(m.sender)) ?? { name: "Unknown", role: "client" },
      senderId: String(m.sender),
      parent: m.parent ? String(m.parent) : undefined,
      mentions: (m.mentions ?? []).map((id) => String(id)),
      reactions: (m.reactions ?? []).map((r) => ({
        emoji: r.emoji,
        users: (r.users ?? []).map((u) => String(u)),
      })),
      editedAt: m.editedAt?.toISOString(),
      createdAt: m.createdAt.toISOString(),
    })),
    tasks,
    revisions,
  };
}

export default async function PortalProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const data = await getData(id, session.user.id, session.user.role);
  if (!data) notFound();

  const isClient = session.user.role === "client";
  const pendingDeliverables = data.deliverables.filter((d) => d.status === "in_review");
  const completedMilestones = data.milestones.filter((m) => m.status === "completed").length;
  const completedTasks = data.tasks.filter((t) => t.status === "completed" || t.status === "approved").length;

  return (
    <div>
      <Link
        href="/portal/projects"
        className="inline-flex items-center gap-2 text-sm text-bone-300 hover:text-fire mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All projects
      </Link>

      <header className="mb-10 relative">
        {data.project.coverImage && (
          <div className="absolute inset-0 -z-10 opacity-20 rounded-sm overflow-hidden">
            <Image src={data.project.coverImage} alt="" fill className="object-cover blur-2xl" />
          </div>
        )}
        <div className="relative pt-8 pb-12 px-8 border border-ink-800 rounded-sm bg-ink-950/80 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-bone-400 mb-3 capitalize">
            {data.project.category.replace("-", " ")}
          </p>
          <h1 className="display-md mb-4 text-balance max-w-2xl">{data.project.title}</h1>
          <p className="text-bone-300 max-w-2xl text-pretty leading-relaxed mb-8">{data.project.description}</p>
          <div className="flex items-center gap-6 max-w-md">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-bone-300 mb-2">
                <span>Overall progress</span>
                <span className="font-mono text-fire">{data.project.progress}%</span>
              </div>
              <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
                <div className="h-full bg-fire transition-all duration-500" style={{ width: `${data.project.progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid sm:grid-cols-4 gap-4 mb-10">
        <MiniStat icon={ListChecks} label="Tasks done" value={`${completedTasks}/${data.tasks.length}`} />
        <MiniStat icon={FileCheck2} label="Pending review" value={pendingDeliverables.length} accent={pendingDeliverables.length > 0} />
        <MiniStat icon={Flag} label="Milestones done" value={`${completedMilestones}/${data.milestones.length}`} />
        <MiniStat icon={MessageCircle} label="Messages" value={data.messages.length} />
      </div>

      {/* Tasks board */}
      {data.tasks.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="display-md">Tasks</h2>
            {isClient && (
              <p className="text-xs text-bone-400">
                Drag to update status · comment to give feedback
              </p>
            )}
          </div>
          <KanbanBoard
            projectId={data.project._id}
            tasks={data.tasks}
            canEdit={true}
            currentUserId={session.user.id}
          />
        </section>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h2 className="display-md mb-6">Deliverables</h2>
            {data.deliverables.length === 0 ? (
              <div className="border border-ink-800 rounded-sm p-10 text-center">
                <p className="text-bone-300">
                  {isClient ? "No deliverables shared yet." : "No deliverables uploaded yet."}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {data.deliverables.map((d) => (
                  <DeliverableCard key={d._id} deliverable={d} isClient={isClient} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="display-md mb-6">Revisions</h2>
            <RevisionsPanel
              projectId={data.project._id}
              revisions={data.revisions}
              canManage={!isClient}
              currentUserId={session.user.id}
            />
          </section>

          <section>
            <h2 className="display-md mb-6">Messages</h2>
            <MessagesThread
              projectId={data.project._id}
              messages={data.messages}
              currentUserId={session.user.id}
            />
          </section>
        </div>

        <aside className="lg:col-span-1">
          <h2 className="eyebrow mb-6">— Milestones</h2>
          <MilestonesPanel milestones={data.milestones} />
        </aside>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className={`border rounded-sm p-5 ${accent ? "border-fire/40 bg-fire/5" : "border-ink-800"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-[0.2em] text-bone-300">{label}</span>
        <Icon className="h-4 w-4 text-fire" strokeWidth={1.5} />
      </div>
      <p className="font-display text-2xl font-medium">{value}</p>
    </div>
  );
}
