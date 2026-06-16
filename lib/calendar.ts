import { connectDB } from "@/lib/mongodb";
import { Milestone } from "@/models/Milestone";
import { Deliverable } from "@/models/Deliverable";
import { Invoice } from "@/models/Invoice";
import { Task } from "@/models/Task";
import { Project } from "@/models/Project";
import type { CalendarEvent } from "@/components/calendar-view";

export async function getCalendarEvents(opts?: {
  clientId?: string;
  visibleToClientOnly?: boolean;
  linkPrefix?: "admin" | "portal";
}): Promise<CalendarEvent[]> {
  await connectDB();
  const prefix = opts?.linkPrefix ?? "admin";

  let projectIds: import("mongoose").Types.ObjectId[] | undefined;
  if (opts?.clientId) {
    const projects = await Project.find({ clientRef: opts.clientId, portalVisible: true })
      .select("_id")
      .lean();
    projectIds = projects.map((p) => p._id);
    if (projectIds.length === 0) return [];
  }

  const projectMatch = projectIds ? { project: { $in: projectIds } } : {};

  const [milestones, deliverables, invoices, tasks] = await Promise.all([
    Milestone.find({ ...projectMatch, dueDate: { $exists: true } }).select("title dueDate completedAt project status").lean(),
    Deliverable.find({ ...projectMatch }).select("title createdAt dueDate project status").lean(),
    Invoice.find({
      ...(opts?.clientId ? { client: opts.clientId } : {}),
      dueDate: { $exists: true },
    }).select("number dueDate status").lean(),
    Task.find({
      ...projectMatch,
      dueDate: { $exists: true },
      ...(opts?.visibleToClientOnly ? { visibleToClient: true } : {}),
    })
      .select("title dueDate project status")
      .lean(),
  ]);

  const events: CalendarEvent[] = [];

  for (const m of milestones) {
    if (m.dueDate) {
      events.push({
        id: `m-${m._id}`,
        date: (m.completedAt ?? m.dueDate).toISOString(),
        title: m.title,
        type: "milestone",
        link: `/${prefix}/projects/${m.project}`,
        meta: m.status,
      });
    }
  }
  for (const d of deliverables) {
    // Prefer the explicit due date the admin set; fall back to creation date.
    const date = d.dueDate ?? d.createdAt;
    events.push({
      id: `d-${d._id}`,
      date: date.toISOString(),
      title: d.title,
      type: "deliverable",
      link: `/${prefix}/projects/${d.project}`,
      meta: d.status,
    });
  }
  for (const i of invoices) {
    if (i.dueDate) {
      events.push({
        id: `i-${i._id}`,
        date: i.dueDate.toISOString(),
        title: `${i.number} due`,
        type: "invoice",
        link: prefix === "admin" ? `/admin/invoices/${i._id}` : `/portal/invoices`,
        meta: i.status,
      });
    }
  }
  for (const t of tasks) {
    if (t.dueDate) {
      events.push({
        id: `t-${t._id}`,
        date: t.dueDate.toISOString(),
        title: t.title,
        type: "task",
        link: `/${prefix}/projects/${t.project}`,
        meta: t.status,
      });
    }
  }

  return events;
}
