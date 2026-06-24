import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { Client } from "@/models/Client";
import { Deliverable } from "@/models/Deliverable";
import { Milestone } from "@/models/Milestone";
import { Task } from "@/models/Task";
import { Revision } from "@/models/Revision";
import { User } from "@/models/User";
import { ProjectForm } from "@/components/admin/project-form";
import { ProjectPortalControls } from "@/components/admin/project-portal-controls";
import { ProjectMediaPanel, type ProjectMediaItem } from "@/components/admin/project-media-panel";
import { ProjectDeliverablesPanel } from "@/components/admin/project-deliverables-panel";
import { ProjectMilestonesPanel } from "@/components/admin/project-milestones-panel";
import { KanbanBoard, type Task as KanbanTask } from "@/components/kanban-board";
import { RevisionsPanel, type Revision as RevisionView } from "@/components/revisions-panel";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

async function getProjectData(id: string) {
  try {
    await connectDB();
    // Same gateway-mitigation as the public page: only fetch the first batch of
    // media items, then expose the remainder via "Load more" in the panel.
    const ADMIN_INITIAL_MEDIA_PAGE = 5;
    const project = await Project.findById(id, {
      media: { $slice: ADMIN_INITIAL_MEDIA_PAGE },
    }).lean();
    if (!project) return null;

    // Total count for the Load more affordance.
    const [agg] = await Project.aggregate([
      { $match: { _id: project._id } },
      { $project: { count: { $size: { $ifNull: ["$media", []] } } } },
    ]);
    const totalMedia = (agg?.count as number) ?? 0;
    const [clients, deliverables, milestones, rawTasks, rawRevisions] = await Promise.all([
      Client.find({ status: "active" }).sort({ name: 1 }).select("name company").lean(),
      Deliverable.find({ project: id }).sort({ createdAt: -1 }).lean(),
      Milestone.find({ project: id }).sort({ order: 1, createdAt: 1 }).lean(),
      Task.find({ project: id }).sort({ status: 1, order: 1 }).lean(),
      Revision.find({ project: id }).sort({ createdAt: -1 }).lean(),
    ]);

    // Hydrate task comment users + revision users
    const userIds = new Set<string>();
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

    const media: ProjectMediaItem[] = (project.media ?? [])
      .map((m: ProjectMediaItem) => ({
        type: m.type,
        url: m.url,
        thumbnail: m.thumbnail,
        alt: m.alt,
        title: m.title,
        description: m.description,
        tags: m.tags ?? [],
        featured: !!m.featured,
        duration: m.duration,
        orientation: m.orientation,
        order: m.order ?? 0,
      }))
      .sort((a, b) => a.order - b.order);

    return {
      project: JSON.parse(JSON.stringify(project)),
      clients: clients.map((c) => ({ _id: String(c._id), name: c.name, company: c.company })),
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
        order: m.order,
      })),
      tasks,
      revisions,
      media,
      totalMedia,
    };
  } catch {
    return null;
  }
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const data = await getProjectData(id);
  if (!data || !session?.user) notFound();
  const { project, clients, deliverables, milestones, tasks, revisions, media, totalMedia } = data;

  return (
    <div className="space-y-10">
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-2 text-sm text-bone-300 hover:text-fire transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All projects
      </Link>

      <ProjectPortalControls
        projectId={String(project._id)}
        currentClientId={project.clientRef ? String(project.clientRef) : ""}
        currentProgress={project.progress ?? 0}
        portalVisible={!!project.portalVisible}
        clients={clients}
      />

      <ProjectMediaPanel
        projectId={String(project._id)}
        media={media}
        totalMedia={totalMedia}
        mediaLayout={project.mediaLayout ?? "mixed"}
      />

      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-medium">Tasks</h2>
            <p className="text-xs text-bone-400 mt-1">Drag between columns. Toggle "Visible to client" per task.</p>
          </div>
        </div>
        <KanbanBoard
          projectId={String(project._id)}
          tasks={tasks}
          canEdit={true}
          currentUserId={session.user.id}
        />
      </section>

      <ProjectDeliverablesPanel projectId={String(project._id)} deliverables={deliverables} />

      <RevisionsPanel
        projectId={String(project._id)}
        revisions={revisions}
        canManage={true}
        currentUserId={session.user.id}
      />

      <ProjectMilestonesPanel projectId={String(project._id)} milestones={milestones} />

      <div className="border-t border-ink-800 pt-10">
        <p className="eyebrow mb-6">— Public case study fields</p>
        <ProjectForm
          mode="edit"
          initial={{
            ...project,
            _id: String(project._id),
          }}
        />
      </div>
    </div>
  );
}
