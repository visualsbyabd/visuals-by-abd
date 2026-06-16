import { connectDB } from "@/lib/mongodb";
import { Invoice } from "@/models/Invoice";
import { Project } from "@/models/Project";
import { Task } from "@/models/Task";
import { Deliverable } from "@/models/Deliverable";
import { Client } from "@/models/Client";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";
import { DollarSign, FolderKanban, Users, FileCheck2, Receipt, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

async function getAnalytics() {
  await connectDB();

  const [invoices, projects, tasks, deliverables, clients] = await Promise.all([
    Invoice.find().select("total currency status issueDate paidDate client createdAt").lean(),
    Project.find().select("title status progress clientRef createdAt updatedAt").lean(),
    Task.find().select("status completedAt createdAt").lean(),
    Deliverable.find().select("status createdAt reviewedAt version").lean(),
    Client.find().select("_id name company status").lean(),
  ]);

  // ─── Revenue over time (last 12 months) ───
  const now = new Date();
  const months: { label: string; key: string; revenue: number; outstanding: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      label: d.toLocaleString(undefined, { month: "short" }),
      key,
      revenue: 0,
      outstanding: 0,
    });
  }
  for (const inv of invoices) {
    if (inv.status === "paid" && inv.paidDate) {
      const d = new Date(inv.paidDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = months.find((m) => m.key === key);
      if (bucket) bucket.revenue += inv.total;
    } else if ((inv.status === "sent" || inv.status === "overdue") && inv.issueDate) {
      const d = new Date(inv.issueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = months.find((m) => m.key === key);
      if (bucket) bucket.outstanding += inv.total;
    }
  }

  // ─── Project status distribution ───
  const projectStatusMap = new Map<string, number>();
  for (const p of projects) {
    projectStatusMap.set(p.status, (projectStatusMap.get(p.status) ?? 0) + 1);
  }
  const projectStatus = Array.from(projectStatusMap.entries()).map(([name, value]) => ({ name, value }));

  // ─── Task velocity (last 8 weeks) ───
  const weeks: { label: string; completed: number; created: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(now.getDate() - i * 7 - 6);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const label = `${start.toLocaleString(undefined, { month: "short", day: "numeric" })}`;
    let completed = 0;
    let created = 0;
    for (const t of tasks) {
      const created_at = new Date(t.createdAt);
      if (created_at >= start && created_at < end) created++;
      if (t.completedAt) {
        const c = new Date(t.completedAt);
        if (c >= start && c < end) completed++;
      }
    }
    weeks.push({ label, completed, created });
  }

  // ─── Deliverable approval times (in hours) ───
  const approvalTimes: number[] = [];
  for (const d of deliverables) {
    if (d.status === "approved" && d.reviewedAt && d.createdAt) {
      const hours = (new Date(d.reviewedAt).getTime() - new Date(d.createdAt).getTime()) / 36e5;
      if (hours >= 0 && hours < 24 * 90) approvalTimes.push(hours);
    }
  }
  const avgApprovalHours =
    approvalTimes.length > 0 ? approvalTimes.reduce((s, h) => s + h, 0) / approvalTimes.length : 0;

  // ─── Client health: revision rate + last activity proxy ───
  const clientHealth = clients
    .filter((c) => c.status === "active")
    .map((c) => {
      const clientInvoices = invoices.filter((i) => String(i.client) === String(c._id));
      const paidOnTime = clientInvoices.filter((i) => i.status === "paid").length;
      const outstanding = clientInvoices.filter((i) => i.status === "sent" || i.status === "overdue").length;
      const totalPaid = clientInvoices
        .filter((i) => i.status === "paid")
        .reduce((s, i) => s + i.total, 0);
      const clientProjects = projects.filter((p) => String(p.clientRef) === String(c._id));
      const score =
        clientInvoices.length === 0
          ? 60
          : Math.max(
              0,
              Math.min(100, Math.round((paidOnTime / Math.max(1, clientInvoices.length)) * 100 - outstanding * 5))
            );
      return {
        _id: String(c._id),
        name: c.name,
        company: c.company,
        score,
        revenue: totalPaid,
        projects: clientProjects.length,
        outstanding,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // ─── Totals ───
  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + i.total, 0);
  const activeProjects = projects.filter((p) => p.status === "published" || p.status === "draft").length;
  const pendingReview = deliverables.filter((d) => d.status === "in_review").length;
  const taskCompletionPct =
    tasks.length > 0
      ? Math.round((tasks.filter((t) => t.status === "completed" || t.status === "approved").length / tasks.length) * 100)
      : 0;

  return {
    months,
    projectStatus,
    weeks,
    avgApprovalHours: Math.round(avgApprovalHours * 10) / 10,
    clientHealth,
    totals: {
      revenue: totalRevenue,
      outstanding,
      activeProjects,
      activeClients: clients.filter((c) => c.status === "active").length,
      pendingReview,
      taskCompletionPct,
    },
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow mb-3">— Studio</p>
        <h1 className="display-md text-balance">Analytics</h1>
        <p className="text-bone-300 mt-2">Where revenue, projects, and approvals are headed.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Stat icon={DollarSign} label="Revenue" value={`$${data.totals.revenue.toLocaleString()}`} accent />
        <Stat icon={Receipt} label="Outstanding" value={`$${data.totals.outstanding.toLocaleString()}`} accent={data.totals.outstanding > 0} />
        <Stat icon={FolderKanban} label="Active projects" value={data.totals.activeProjects} />
        <Stat icon={Users} label="Active clients" value={data.totals.activeClients} />
        <Stat icon={FileCheck2} label="Pending review" value={data.totals.pendingReview} />
        <Stat icon={TrendingUp} label="Tasks done" value={`${data.totals.taskCompletionPct}%`} />
      </div>

      <AnalyticsCharts
        months={data.months}
        projectStatus={data.projectStatus}
        weeks={data.weeks}
        avgApprovalHours={data.avgApprovalHours}
        clientHealth={data.clientHealth}
      />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className={`border rounded-sm p-5 ${accent ? "border-fire/40 bg-fire/5" : "border-ink-800"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-[0.2em] text-bone-300">{label}</span>
        <Icon className="h-4 w-4 text-fire" strokeWidth={1.5} />
      </div>
      <p className="font-display text-2xl font-medium">{value}</p>
    </div>
  );
}
