import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { Message } from "@/models/Message";
import { User } from "@/models/User";
import { MessagesThread, type Message as ThreadMessage } from "@/components/portal/messages-thread";
import { ConversationToolbar } from "@/components/admin/conversation-toolbar";
import { ArrowLeft, Mail, Building2, FolderKanban } from "lucide-react";
import { markConversationRead } from "@/features/messages/actions";

export const dynamic = "force-dynamic";

async function getConversation(projectId: string) {
  await connectDB();
  const project = await Project.findById(projectId)
    .populate<{
      clientRef: { _id: string; name: string; company?: string; email: string; user?: string };
    }>("clientRef", "name company email user")
    .populate<{ messagesAssignedTo: { _id: string; name: string } }>("messagesAssignedTo", "name")
    .lean();
  if (!project) return null;

  const rawMessages = await Message.find({ project: projectId }).sort({ createdAt: 1 }).lean();
  const userIds = new Set<string>();
  for (const m of rawMessages) {
    userIds.add(String(m.sender));
    for (const r of m.reactions ?? []) for (const u of r.users ?? []) userIds.add(String(u));
  }
  const users = userIds.size
    ? await User.find({ _id: { $in: Array.from(userIds) } }).select("name role").lean()
    : [];
  const userMap = new Map(users.map((u) => [String(u._id), { _id: String(u._id), name: u.name, role: u.role }]));

  const messages: ThreadMessage[] = rawMessages.map((m) => ({
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
  }));

  return { project, messages };
}

export default async function ConversationPage({ params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { projectId } = await params;
  const data = await getConversation(projectId);
  if (!data) notFound();
  const { project, messages } = data;

  // Mark conversation as read on view (best effort, fire and forget)
  await markConversationRead(projectId).catch(() => {});

  return (
    <div className="space-y-6">
      <Link
        href="/admin/messages"
        className="inline-flex items-center gap-2 text-sm text-bone-300 hover:text-fire transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All conversations
      </Link>

      <header className="border border-ink-800 rounded-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-2">— Conversation</p>
            <h1 className="display-md leading-tight">{project.clientRef?.name ?? "Unknown client"}</h1>
            <div className="mt-3 flex items-center gap-4 text-sm text-bone-300 flex-wrap">
              {project.clientRef?.company && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-bone-400" />
                  {project.clientRef.company}
                </span>
              )}
              {project.clientRef?.email && (
                <a
                  href={`mailto:${project.clientRef.email}`}
                  className="inline-flex items-center gap-1.5 hover:text-fire transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-bone-400" />
                  {project.clientRef.email}
                </a>
              )}
              <Link
                href={`/admin/projects/${project._id}`}
                className="inline-flex items-center gap-1.5 hover:text-fire transition-colors"
              >
                <FolderKanban className="h-3.5 w-3.5 text-bone-400" />
                {project.title}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <ConversationToolbar
        projectId={String(project._id)}
        archived={!!project.messagesArchivedAt}
        internalNotes={project.messagesInternalNotes ?? ""}
        assignedTo={
          project.messagesAssignedTo
            ? { _id: String(project.messagesAssignedTo._id), name: project.messagesAssignedTo.name }
            : null
        }
      />

      <MessagesThread
        projectId={String(project._id)}
        messages={messages}
        currentUserId={session.user.id}
      />
    </div>
  );
}
