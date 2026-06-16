import { connectDB } from "@/lib/mongodb";
import { Activity, type ActivityType } from "@/models/Activity";
import mongoose from "mongoose";

type LogInput = {
  type: ActivityType;
  actor: string | mongoose.Types.ObjectId;
  project?: string | mongoose.Types.ObjectId;
  client?: string | mongoose.Types.ObjectId;
  invoice?: string | mongoose.Types.ObjectId;
  task?: string | mongoose.Types.ObjectId;
  title: string;
  description?: string;
  link?: string;
};

/**
 * Best-effort activity log — never throws, never blocks the main flow.
 */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    await connectDB();
    await Activity.create(input);
  } catch (e) {
    console.warn("[activity] failed to log:", e);
  }
}
