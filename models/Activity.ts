import mongoose, { Schema, Document, models } from "mongoose";

export type ActivityType =
  | "project_created"
  | "project_updated"
  | "project_progress"
  | "milestone_completed"
  | "deliverable_uploaded"
  | "deliverable_approved"
  | "deliverable_changes_requested"
  | "message_posted"
  | "task_created"
  | "task_status_changed"
  | "task_completed"
  | "task_comment"
  | "invoice_sent"
  | "invoice_paid"
  | "file_uploaded";

export interface IActivity extends Document {
  type: ActivityType;
  actor: mongoose.Types.ObjectId; // user who did the thing
  project?: mongoose.Types.ObjectId;
  client?: mongoose.Types.ObjectId;
  invoice?: mongoose.Types.ObjectId;
  task?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: { type: String, required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    client: { type: Schema.Types.ObjectId, ref: "Client", index: true },
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice" },
    task: { type: Schema.Types.ObjectId, ref: "Task" },
    title: { type: String, required: true },
    description: String,
    link: String,
  },
  { timestamps: true }
);

ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ project: 1, createdAt: -1 });
ActivitySchema.index({ client: 1, createdAt: -1 });

export const Activity =
  (models.Activity as mongoose.Model<IActivity>) ||
  mongoose.model<IActivity>("Activity", ActivitySchema);
