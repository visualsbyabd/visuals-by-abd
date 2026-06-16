import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { Client } from "@/models/Client";
import mongoose from "mongoose";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function requireStaff() {
  const session = await requireSession();
  if (session.user.role !== "admin" && session.user.role !== "editor") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function requireClient() {
  const session = await requireSession();
  if (session.user.role !== "client") {
    throw new Error("Client access only");
  }
  return session;
}

/**
 * Verify the current client user has access to a given project.
 * Used by portal endpoints to gate per-project data.
 */
export async function clientCanAccessProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  await connectDB();
  const user = await User.findById(userId).select("client role").lean();
  if (!user) return false;
  if (user.role === "admin" || user.role === "editor") return true;
  if (!user.client) return false;

  // Avoid importing Project at top-level to prevent circular refs
  const { Project } = await import("@/models/Project");
  const project = await Project.findById(projectId).select("clientRef").lean();
  if (!project?.clientRef) return false;
  return String(project.clientRef) === String(user.client);
}

type NotificationInput = {
  user: string | mongoose.Types.ObjectId;
  type: import("@/models/Notification").NotificationType;
  title: string;
  body?: string;
  link?: string;
  project?: string | mongoose.Types.ObjectId;
  invoice?: string | mongoose.Types.ObjectId;
  deliverable?: string | mongoose.Types.ObjectId;
};

export async function notify(input: NotificationInput): Promise<void> {
  await connectDB();
  await Notification.create(input);
}

/**
 * Notify every admin / editor (staff). Use when a client takes action.
 */
export async function notifyStaff(
  input: Omit<NotificationInput, "user">
): Promise<void> {
  await connectDB();
  const staff = await User.find({ role: { $in: ["admin", "editor"] } }).select("_id").lean();
  if (!staff.length) return;
  await Notification.insertMany(
    staff.map((u) => ({ ...input, user: u._id }))
  );
}

/**
 * Notify the client user attached to a project (if any).
 */
export async function notifyClientForProject(
  projectId: string,
  input: Omit<NotificationInput, "user">
): Promise<void> {
  await connectDB();
  const { Project } = await import("@/models/Project");
  const project = await Project.findById(projectId).select("clientRef").lean();
  if (!project?.clientRef) return;
  const client = await Client.findById(project.clientRef).select("user").lean();
  if (!client?.user) return;
  await Notification.create({ ...input, user: client.user });
}
