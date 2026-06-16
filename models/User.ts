import mongoose, { Schema, Document, models } from "mongoose";

export type UserRole = "admin" | "editor" | "client";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  image?: string;
  role: UserRole;
  // Set when role = "client" — links portal account back to Client record
  client?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String },
    role: { type: String, enum: ["admin", "editor", "client"], default: "admin", index: true },
    client: { type: Schema.Types.ObjectId, ref: "Client", index: true },
  },
  { timestamps: true }
);

export const User = (models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
