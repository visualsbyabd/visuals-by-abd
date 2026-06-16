import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Media } from "@/models/Media";
import { Project } from "@/models/Project";
import Image from "next/image";
import { Film, FileText, Download, FolderKanban, Search } from "lucide-react";
import { PortalFilesGrid } from "@/components/portal/files-grid";

export const dynamic = "force-dynamic";

async function getFiles(clientId: string) {
  await connectDB();
  const projects = await Project.find({ clientRef: clientId }).select("_id title").lean();
  const projectIds = projects.map((p) => p._id);
  const projectMap = new Map(projects.map((p) => [String(p._id), p.title]));

  // Client sees any file marked visibleToClient on their projects
  const rawFiles = await Media.find({
    visibleToClient: true,
    $or: [{ client: clientId }, { project: { $in: projectIds } }],
  })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  return rawFiles.map((f) => ({
    _id: String(f._id),
    originalName: f.originalName,
    url: f.url,
    type: f.type,
    size: f.size,
    projectName: f.project ? projectMap.get(String(f.project)) : undefined,
    tags: f.tags ?? [],
    createdAt: f.createdAt.toISOString(),
  }));
}

export default async function PortalFilesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "client" || !session.user.clientId) {
    return (
      <div>
        <p className="eyebrow mb-3">— Files</p>
        <h1 className="display-md mb-4">Account not linked.</h1>
      </div>
    );
  }

  const files = await getFiles(session.user.clientId);
  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <div>
      <div className="mb-12">
        <p className="eyebrow mb-3">— Workspace</p>
        <h1 className="display-md text-balance">Files</h1>
        <p className="text-bone-300 mt-2">
          {files.length} files · {(totalSize / (1024 * 1024)).toFixed(1)} MB
        </p>
      </div>

      <PortalFilesGrid files={files} />
    </div>
  );
}
