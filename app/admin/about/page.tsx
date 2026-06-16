import { connectDB } from "@/lib/mongodb";
import { AboutPage } from "@/models/AboutPage";
import { AboutBuilder } from "@/components/admin/about-builder";

export const dynamic = "force-dynamic";

async function getDoc() {
  await connectDB();
  const doc = await AboutPage.findOneAndUpdate(
    { key: "global" },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  if (!doc) return null;
  // Serialize for client component
  return JSON.parse(JSON.stringify(doc));
}

export default async function AdminAboutPage() {
  const doc = await getDoc();

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <p className="eyebrow mb-3">— Public site</p>
        <h1 className="display-md text-balance">About page</h1>
        <p className="text-bone-300 mt-2">Every section editable. Changes hit the public site immediately.</p>
      </div>
      <AboutBuilder initial={doc} />
    </div>
  );
}
