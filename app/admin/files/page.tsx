import { connectDB } from "@/lib/mongodb";
import { Media } from "@/models/Media";
import { Project } from "@/models/Project";
import { Client } from "@/models/Client";
import { FilesCenter } from "@/components/admin/files-center";

export const dynamic = "force-dynamic";

async function getData() {
  await connectDB();
  const [rawFiles, projects, clients] = await Promise.all([
    Media.find().sort({ createdAt: -1 }).limit(500).lean(),
    Project.find().sort({ title: 1 }).select("title clientRef").lean(),
    Client.find({ status: "active" }).sort({ name: 1 }).select("name company").lean(),
  ]);

  const projectMap = new Map(projects.map((p) => [String(p._id), p.title]));
  const clientMap = new Map(clients.map((c) => [String(c._id), c.name]));

  const files = rawFiles.map((f) => ({
    _id: String(f._id),
    filename: f.filename,
    originalName: f.originalName,
    url: f.url,
    type: f.type,
    mimeType: f.mimeType,
    size: f.size,
    folder: f.folder,
    project: f.project ? String(f.project) : undefined,
    projectName: f.project ? projectMap.get(String(f.project)) : undefined,
    client: f.client ? String(f.client) : undefined,
    clientName: f.client ? clientMap.get(String(f.client)) : undefined,
    tags: f.tags ?? [],
    visibleToClient: f.visibleToClient ?? false,
    width: f.width,
    height: f.height,
    createdAt: f.createdAt.toISOString(),
  }));

  return {
    files,
    projects: projects.map((p) => ({
      _id: String(p._id),
      title: p.title,
    })),
  };
}

export default async function AdminFilesPage() {
  const { files, projects } = await getData();
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  return (
    <div>
      <div className="mb-12">
        <p className="eyebrow mb-3">— Library</p>
        <h1 className="display-md text-balance">Files</h1>
        <p className="text-bone-300 mt-2">
          {files.length} files · {(totalSize / (1024 * 1024)).toFixed(1)} MB used
        </p>
      </div>
      <FilesCenter files={files} projects={projects} />
    </div>
  );
}
