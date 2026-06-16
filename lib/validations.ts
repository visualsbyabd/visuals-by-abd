import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(2, "Title is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum([
    "brand-identity",
    "video-editing",
    "motion-design",
    "graphic-design",
    "web-design",
    "creative-direction",
  ]),
  type: z.enum(["client", "personal"]).default("client"),
  coverImage: z.string().min(1, "Cover image is required"),
  gallery: z.array(z.string()).default([]),
  client: z.string().optional(),
  clientRef: z.string().optional(),
  progress: z.number().int().min(0).max(100).default(0),
  portalVisible: z.boolean().default(false),
  challenge: z.string().optional(),
  strategy: z.string().optional(),
  process: z.string().optional(),
  deliverables: z.array(z.string()).default([]),
  outcome: z.string().optional(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  year: z.number().int().min(2000).max(2100).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  budget: z.string().optional(),
  message: z.string().min(10),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const testimonialSchema = z.object({
  name: z.string().min(2),
  role: z.string().min(2),
  company: z.string().optional(),
  quote: z.string().min(10),
  avatar: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
  featured: z.boolean().default(false),
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

// ─────────── Client Portal schemas ───────────

export const clientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  company: z.string().optional(),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  status: z.enum(["active", "archived"]).default("active"),
  notes: z.string().optional(),
  // For portal invitations
  createPortalAccount: z.boolean().optional(),
  portalPassword: z.string().min(8).optional(),
});
export type ClientInput = z.infer<typeof clientSchema>;

export const deliverableSchema = z.object({
  project: z.string().min(1, "Project is required"),
  title: z.string().min(2),
  description: z.string().optional(),
  url: z.string().min(1, "File is required"),
  thumbnailUrl: z.string().optional(),
  type: z.enum(["image", "video", "document", "link"]),
  status: z.enum(["draft", "in_review", "approved", "changes_requested"]).default("draft"),
  // Optional due date — surfaces on the client portal calendar.
  dueDate: z.string().or(z.date()).optional(),
});
export type DeliverableInput = z.infer<typeof deliverableSchema>;

export const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(0).default(1),
  unitPrice: z.number().min(0).default(0),
});

export const invoiceSchema = z.object({
  number: z.string().min(1),
  client: z.string().min(1),
  project: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "At least one line item"),
  currency: z.string().default("USD"),
  taxRate: z.number().min(0).max(100).default(0),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  issueDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const messageSchema = z.object({
  project: z.string().min(1),
  body: z.string().min(1, "Message can't be empty"),
  attachments: z.array(z.string()).default([]),
});
export type MessageInput = z.infer<typeof messageSchema>;

export const milestoneSchema = z.object({
  project: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  dueDate: z.string().or(z.date()).optional(),
  order: z.number().int().default(0),
});
export type MilestoneInput = z.infer<typeof milestoneSchema>;

// ─────────── Tasks ───────────

export const taskStatusEnum = z.enum([
  "planned",
  "in_progress",
  "in_review",
  "revision",
  "approved",
  "completed",
]);

export const taskSchema = z.object({
  project: z.string().min(1),
  title: z.string().min(2, "Title required"),
  description: z.string().optional(),
  status: taskStatusEnum.default("planned"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assignee: z.string().optional(),
  dueDate: z.string().or(z.date()).optional(),
  visibleToClient: z.boolean().default(true),
});
export type TaskInput = z.infer<typeof taskSchema>;

export const taskCommentSchema = z.object({
  taskId: z.string().min(1),
  body: z.string().min(1, "Comment can't be empty"),
});
export type TaskCommentInput = z.infer<typeof taskCommentSchema>;
