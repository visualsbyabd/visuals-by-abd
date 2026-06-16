import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Setting, type ISetting } from "@/models/Setting";

export type SiteSettings = {
  // Identity
  siteName: string;
  tagline: string;
  description: string;
  logo?: string;
  favicon?: string;
  // Contact
  email: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
  // Socials
  instagram?: string;
  behance?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  calendly?: string;
  // SEO
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultOgImage?: string;
  // Owner
  ownerName: string;
  ownerRole: string;
  ownerBio?: string;
  ownerImage?: string;
};

const FALLBACK: SiteSettings = {
  siteName: "Visuals by Abd",
  tagline: "Visual Stories That Move People",
  description: "Abdullah Tharwat — Creative Director crafting brands, identities, motion, and digital experiences.",
  email: "hello@visualsbyabd.com",
  location: "Cairo, Egypt",
  defaultMetaTitle: "Visuals by Abd — Abdullah Tharwat · Creative Director",
  defaultMetaDescription:
    "Visual stories that move people. Brand identity, motion design, video editing, web design, and creative direction.",
  ownerName: "Abdullah Tharwat",
  ownerRole: "Creative Director",
};

/**
 * Single source of truth for site-wide content.
 *
 * Tagged with the "settings" cache tag so that updateSettings() can invalidate
 * every consumer with one call to revalidateTag("settings").
 *
 * Falls back to sensible defaults if the database isn't reachable or the
 * settings document hasn't been seeded yet — the site never breaks on a
 * missing Setting record.
 */
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      await connectDB();
      const settings = await Setting.findOne({ key: "global" }).lean<ISetting>();
      if (!settings) return FALLBACK;
      // Strip Mongo internals + key field for the public shape
      const { _id, __v, key, createdAt, updatedAt, ...clean } = settings as Record<string, unknown> & ISetting;
      return { ...FALLBACK, ...(clean as Partial<SiteSettings>) };
    } catch {
      return FALLBACK;
    }
  },
  ["site-settings"],
  { tags: ["settings"], revalidate: 3600 }
);
