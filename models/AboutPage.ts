import mongoose, { Schema, Document, models } from "mongoose";

export interface ITimelineEntry {
  year: string;
  title: string;
  description: string;
}

export interface IAchievement {
  label: string;
  value: string;
}

export interface ITool {
  name: string;
  description?: string;
  icon?: string;
  category?: string;
}

export interface IMedia {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  alt?: string;
}

export interface IAboutPage extends Document {
  key: string;

  // Section 1 — Hero
  heroHeadline: string;
  heroSubheadline?: string;
  heroDescription?: string;
  heroImage?: string;
  heroImageAlt?: string;

  // Section 2 — Journey
  journeyTitle: string;
  journeyContent: string;
  journeyMedia: IMedia[];
  journeyTimeline: ITimelineEntry[];

  // Section 3 — Philosophy
  philosophyTitle: string;
  philosophyContent: string;

  // Section 4 — Experience
  experienceTitle: string;
  experienceContent?: string;
  achievements: IAchievement[];

  // Section 5 — Tools & Workflow
  toolsTitle: string;
  toolsDescription?: string;
  tools: ITool[];

  // Section 6 — Vision
  visionTitle: string;
  visionDescription: string;
  visionCtaLabel?: string;
  visionCtaHref?: string;

  // Toggle hard-coded fallback off
  enabled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const TimelineEntrySchema = new Schema<ITimelineEntry>(
  {
    year: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const AchievementSchema = new Schema<IAchievement>(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const ToolSchema = new Schema<ITool>(
  {
    name: { type: String, required: true },
    description: String,
    icon: String,
    category: String,
  },
  { _id: false }
);

const MediaSchema = new Schema<IMedia>(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
    thumbnail: String,
    alt: String,
  },
  { _id: false }
);

const AboutPageSchema = new Schema<IAboutPage>(
  {
    key: { type: String, default: "global", unique: true },

    heroHeadline: { type: String, default: "Designing in motion. Building with intent." },
    heroSubheadline: { type: String, default: "" },
    heroDescription: { type: String, default: "" },
    heroImage: String,
    heroImageAlt: String,

    journeyTitle: { type: String, default: "The journey" },
    journeyContent: { type: String, default: "" },
    journeyMedia: { type: [MediaSchema], default: [] },
    journeyTimeline: { type: [TimelineEntrySchema], default: [] },

    philosophyTitle: { type: String, default: "Philosophy" },
    philosophyContent: { type: String, default: "" },

    experienceTitle: { type: String, default: "Experience" },
    experienceContent: String,
    achievements: { type: [AchievementSchema], default: [] },

    toolsTitle: { type: String, default: "Tools & workflow" },
    toolsDescription: String,
    tools: { type: [ToolSchema], default: [] },

    visionTitle: { type: String, default: "What's next" },
    visionDescription: { type: String, default: "" },
    visionCtaLabel: { type: String, default: "Start a project" },
    visionCtaHref: { type: String, default: "/contact" },

    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AboutPage =
  (models.AboutPage as mongoose.Model<IAboutPage>) ||
  mongoose.model<IAboutPage>("AboutPage", AboutPageSchema);
