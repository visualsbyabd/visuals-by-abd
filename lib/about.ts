import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { AboutPage, type IAboutPage } from "@/models/AboutPage";

export type AboutPageContent = Omit<
  IAboutPage,
  keyof import("mongoose").Document | "createdAt" | "updatedAt"
>;

export const getAboutContent = unstable_cache(
  async (): Promise<AboutPageContent | null> => {
    try {
      await connectDB();
      const doc = await AboutPage.findOne({ key: "global" }).lean<IAboutPage>();
      if (!doc) return null;
      const { _id, __v, key, createdAt, updatedAt, ...clean } = doc as Record<string, unknown> & IAboutPage;
      return clean as unknown as AboutPageContent;
    } catch {
      return null;
    }
  },
  ["about-page"],
  { tags: ["about-page"], revalidate: 3600 }
);
