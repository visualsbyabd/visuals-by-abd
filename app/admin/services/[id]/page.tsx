import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Service } from "@/models/Service";
import { ServiceForm } from "@/components/admin/service-form";

export const dynamic = "force-dynamic";

async function getService(id: string) {
  try {
    await connectDB();
    const s = await Service.findById(id).lean();
    if (!s) return null;
    return {
      _id: String(s._id),
      title: s.title,
      slug: s.slug,
      tagline: s.tagline,
      description: s.description,
      icon: s.icon,
      deliverables: s.deliverables,
      startingPrice: s.startingPrice ?? "",
      active: s.active,
    };
  } catch {
    return null;
  }
}

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await getService(id);
  if (!service) notFound();
  return <ServiceForm initial={service} />;
}
