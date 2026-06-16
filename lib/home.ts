import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { HomePage, type IHomePage } from "@/models/HomePage";

export type HomePageContent = Omit<
  IHomePage,
  keyof import("mongoose").Document | "createdAt" | "updatedAt"
>;

export const getHomeContent = unstable_cache(
  async (): Promise<HomePageContent | null> => {
    try {
      await connectDB();
      const doc = await HomePage.findOne({ key: "global" }).lean<IHomePage>();
      if (!doc) return null;
      const { _id, __v, key, createdAt, updatedAt, ...clean } = doc as Record<string, unknown> & IHomePage;
      return clean as unknown as HomePageContent;
    } catch {
      return null;
    }
  },
  ["home-page"],
  { tags: ["home-page"], revalidate: 3600 }
);
