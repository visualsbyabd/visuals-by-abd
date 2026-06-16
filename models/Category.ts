import mongoose, { Schema, Document, models } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: String,
    icon: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Category =
  (models.Category as mongoose.Model<ICategory>) || mongoose.model<ICategory>("Category", CategorySchema);
