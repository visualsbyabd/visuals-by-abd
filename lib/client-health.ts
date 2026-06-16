import { connectDB } from "@/lib/mongodb";
import { Client } from "@/models/Client";
import { Invoice } from "@/models/Invoice";
import { Project } from "@/models/Project";
import { Deliverable } from "@/models/Deliverable";
import { Revision } from "@/models/Revision";
import { Message } from "@/models/Message";
import { Activity } from "@/models/Activity";
import { Task } from "@/models/Task";
import mongoose from "mongoose";

/**
 * Client health is computed from five weighted signals. Each signal yields
 * a 0–100 score; the final health is a weighted average.
 *
 *   payment_reliability   25%   — paid-on-time invoices vs. total
 *   response_speed        20%   — average time client takes to act on deliverables
 *   engagement            20%   — recent activity volume (messages, approvals, logins)
 *   revision_health       20%   — revision rate per deliverable (lower is healthier)
 *   project_momentum      15%   — completed milestones + tasks vs. open ones
 *
 * Scores degrade gracefully when signals are missing (e.g. brand-new client
 * with no invoices yet gets a neutral 60 instead of 0).
 */

export type SignalBreakdown = {
  label: string;
  weight: number;
  score: number;
  detail: string;
};

export type ClientHealthReport = {
  _id: string;
  name: string;
  company?: string;
  score: number;
  band: "excellent" | "good" | "fair" | "at_risk" | "critical";
  signals: SignalBreakdown[];
  totals: {
    revenue: number;
    outstanding: number;
    activeProjects: number;
    openRevisions: number;
    daysSinceLastActivity: number | null;
  };
};

const BANDS: { min: number; band: ClientHealthReport["band"] }[] = [
  { min: 85, band: "excellent" },
  { min: 70, band: "good" },
  { min: 50, band: "fair" },
  { min: 30, band: "at_risk" },
  { min: 0, band: "critical" },
];

function band(score: number): ClientHealthReport["band"] {
  return BANDS.find((b) => score >= b.min)?.band ?? "critical";
}

const WEIGHTS = {
  payment_reliability: 0.25,
  response_speed: 0.2,
  engagement: 0.2,
  revision_health: 0.2,
  project_momentum: 0.15,
};

export async function computeClientHealth(
  clientId: string | mongoose.Types.ObjectId
): Promise<ClientHealthReport | null> {
  await connectDB();
  const client = await Client.findById(clientId).lean();
  if (!client) return null;

  const cid = client._id;
  const [invoices, projects, activities] = await Promise.all([
    Invoice.find({ client: cid }).lean(),
    Project.find({ clientRef: cid }).select("_id status updatedAt").lean(),
    Activity.find({ client: cid }).sort({ createdAt: -1 }).limit(200).lean(),
  ]);

  const projectIds = projects.map((p) => p._id);
  const [deliverables, revisions, messages, tasks] = await Promise.all([
    Deliverable.find({ project: { $in: projectIds } }).lean(),
    Revision.find({ client: cid }).lean(),
    Message.find({ project: { $in: projectIds } }).select("sender createdAt").lean(),
    Task.find({ project: { $in: projectIds } }).select("status completedAt").lean(),
  ]);

  // ─── Signal 1: payment_reliability ───
  const payment = scorePaymentReliability(invoices);

  // ─── Signal 2: response_speed ───
  const response = scoreResponseSpeed(deliverables);

  // ─── Signal 3: engagement ───
  const engagement = scoreEngagement(activities, messages);

  // ─── Signal 4: revision_health ───
  const revisionHealth = scoreRevisionHealth(revisions, deliverables);

  // ─── Signal 5: project_momentum ───
  const momentum = scoreProjectMomentum(tasks);

  const score = Math.round(
    payment.score * WEIGHTS.payment_reliability +
      response.score * WEIGHTS.response_speed +
      engagement.score * WEIGHTS.engagement +
      revisionHealth.score * WEIGHTS.revision_health +
      momentum.score * WEIGHTS.project_momentum
  );

  // Aggregate totals
  const revenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + i.total, 0);
  const activeProjects = projects.filter((p) => p.status === "draft" || p.status === "published").length;
  const openRevisions = revisions.filter((r) =>
    ["open", "in_review", "working"].includes(r.status)
  ).length;
  const lastActivity = activities[0]?.createdAt;
  const daysSinceLastActivity = lastActivity
    ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
    : null;

  return {
    _id: String(cid),
    name: client.name,
    company: client.company,
    score,
    band: band(score),
    signals: [
      { label: "Payment reliability", weight: WEIGHTS.payment_reliability, ...payment },
      { label: "Response speed", weight: WEIGHTS.response_speed, ...response },
      { label: "Engagement", weight: WEIGHTS.engagement, ...engagement },
      { label: "Revision health", weight: WEIGHTS.revision_health, ...revisionHealth },
      { label: "Project momentum", weight: WEIGHTS.project_momentum, ...momentum },
    ],
    totals: { revenue, outstanding, activeProjects, openRevisions, daysSinceLastActivity },
  };
}

export async function computeAllClientHealth(): Promise<ClientHealthReport[]> {
  await connectDB();
  const clients = await Client.find({ status: "active" }).select("_id").lean();
  const reports = await Promise.all(clients.map((c) => computeClientHealth(c._id)));
  return reports.filter((r): r is ClientHealthReport => r !== null).sort((a, b) => b.score - a.score);
}

/* ─────────── Signal scorers ─────────── */

