import { Navigation } from "@/components/site/navigation";
import { Footer } from "@/components/site/footer";
import { getSiteSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <>
      <Navigation siteName={settings.siteName} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
