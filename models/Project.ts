import mongoose, { Schema, Document, models } from "mongoose";

export type ProjectCategory =
  | "brand-identity"
  | "video-editing"
  | "motion-design"
  | "graphic-design"
  | "web-design"
  | "creative-direction";

export interface IProject extends Document {
  title: string;
  slug: string;
  description: string;
  category: ProjectCategory;
  type: "client" | "personal";
  coverImage: string;
  gallery: string[];
  // Legacy free-text client name (kept for public case studies)
  client?: string;
  // NEW: link to a Client record for portal-managed projects
  clientRef?: mongoose.Types.ObjectId;
  // NEW: portal-visible progress (0–100)
  progress: number;
  // NEW: whether the project is exposed in the client portal
  portalVisible: boolean;
  // NEW: gallery as structured media (images + videos). Migrated from gallery: string[].
  media: {
    type: "image" | "video";
    url: string;
    thumbnail?: string;
    alt?: string;
    title?: string;
    description?: string;
    tags: string[];
    featured: boolean;
    duration?: number; // seconds, for videos
    orientation?: "horizontal" | "vertical"; // videos only
    order: number;
    uploadedAt: Date;
  }[];
  // NEW: layout mode for the public case study gallery
  mediaLayout: "mixed" | "videos-grid";
  // NEW: conversation-level state (Messages Center)
  messagesArchivedAt?: Date;
  messagesInternalNotes?: string;
  messagesAssignedTo?: mongoose.Types.ObjectId;
  challenge?: string;
  strategy?: string;
  process?: string;
  deliverables: string[];
  outcome?: string;
  tags: string[];
  featured: boolean;
  status: "draft" | "published" | "archived";
  year?: number;
  metaTitle?: string;
  metaDescription?: string;
  order: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["brand-identity", "video-editing", "motion-design", "graphic-design", "web-design", "creative-direction"],
      index: true,
    },
    type: { type: String, enum: ["client", "personal"], default: "client" },
    coverImage: { type: String, required: true },
    gallery: { type: [String], default: [] },
    media: {
      type: [
        {
          _id: false,
          type: { type: String, enum: ["image", "video"], required: true },
          url: { type: String, required: true },
          thumbnail: String,
          alt: String,
          title: String,
          description: String,
          tags: { type: [String], default: [] },
          featured: { type: Boolean, default: false },
          duration: Number,
          orientation: { type: String, enum: ["horizontal", "vertical"] },
          order: { type: Number, default: 0 },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    mediaLayout: {
      type: String,
      enum: ["mixed", "videos-grid"],
      default: "mixed",
    },
    client: String,
    clientRef: { type: Schema.Types.ObjectId, ref: "Client", index: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    portalVisible: { type: Boolean, default: false, index: true },
    messagesArchivedAt: Date,
    messagesInternalNotes: String,
    messagesAssignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    challenge: String,
    strategy: String,
    process: String,
    deliverables: { type: [String], default: [] },
    outcome: String,
    tags: { type: [String], default: [], index: true },
    featured: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    year: Number,
    metaTitle: String,
    metaDescription: String,
    order: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProjectSchema.index({ status: 1, featured: 1, order: 1 });
ProjectSchema.index({ clientRef: 1, portalVisible: 1 });
ProjectSchema.index({ title: "text", description: "text", tags: "text" });

export const Project =
  (models.Project as mongoose.Model<IProject>) || mongoose.model<IProject>("Project", ProjectSchema);
