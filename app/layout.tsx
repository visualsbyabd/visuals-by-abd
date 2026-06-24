import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import { getSiteSettings } from "@/lib/settings";
import { auth } from "@/lib/auth";
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Seed the SessionProvider with the real session up-front when available.
  // Wrapped in try/catch because if auth() throws (missing AUTH_SECRET,
  // network blip to the auth backend, Auth.js beta regression, etc.), the
  // whole site should NOT go down — we just fall back to a null session
  // and let useSession() do its client-side fetch normally. The defensive
  // destructure in AuthNavButton handles the loading state.
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[root layout] auth() threw:", e);
    }
  }

  return (
    <html lang="en" className={`${display.variable} ${body.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
