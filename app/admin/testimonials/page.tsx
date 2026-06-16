import { connectDB } from "@/lib/mongodb";
import { Testimonial } from "@/models/Testimonial";
import { TestimonialsManager } from "@/components/admin/testimonials-manager";

export const dynamic = "force-dynamic";

async function getTestimonials() {
  try {
    await connectDB();
    const items = await Testimonial.find().sort({ order: 1, createdAt: -1 }).lean();
    return items.map((t) => ({
      _id: String(t._id),
      name: t.name,
      role: t.role,
      company: t.company ?? "",
      quote: t.quote,
      avatar: t.avatar ?? "",
      rating: t.rating,
      featured: t.featured,
    }));
  } catch {
    return [];
  }
}

export default async function AdminTestimonialsPage() {
  const items = await getTestimonials();
  return (
    <div>
      <div className="mb-12">
        <p className="eyebrow mb-3">— Manage</p>
        <h1 className="display-md text-balance">Testimonials</h1>
        <p className="text-bone-300 mt-2">{items.length} total</p>
      </div>
      <TestimonialsManager items={items} />
    </div>
  );
}
