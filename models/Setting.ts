import mongoose, { Schema, Document, models } from "mongoose";

export interface ISetting extends Document {
  key: string;
  // Site identity
  siteName: string;
  tagline: string;
  description: string;
  logo?: string;
  favicon?: string;
  // Contact
  email: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
  // Socials
  instagram?: string;
  behance?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  calendly?: string;
  // SEO defaults
  defaultMetaTitle: string;
  defaultMetaDescription: string;
  defaultOgImage?: string;
  // Owner
  ownerName: string;
  ownerRole: string;
  ownerBio?: string;
  ownerImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, default: "global", unique: true },
    siteName: { type: String, default: "Visuals by Abd" },
    tagline: { type: String, default: "Visual Stories That Move People" },
    description: { type: String, default: "" },
    logo: String,
    favicon: String,
    email: { type: String, default: "" },
    phone: String,
    whatsapp: String,
    location: String,
    instagram: String,
    behance: String,
    linkedin: String,
    twitter: String,
    youtube: String,
    calendly: String,
    defaultMetaTitle: { type: String, default: "Visuals by Abd — Abdullah Tharwat" },
    defaultMetaDescription: { type: String, default: "" },
    defaultOgImage: String,
    ownerName: { type: String, default: "Abdullah Tharwat" },
    ownerRole: { type: String, default: "Creative Director" },
    ownerBio: String,
    ownerImage: String,
  },
  { timestamps: true }
);

export const Setting =
  (models.Setting as mongoose.Model<ISetting>) || mongoose.model<ISetting>("Setting", SettingSchema);
