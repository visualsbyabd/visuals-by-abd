import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Message } from "@/models/Message";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
import { MessagesInbox } from "@/components/admin/messages-inbox";

export const dynamic = "force-dynamic";

export type ConversationCard = {
  projectId: string;
  projectTitle: string;
  clientName?: string;
  clientCompany?: string;
  lastMessage: string;
  lastSender: string;
  lastSenderRole: string;
  lastAt: string;
  unread: boolean;
  unreadCount: number;
  total: number;
  archived: boolean;
  assignedTo?: { _id: string; name: string };
};

async function getConversations(userId: string): Promise<ConversationCard[]> {
  await connectDB();

  // Fetch all messages, group by project in JS. For thousands of conversations
  // this would want a real aggregation; for a small studio this is plenty fast.
  const all = await Message.find()
    .sort({ createdAt: -1 })
    .select("project body sender readBy createdAt")
    .lean();

  if (all.length === 0) return [];

  type Group = { last: typeof all[0]; total: number; unread: number };
  const groups = new Map<string, Group>();
  for (const m of all) {
    const k = String(m.project);
    const existing = groups.get(k);
    if (existing) {
      existing.total++;
      if (!m.readBy.some((u) => String(u) === userId)) existing.unread++;
    } else {
      groups.set(k, {
        last: m,
        total: 1,
        unread: m.readBy.some((u) => String(u) === userId) ? 0 : 1,
      });
    }
  }

  const projectIds = Array.from(groups.keys());
  const senderIds = Array.from(groups.values()).map((g) => g.last.sender);

  const [projects, users] = await Promise.all([
    Project.find({ _id: { $in: projectIds } })
      .populate<{ clientRef: { name: string; company?: string } }>("clientRef", "name company")
      .populate<{ messagesAssignedTo: { _id: string; name: string } }>("messagesAssignedTo", "name")
      .lean(),
    User.find({ _id: { $in: senderIds } }).select("name role").lean(),
  ]);

  const projectMap = new Map(projects.map((p) => [String(p._id), p]));
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const cards: ConversationCard[] = [];
  for (const [projectId, group] of groups.entries()) {
    const project = projectMap.get(projectId);
    if (!project) continue;
    const sender = userMap.get(String(group.last.sender));
    cards.push({
      projectId,
      projectTitle: project.title,
      clientName: project.clientRef?.name,
      clientCompany: project.clientRef?.company,
      lastMessage: group.last.body,
      lastSender: sender?.name ?? "Unknown",
      lastSenderRole: sender?.role ?? "client",
      lastAt: group.last.createdAt.toISOString(),
      unread: group.unread > 0,
      unreadCount: group.unread,
      total: group.total,
      archived: !!project.messagesArchivedAt,
      assignedTo: project.messagesAssignedTo
        ? { _id: String(project.messagesAssignedTo._id), name: project.messagesAssignedTo.name }
        : undefined,
    });
  }
  return cards.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
}

export default async function AdminMessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const conversations = await getConversations(session.user.id);
  return <MessagesInbox conversations={conversations} />;
}
