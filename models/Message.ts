import mongoose, { Schema, Document, models } from "mongoose";

export interface IReaction {
  emoji: string;
  users: mongoose.Types.ObjectId[];
}

export interface IMessage extends Document {
  project: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  body: string;
  attachments: string[];
  readBy: mongoose.Types.ObjectId[];
  // NEW: parent message for threads — null for top-level
  parent?: mongoose.Types.ObjectId;
  // NEW: users mentioned by @-name
  mentions: mongoose.Types.ObjectId[];
  // NEW: emoji reactions grouped by emoji
  reactions: IReaction[];
  // NEW: edit support
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReactionSchema = new Schema<IReaction>(
  {
    emoji: { type: String, required: true },
    users: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    attachments: { type: [String], default: [] },
    readBy: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    parent: { type: Schema.Types.ObjectId, ref: "Message", index: true },
    mentions: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    reactions: { type: [ReactionSchema], default: [] },
    editedAt: Date,
  },
  { timestamps: true }
);

MessageSchema.index({ project: 1, parent: 1, createdAt: 1 });
MessageSchema.index({ project: 1, createdAt: -1 });

export const Message =
  (models.Message as mongoose.Model<IMessage>) || mongoose.model<IMessage>("Message", MessageSchema);
