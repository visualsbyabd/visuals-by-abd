import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { Media } from "@/models/Media";
import { Task } from "@/models/Task";
import { Invoice } from "@/models/Invoice";
import { Deliverable } from "@/models/Deliverable";
import { Client } from "@/models/Client";

export type SearchResult = {
  id: string;
  type: "project" | "client" | "file" | "task" | "invoice" | "deliverable";
  title: string;
  subtitle?: string;
  link: string;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  await connectDB();
  const regex = new RegExp(escapeRegex(q), "i");
  const role = session.user.role;
  const isClient = role === "client";
  const clientId = session.user.clientId;
  const adminLink = (path: string) => (isClient ? path.replace("/admin/", "/portal/") : path);

  // For clients, scope all queries to their projects/invoices
  let clientProjectIds: import("mongoose").Types.ObjectId[] = [];
  if (isClient && clientId) {
    const projects = await Project.find({ clientRef: clientId, portalVisible: true }).select("_id").lean();
    clientProjectIds = projects.map((p) => p._id);
  }

  const [projects, clients, files, tasks, invoices, deliverables] = await Promise.all([
    Project.find({
      $and: [
        isClient ? { clientRef: clientId, portalVisible: true } : {},
        { $or: [{ title: regex }, { description: regex }, { tags: regex }] },
      ],
    })
      .select("title slug description category")
      .limit(8)
      .lean(),
    isClient
      ? Promise.resolve([])
      : Client.find({ $or: [{ name: regex }, { company: regex }, { email: regex }] })
          .select("name company email")
          .limit(8)
          .lean(),
    Media.find({
      $and: [
        isClient ? { client: clientId, visibleToClient: true } : {},
        { $or: [{ originalName: regex }, { tags: regex }] },
      ],
    })
      .select("originalName url type")
      .limit(8)
      .lean(),
    Task.find({
      $and: [
        isClient ? { project: { $in: clientProjectIds }, visibleToClient: true } : {},
        { $or: [{ title: regex }, { description: regex }] },
      ],
    })
      .select("title status project")
      .limit(8)
      .lean(),
    Invoice.find({
      $and: [isClient ? { client: clientId } : {}, { $or: [{ number: regex }, { notes: regex }] }],
    })
      .select("number total currency status")
      .limit(6)
      .lean(),
    Deliverable.find({
      $and: [
        isClient ? { project: { $in: clientProjectIds } } : {},
        { $or: [{ title: regex }, { description: regex }] },
      ],
    })
      .select("title status project")
      .limit(6)
      .lean(),
  ]);

  const results: SearchResult[] = [
    ...projects.map((p) => ({
      id: `p-${p._id}`,
      type: "project" as const,
      title: p.title,
      subtitle: (p.category as string).replace("-", " "),
      link: isClient ? `/portal/projects/${p._id}` : `/admin/projects/${p._id}`,
    })),
    ...clients.map((c) => ({
      id: `c-${c._id}`,
      type: "client" as const,
      title: c.name,
      subtitle: c.company ?? c.email,
      link: `/admin/clients/${c._id}`,
    })),
    ...files.map((f) => ({
      id: `f-${f._id}`,
      type: "file" as const,
      title: f.originalName,
      subtitle: f.type,
      link: f.url,
    })),
    ...tasks.map((t) => ({
      id: `t-${t._id}`,
      type: "task" as const,
      title: t.title,
      subtitle: (t.status as string).replace("_", " "),
      link: adminLink(`/admin/projects/${t.project}`),
    })),
    ...invoices.map((i) => ({
      id: `i-${i._id}`,
      type: "invoice" as const,
      title: i.number,
      subtitle: `${i.currency} ${i.total.toFixed(2)} · ${i.status}`,
      link: isClient ? `/portal/invoices` : `/admin/invoices/${i._id}`,
    })),
    ...deliverables.map((d) => ({
      id: `d-${d._id}`,
      type: "deliverable" as const,
      title: d.title,
      subtitle: (d.status as string).replace("_", " "),
      link: adminLink(`/admin/projects/${d.project}`),
    })),
  ];

  return NextResponse.json({ results });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
