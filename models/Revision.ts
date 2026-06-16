import mongoose, { Schema, Document, models } from "mongoose";

export type RevisionStatus =
  | "open"
  | "in_review"
  | "working"
  | "resolved"
  | "closed";

export type RevisionPriority = "low" | "medium" | "high";

export interface IRevisionAttachment {
  url: string;
  name: string;
  type: "image" | "video" | "document";
  size?: number;
}

export interface IRevisionComment {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  body: string;
  createdAt: Date;
}

export interface IRevision extends Document {
  project: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  deliverable?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  priority: RevisionPriority;
  status: RevisionStatus;
  attachments: IRevisionAttachment[];
  comments: IRevisionComment[];
  createdBy: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IRevisionAttachment>(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["image", "video", "document"], required: true },
    size: Number,
  },
  { _id: false }
);

const CommentSchema = new Schema<IRevisionComment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const RevisionSchema = new Schema<IRevision>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    client: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    deliverable: { type: Schema.Types.ObjectId, ref: "Deliverable" },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: {
      type: String,
      enum: ["open", "in_review", "working", "resolved", "closed"],
      default: "open",
      index: true,
    },
    attachments: { type: [AttachmentSchema], default: [] },
    comments: { type: [CommentSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resolvedAt: Date,
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

RevisionSchema.index({ project: 1, status: 1, createdAt: -1 });
RevisionSchema.index({ client: 1, status: 1, createdAt: -1 });

export const Revision =
  (models.Revision as mongoose.Model<IRevision>) ||
  mongoose.model<IRevision>("Revision", RevisionSchema);
