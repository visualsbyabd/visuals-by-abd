import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { Service } from "@/models/Service";
import { ServicesList } from "@/components/admin/services-list";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

async function getServices() {
  await connectDB();
  const services = await Service.find().sort({ order: 1, createdAt: 1 }).lean();
  return services.map((s) => ({
    _id: String(s._id),
    title: s.title,
    slug: s.slug,
    tagline: s.tagline,
    icon: s.icon,
    deliverablesCount: s.deliverables.length,
    startingPrice: s.startingPrice,
    active: s.active,
    order: s.order,
  }));
}

export default async function AdminServicesPage() {
  const services = await getServices();

  return (
    <div>
      <div className="mb-10 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="eyebrow mb-3">— Manage</p>
          <h1 className="display-md text-balance">Services</h1>
          <p className="text-bone-300 mt-2">
            The services that appear on the public <Link href="/services" className="text-fire hover:underline">/services</Link> page and the homepage services preview.
          </p>
        </div>
        <Link
          href="/admin/services/new"
          className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow text-bone px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-[0_0_40px_-10px_rgba(214,40,40,0.6)]"
        >
          <Plus className="h-4 w-4" />
          New service
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="border border-ink-800 rounded-sm p-16 text-center">
          <p className="text-bone-300 mb-1">No services yet.</p>
          <p className="text-xs text-bone-400 mb-6">
            Create the first one — or run <code className="text-fire">npm run seed</code> to populate the default six.
          </p>
          <Link
            href="/admin/services/new"
            className="inline-flex items-center gap-2 bg-fire hover:bg-fire-glow text-bone px-5 py-2.5 rounded-full text-sm font-medium transition-all"
          >
            <Plus className="h-4 w-4" />
            Create your first service
          </Link>
        </div>
      ) : (
        <ServicesList services={services} />
      )}
    </div>
  );
}
