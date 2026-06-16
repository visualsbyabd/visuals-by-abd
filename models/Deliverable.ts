import mongoose, { Schema, Document, models } from "mongoose";

export interface IDeliverable extends Document {
  project: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  type: "image" | "video" | "document" | "link";
  status: "draft" | "in_review" | "approved" | "changes_requested";
  // Most recent client feedback when changes are requested
  feedback?: string;
  version: number;
  uploadedBy: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  // Optional due date — when set, appears on the client portal calendar.
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverableSchema = new Schema<IDeliverable>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    url: { type: String, required: true },
    thumbnailUrl: String,
    type: { type: String, enum: ["image", "video", "document", "link"], required: true },
    status: {
      type: String,
      enum: ["draft", "in_review", "approved", "changes_requested"],
      default: "draft",
      index: true,
    },
    feedback: String,
    version: { type: Number, default: 1 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviewedAt: Date,
    dueDate: { type: Date, index: true },
  },
  { timestamps: true }
);

export const Deliverable =
  (models.Deliverable as mongoose.Model<IDeliverable>) ||
  mongoose.model<IDeliverable>("Deliverable", DeliverableSchema);
