import mongoose, { Schema, Document, models } from "mongoose";

export type NotificationType =
  | "project_update"
  | "deliverable_uploaded"
  | "deliverable_approved"
  | "deliverable_changes_requested"
  | "message_new"
  | "invoice_sent"
  | "invoice_paid"
  | "milestone_completed";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  // Optional context references
  project?: mongoose.Types.ObjectId;
  invoice?: mongoose.Types.ObjectId;
  deliverable?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "project_update",
        "deliverable_uploaded",
        "deliverable_approved",
        "deliverable_changes_requested",
        "message_new",
        "invoice_sent",
        "invoice_paid",
        "milestone_completed",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: String,
    link: String,
    read: { type: Boolean, default: false, index: true },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice" },
    deliverable: { type: Schema.Types.ObjectId, ref: "Deliverable" },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification =
  (models.Notification as mongoose.Model<INotification>) ||
  mongoose.model<INotification>("Notification", NotificationSchema);
