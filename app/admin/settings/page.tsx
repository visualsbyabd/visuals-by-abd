import { connectDB } from "@/lib/mongodb";
import { Setting } from "@/models/Setting";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

async function getSettings() {
  try {
    await connectDB();
    let settings = await Setting.findOne({ key: "global" }).lean();
    if (!settings) {
      const created = await Setting.create({ key: "global" });
      settings = created.toObject();
    }
    return JSON.parse(JSON.stringify(settings));
  } catch {
    return null;
  }
}

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <div className="mb-12">
        <p className="eyebrow mb-3">— Configure</p>
        <h1 className="display-md text-balance">Site Settings</h1>
        <p className="text-bone-300 mt-2">Global configuration, contact info, and SEO defaults.</p>
      </div>

      {settings ? (
        <SettingsForm initial={settings} />
      ) : (
        <div className="border border-fire/40 bg-fire/5 p-6 rounded-sm">
          <p className="text-fire">Could not load settings. Check your database connection.</p>
        </div>
      )}
    </div>
  );
}
