import mongoose, { Schema, Document, models } from "mongoose";

export interface IClient extends Document {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  avatar?: string;
  // Link to the portal user account (if invited)
  user?: mongoose.Types.ObjectId;
  status: "active" | "archived";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: String,
    avatar: String,
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
    notes: String,
  },
  { timestamps: true }
);

export const Client =
  (models.Client as mongoose.Model<IClient>) || mongoose.model<IClient>("Client", ClientSchema);
