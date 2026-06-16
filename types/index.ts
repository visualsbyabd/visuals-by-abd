// Shared type exports — re-exports from models for use across components

export type {
  IProject as ProjectDoc,
  ProjectCategory,
} from "@/models/Project";
export type { IUser as UserDoc } from "@/models/User";
export type { IMedia as MediaDoc } from "@/models/Media";
export type { ITestimonial as TestimonialDoc } from "@/models/Testimonial";
export type { ISetting as SettingDoc } from "@/models/Setting";
export type { ICategory as CategoryDoc } from "@/models/Category";
export type { IService as ServiceDoc } from "@/models/Service";

export type ActionResult<T = void> =
  | (T extends void ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string };
