import { connectDB } from "@/lib/mongodb";
import { HomePage } from "@/models/HomePage";
import { HomeBuilder } from "@/components/admin/home-builder";

export const dynamic = "force-dynamic";

async function getDoc() {
  await connectDB();
  const doc = await HomePage.findOneAndUpdate(
    { key: "global" },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc));
}

export default async function AdminHomePage() {
  const doc = await getDoc();

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <p className="eyebrow mb-3">— Public site</p>
        <h1 className="display-md text-balance">Homepage</h1>
        <p className="text-bone-300 mt-2">Every section's copy editable. Changes go live immediately.</p>
      </div>
      <HomeBuilder initial={doc} />
    </div>
  );
}
