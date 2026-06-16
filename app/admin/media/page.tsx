import { connectDB } from "@/lib/mongodb";
import { Media } from "@/models/Media";
import { MediaGrid } from "@/components/admin/media-grid";
import { formatBytes } from "@/lib/utils";
import { HardDrive, Image as ImageIcon, Film, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

async function getMedia() {
  try {
    await connectDB();
    const [items, totalSize, byType] = await Promise.all([
      Media.find().sort({ createdAt: -1 }).lean(),
      Media.aggregate([{ $group: { _id: null, total: { $sum: "$size" } } }]),
      Media.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
    ]);

    const counts: Record<string, number> = {};
    byType.forEach((b) => (counts[b._id] = b.count));

    return {
      items: items.map((m) => ({
        _id: String(m._id),
        filename: m.filename,
        originalName: m.originalName,
        url: m.url,
        type: m.type,
        size: m.size,
        folder: m.folder,
        width: m.width,
        height: m.height,
        createdAt: m.createdAt.toISOString(),
      })),
      totalSize: totalSize[0]?.total ?? 0,
      counts,
    };
  } catch {
    return { items: [], totalSize: 0, counts: {} };
  }
}

export default async function AdminMediaPage() {
  const { items, totalSize, counts } = await getMedia();

  return (
    <div>
      <div className="mb-12">
        <p className="eyebrow mb-3">— Manage</p>
        <h1 className="display-md text-balance">Media Library</h1>
        <p className="text-bone-300 mt-2">{items.length} files · {formatBytes(totalSize)} used</p>
      </div>

      {/* Storage stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Storage" value={formatBytes(totalSize)} icon={HardDrive} accent />
        <StatCard label="Images" value={(counts.image ?? 0).toString()} icon={ImageIcon} />
        <StatCard label="Videos" value={(counts.video ?? 0).toString()} icon={Film} />
        <StatCard label="Documents" value={(counts.document ?? 0).toString()} icon={FileText} />
      </div>

      <MediaGrid items={items} />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent?: boolean;
}) {
  return (
    <div className={`border rounded-sm p-6 ${accent ? "border-fire/40 bg-fire/5" : "border-ink-800"}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase tracking-[0.2em] text-bone-300">{label}</span>
        <Icon className="h-4 w-4 text-fire" strokeWidth={1.5} />
      </div>
      <p className="font-display text-3xl font-medium tracking-tight">{value}</p>
    </div>
  );
}
