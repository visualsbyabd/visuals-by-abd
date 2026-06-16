import mongoose, { Schema, Document, models } from "mongoose";

export type TaskStatus =
  | "planned"
  | "in_progress"
  | "in_review"
  | "revision"
  | "approved"
  | "completed";

export type TaskPriority = "low" | "medium" | "high";

export interface ITaskComment {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  body: string;
  createdAt: Date;
}

export interface ITask extends Document {
  project: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: mongoose.Types.ObjectId;
  dueDate?: Date;
  order: number;
  createdBy: mongoose.Types.ObjectId;
  // Whether clients can see/edit. Some tasks are internal.
  visibleToClient: boolean;
  comments: ITaskComment[];
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<ITaskComment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const TaskSchema = new Schema<ITask>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    status: {
      type: String,
      enum: ["planned", "in_progress", "in_review", "revision", "approved", "completed"],
      default: "planned",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    assignee: { type: Schema.Types.ObjectId, ref: "User" },
    dueDate: Date,
    order: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    visibleToClient: { type: Boolean, default: true, index: true },
    comments: { type: [CommentSchema], default: [] },
    completedAt: Date,
  },
  { timestamps: true }
);

TaskSchema.index({ project: 1, status: 1, order: 1 });

export const Task =
  (models.Task as mongoose.Model<ITask>) || mongoose.model<ITask>("Task", TaskSchema);
