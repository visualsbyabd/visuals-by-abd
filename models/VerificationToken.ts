import mongoose, { Schema, Document, models } from "mongoose";

export type TokenKind = "password_reset" | "magic_link";

export interface IVerificationToken extends Document {
  email: string;
  tokenHash: string;
  kind: TokenKind;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationTokenSchema = new Schema<IVerificationToken>(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ["password_reset", "magic_link"], required: true },
    expiresAt: { type: Date, required: true },
    usedAt: Date,
  },
  { timestamps: true }
);

// Auto-expire docs at expiresAt (Mongo TTL)
VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationToken =
  (models.VerificationToken as mongoose.Model<IVerificationToken>) ||
  mongoose.model<IVerificationToken>("VerificationToken", VerificationTokenSchema);
