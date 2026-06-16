import mongoose, { Schema, Document, models } from "mongoose";

export interface IService extends Document {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  icon: string;
  deliverables: string[];
  startingPrice?: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    deliverables: { type: [String], default: [] },
    startingPrice: String,
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Service =
  (models.Service as mongoose.Model<IService>) || mongoose.model<IService>("Service", ServiceSchema);
