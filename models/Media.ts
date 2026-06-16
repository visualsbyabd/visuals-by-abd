import mongoose, { Schema, Document, models } from "mongoose";

export interface IMedia extends Document {
  filename: string;
  originalName: string;
  url: string;
  type: "image" | "video" | "document";
  mimeType: string;
  size: number;
  folder: string;
  width?: number;
  height?: number;
  alt?: string;
  uploadedBy?: mongoose.Types.ObjectId;
  // NEW: link to project + client + tags for the Files Center
  project?: mongoose.Types.ObjectId;
  client?: mongoose.Types.ObjectId;
  tags: string[];
  visibleToClient: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    type: { type: String, enum: ["image", "video", "document"], required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    folder: { type: String, required: true, index: true },
    width: Number,
    height: Number,
    alt: String,
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    project: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    client: { type: Schema.Types.ObjectId, ref: "Client", index: true },
    tags: { type: [String], default: [], index: true },
    visibleToClient: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

MediaSchema.index({ originalName: "text", tags: "text" });
MediaSchema.index({ client: 1, visibleToClient: 1, createdAt: -1 });

export const Media =
  (models.Media as mongoose.Model<IMedia>) || mongoose.model<IMedia>("Media", MediaSchema);
