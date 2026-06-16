import mongoose, { Schema, Document, models } from "mongoose";

export interface IMilestone extends Document {
  project: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  dueDate?: Date;
  completedAt?: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
      index: true,
    },
    dueDate: Date,
    completedAt: Date,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Milestone =
  (models.Milestone as mongoose.Model<IMilestone>) ||
  mongoose.model<IMilestone>("Milestone", MilestoneSchema);