type Inv = { status: string; total: number; issueDate?: Date; dueDate?: Date; paidDate?: Date };
function scorePaymentReliability(invoices: Inv[]): Omit<SignalBreakdown, "label" | "weight"> {
  if (invoices.length === 0) return { score: 60, detail: "No invoice history yet" };

  const closed = invoices.filter((i) => i.status === "paid" || i.status === "overdue" || i.status === "cancelled");
  if (closed.length === 0) {
    return { score: 65, detail: "All invoices still open" };
  }

  const paid = invoices.filter((i) => i.status === "paid");
  const overdue = invoices.filter((i) => i.status === "overdue");
  const paidOnTime = paid.filter((i) => {
    if (!i.dueDate || !i.paidDate) return true;
    return new Date(i.paidDate) <= new Date(i.dueDate);
  });

  const onTimeRate = paid.length > 0 ? paidOnTime.length / paid.length : 1;
  const overdueRate = overdue.length / invoices.length;

  const score = Math.max(0, Math.min(100, Math.round(onTimeRate * 100 - overdueRate * 60)));
  const detail =
    overdue.length > 0
      ? `${overdue.length} invoice${overdue.length === 1 ? "" : "s"} overdue`
      : `${paidOnTime.length}/${paid.length} paid on time`;
  return { score, detail };
}

type Del = { status: string; createdAt: Date; reviewedAt?: Date };
function scoreResponseSpeed(deliverables: Del[]): Omit<SignalBreakdown, "label" | "weight"> {
  const reviewed = deliverables.filter((d) => d.reviewedAt && (d.status === "approved" || d.status === "changes_requested"));
  if (reviewed.length === 0) {
    return { score: 60, detail: "No deliverables reviewed yet" };
  }
  const avgHours =
    reviewed.reduce((sum, d) => sum + (new Date(d.reviewedAt!).getTime() - new Date(d.createdAt).getTime()) / 36e5, 0) /
    reviewed.length;

  // 24h → 100, 48h → 85, 72h → 70, 7 days → 40, 14 days → 0
  let score = 100;
  if (avgHours <= 24) score = 100;
  else if (avgHours <= 48) score = 90;
  else if (avgHours <= 72) score = 75;
  else if (avgHours <= 168) score = 55;
  else if (avgHours <= 336) score = 30;
  else score = 10;

  const detail =
    avgHours < 24
      ? `Averages under a day`
      : avgHours < 48
      ? `~${Math.round(avgHours)}h average response`
      : `~${Math.round(avgHours / 24)} days average response`;

  return { score, detail };
}

type Act = { createdAt: Date };
type Msg = { sender: mongoose.Types.ObjectId; createdAt: Date };
function scoreEngagement(activities: Act[], messages: Msg[]): Omit<SignalBreakdown, "label" | "weight"> {
  if (activities.length === 0 && messages.length === 0) {
    return { score: 50, detail: "No activity recorded" };
  }
  const now = Date.now();
  const last30 = activities.filter((a) => now - new Date(a.createdAt).getTime() < 30 * 86400000);
  const last7 = activities.filter((a) => now - new Date(a.createdAt).getTime() < 7 * 86400000);

  // 0 in 30 days → 0, 5 → 50, 15+ → 100
  const volumeScore = Math.min(100, Math.round((last30.length / 15) * 100));
  // bonus for recency
  const recencyBonus = last7.length > 0 ? 10 : -10;

  const score = Math.max(0, Math.min(100, volumeScore + recencyBonus));
  const detail =
    last30.length === 0
      ? "No activity in 30 days"
      : `${last30.length} event${last30.length === 1 ? "" : "s"} in last 30 days`;
  return { score, detail };
}

type Rev = { status: string };
function scoreRevisionHealth(revisions: Rev[], deliverables: Del[]): Omit<SignalBreakdown, "label" | "weight"> {
  if (deliverables.length === 0) {
    return { score: 60, detail: "No deliverables yet" };
  }
  const open = revisions.filter((r) => ["open", "in_review", "working"].includes(r.status)).length;
  const ratio = revisions.length / deliverables.length;

  // 0 revisions/delivery → 100. 0.5 → 80. 1 → 60. 2 → 30. 3+ → 10.
  let score = 100;
  if (ratio <= 0.25) score = 100;
  else if (ratio <= 0.5) score = 85;
  else if (ratio <= 1) score = 70;
  else if (ratio <= 1.5) score = 50;
  else if (ratio <= 2.5) score = 25;
  else score = 10;

  // penalize open revisions piling up
  score = Math.max(0, score - open * 3);
  const detail =
    revisions.length === 0
      ? "No revisions filed"
      : `${revisions.length} revision${revisions.length === 1 ? "" : "s"}${open > 0 ? ` · ${open} open` : ""}`;
  return { score, detail };
}

type Tsk = { status: string; completedAt?: Date };
function scoreProjectMomentum(tasks: Tsk[]): Omit<SignalBreakdown, "label" | "weight"> {
  if (tasks.length === 0) {
    return { score: 60, detail: "No tasks tracked" };
  }
  const done = tasks.filter((t) => t.status === "completed" || t.status === "approved").length;
  const stalled = tasks.filter((t) => t.status === "in_progress" || t.status === "revision").length;
  const completionRate = done / tasks.length;

  // 0% → 20. 50% → 70. 100% → 100. Then penalize stalled work.
  let score = Math.round(20 + completionRate * 80);
  if (stalled > 5) score -= 10;

  return {
    score: Math.max(0, Math.min(100, score)),
    detail: `${done}/${tasks.length} tasks done`,
  };
}
