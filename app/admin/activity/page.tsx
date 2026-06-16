import { connectDB } from "@/lib/mongodb";
import { Activity } from "@/models/Activity";
import { User } from "@/models/User";
import { Project } from "@/models/Project";
import { Client } from "@/models/Client";
import { ActivityFeed, type ActivityItem } from "@/components/activity-feed";

export const dynamic = "force-dynamic";

async function getActivities() {
  try {
    await connectDB();
    const rawActivities = await Activity.find().sort({ createdAt: -1 }).limit(200).lean();

    const userIds = [...new Set(rawActivities.map((a) => String(a.actor)))];
    const projectIds = [
      ...new Set(rawActivities.filter((a) => a.project).map((a) => String(a.project))),
    ];
    const clientIds = [
      ...new Set(rawActivities.filter((a) => a.client).map((a) => String(a.client))),
    ];

    const [users, projects, clients] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select("name role").lean(),
      Project.find({ _id: { $in: projectIds } }).select("title").lean(),
      Client.find({ _id: { $in: clientIds } }).select("name").lean(),
    ]);

    const userMap = new Map(users.map((u) => [String(u._id), { _id: String(u._id), name: u.name, role: u.role }]));
    const projectMap = new Map(projects.map((p) => [String(p._id), { _id: String(p._id), title: p.title }]));
    const clientMap = new Map(clients.map((c) => [String(c._id), { _id: String(c._id), name: c.name }]));

    const items: ActivityItem[] = rawActivities.map((a) => ({
      _id: String(a._id),
      type: a.type,
      actor: userMap.get(String(a.actor)) ?? { _id: String(a.actor), name: "Unknown", role: "client" },
      title: a.title,
      description: a.description,
      link: a.link,
      project: a.project ? projectMap.get(String(a.project)) : undefined,
      client: a.client ? clientMap.get(String(a.client)) : undefined,
      createdAt: a.createdAt.toISOString(),
    }));

    return items;
  } catch {
    return [];
  }
}

export default async function AdminActivityPage() {
  const items = await getActivities();

  return (
    <div>
      <div className="mb-12">
        <p className="eyebrow mb-3">— Studio</p>
        <h1 className="display-md text-balance">Activity</h1>
        <p className="text-bone-300 mt-2">Every signal across projects and clients in one timeline.</p>
      </div>

      <ActivityFeed
        items={items}
        showProject
        showClient
        emptyMessage="No activity recorded yet. Once you and your clients start working, every action lands here."
      />
    </div>
  );
}
