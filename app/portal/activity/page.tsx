import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Activity } from "@/models/Activity";
import { User } from "@/models/User";
import { Project } from "@/models/Project";
import { ActivityFeed, type ActivityItem } from "@/components/activity-feed";

export const dynamic = "force-dynamic";

async function getClientActivity(clientId: string) {
  await connectDB();
  // Filter activities by client OR by projects belonging to the client
  const clientProjects = await Project.find({ clientRef: clientId }).select("_id title").lean();
  const projectIds = clientProjects.map((p) => p._id);
  const projectMap = new Map(clientProjects.map((p) => [String(p._id), { _id: String(p._id), title: p.title }]));

  const rawActivities = await Activity.find({
    $or: [{ client: clientId }, { project: { $in: projectIds } }],
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const userIds = [...new Set(rawActivities.map((a) => String(a.actor)))];
  const users = await User.find({ _id: { $in: userIds } }).select("name role").lean();
  const userMap = new Map(users.map((u) => [String(u._id), { _id: String(u._id), name: u.name, role: u.role }]));

  return rawActivities.map<ActivityItem>((a) => ({
    _id: String(a._id),
    type: a.type,
    actor: userMap.get(String(a.actor)) ?? { _id: String(a.actor), name: "Unknown", role: "client" },
    title: a.title,
    description: a.description,
    link: a.link?.replace("/admin/", "/portal/"),
    project: a.project ? projectMap.get(String(a.project)) : undefined,
    createdAt: a.createdAt.toISOString(),
  }));
}

export default async function PortalActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "client" || !session.user.clientId) {
    return (
      <div>
        <p className="eyebrow mb-3">— Activity</p>
        <h1 className="display-md mb-4">Account not linked.</h1>
        <p className="text-bone-300">No client record attached to your account.</p>
      </div>
    );
  }

  const items = await getClientActivity(session.user.clientId);

  return (
    <div>
      <div className="mb-12">
        <p className="eyebrow mb-3">— Recent</p>
        <h1 className="display-md text-balance">Activity</h1>
        <p className="text-bone-300 mt-2">Every update across your projects.</p>
      </div>

      <ActivityFeed
        items={items}
        showProject
        emptyMessage="Nothing's happened yet. You'll see updates here as work progresses."
      />
    </div>
  );
}
