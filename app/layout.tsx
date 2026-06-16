import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { getSiteSettings } from "@/lib/settings";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const title = s.defaultMetaTitle || `${s.siteName} — ${s.ownerName} · ${s.ownerRole}`;
  const description = s.defaultMetaDescription || s.description || s.tagline;

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: {
      default: title,
      template: `%s — ${s.siteName}`,
    },
    description,
    authors: [{ name: s.ownerName }],
    creator: s.ownerName,
    openGraph: {
      type: "website",
      locale: "en_US",
      title,
      description,
      siteName: s.siteName,
      images: s.defaultOgImage ? [s.defaultOgImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: s.defaultOgImage ? [s.defaultOgImage] : undefined,
    },
    icons: s.favicon ? { icon: s.favicon } : undefined,
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
