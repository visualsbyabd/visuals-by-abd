import { connectDB } from "@/lib/mongodb";
import { Project } from "@/models/Project";
import { Client } from "@/models/Client";
import { sendEmail } from "@/lib/email";

/**
 * Look up a project's linked client + their email. Returns null if either is missing.
 * This is the gate that makes "send only if project is linked to a client" work
 * across every email trigger in the codebase.
 */
export async function getProjectClientForEmail(
  projectId: string
): Promise<{ name: string; email: string; projectTitle: string } | null> {
  try {
    await connectDB();
    const project = await Project.findById(projectId).select("title clientRef").lean();
    if (!project?.clientRef) return null;
    const client = await Client.findById(project.clientRef).select("name email").lean();
    if (!client?.email) return null;
    return {
      name: client.name,
      email: client.email,
      projectTitle: project.title,
    };
  } catch {
    return null;
  }
}

/**
 * Build the absolute URL to use in transactional emails.
 * Honors NEXT_PUBLIC_SITE_URL when set; otherwise falls back to localhost.
 */
export function absoluteUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

/**
 * Wrapper that swallows errors and logs them — emails are best-effort.
 * They should never break the request flow.
 */
export async function sendClientEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<void> {
  try {
    const res = await sendEmail({ to, subject, html, text });
    if (!res.ok) console.error("[notify-client]", res.error);
  } catch (e) {
    console.error("[notify-client]", e);
  }
}
