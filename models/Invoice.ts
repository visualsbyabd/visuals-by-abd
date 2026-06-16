import mongoose, { Schema, Document, models } from "mongoose";

export interface ILineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface IInvoice extends Document {
  number: string; // e.g. "INV-2026-001"
  client: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  items: ILineItem[];
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issueDate: Date;
  dueDate?: Date;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema<ILineItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    number: { type: String, required: true, unique: true, index: true },
    client: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", index: true },
    items: { type: [LineItemSchema], default: [] },
    currency: { type: String, default: "USD" },
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled"],
      default: "draft",
      index: true,
    },
    issueDate: { type: Date, default: Date.now },
    dueDate: Date,
    paidDate: Date,
    notes: String,
  },
  { timestamps: true }
);

export const Invoice =
  (models.Invoice as mongoose.Model<IInvoice>) || mongoose.model<IInvoice>("Invoice", InvoiceSchema);
