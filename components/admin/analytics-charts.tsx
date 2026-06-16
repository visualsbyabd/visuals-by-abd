"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Clock } from "lucide-react";

const FIRE = "#D62828";
const FIRE_DIM = "#A81E1E";
const BONE = "#B8B8B8";
const INK_LINE = "#1A1A1A";

const PIE_COLORS = ["#D62828", "#FF3D3D", "#A81E1E", "#5C0E0E", "#B8B8B8"];

type MonthBucket = { label: string; revenue: number; outstanding: number };
type StatusBucket = { name: string; value: number };
type WeekBucket = { label: string; completed: number; created: number };
type ClientHealth = {
  _id: string;
  name: string;
  company?: string;
  score: number;
  revenue: number;
  projects: number;
  outstanding: number;
};

export function AnalyticsCharts({
  months,
  projectStatus,
  weeks,
  avgApprovalHours,
  clientHealth,
}: {
  months: MonthBucket[];
  projectStatus: StatusBucket[];
  weeks: WeekBucket[];
  avgApprovalHours: number;
  clientHealth: ClientHealth[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Revenue over time — wide */}
      <Card title="Revenue · Last 12 months" subtitle="Paid invoices vs. outstanding" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={months}>
            <CartesianGrid stroke={INK_LINE} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="label" stroke={BONE} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={BONE} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<DarkTooltip prefix="$" />} cursor={{ fill: "#0A0A0A" }} />
            <Bar dataKey="revenue" fill={FIRE} radius={[2, 2, 0, 0]} maxBarSize={36} />
            <Bar dataKey="outstanding" fill={FIRE_DIM} radius={[2, 2, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 text-xs text-bone-300 pt-3 border-t border-ink-800 mt-2 px-1">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-fire" /> Paid
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: FIRE_DIM }} /> Outstanding
          </span>
        </div>
      </Card>

      {/* Project status pie */}
      <Card title="Project status" subtitle={`${projectStatus.reduce((s, d) => s + d.value, 0)} total`}>
        {projectStatus.length === 0 ? (
          <EmptyChart label="No projects yet" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={projectStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="#0A0A0A"
                  strokeWidth={2}
                >
                  {projectStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-1.5 text-xs pt-3 border-t border-ink-800">
              {projectStatus.map((s, i) => (
                <li key={s.name} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="capitalize flex-1 text-bone-300">{s.name}</span>
                  <span className="font-mono text-bone">{s.value}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {/* Task velocity */}
      <Card title="Task velocity · 8 weeks" subtitle="Created vs. completed" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={weeks}>
            <CartesianGrid stroke={INK_LINE} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="label" stroke={BONE} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke={BONE} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<DarkTooltip />} cursor={{ stroke: FIRE, strokeOpacity: 0.2 }} />
            <Line type="monotone" dataKey="created" stroke={BONE} strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="completed" stroke={FIRE} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 text-xs text-bone-300 pt-3 border-t border-ink-800 mt-2 px-1">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-fire" /> Completed
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: BONE }} /> Created
          </span>
        </div>
      </Card>

      {/* Avg approval time */}
      <Card title="Approval pace" subtitle="Average time to approve a deliverable">
        <div className="flex flex-col items-center justify-center h-[220px]">
          <Clock className="h-8 w-8 text-fire mb-4" strokeWidth={1.5} />
          <p className="font-display text-5xl font-medium">
            {avgApprovalHours < 1 ? "<1" : Math.round(avgApprovalHours)}
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-bone-400 mt-2">hours average</p>
        </div>
      </Card>

      {/* Client health table */}
      <Card title="Top clients · health" subtitle="Revenue, projects, and payment reliability" className="lg:col-span-3">
        {clientHealth.length === 0 ? (
          <EmptyChart label="No active clients yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800">
                  <th className="text-left text-xs uppercase tracking-[0.2em] text-bone-400 py-2 font-medium">Client</th>
                  <th className="text-right text-xs uppercase tracking-[0.2em] text-bone-400 py-2 font-medium">Revenue</th>
                  <th className="text-right text-xs uppercase tracking-[0.2em] text-bone-400 py-2 font-medium">Projects</th>
                  <th className="text-right text-xs uppercase tracking-[0.2em] text-bone-400 py-2 font-medium">Outstanding</th>
                  <th className="text-right text-xs uppercase tracking-[0.2em] text-bone-400 py-2 font-medium w-48">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {clientHealth.map((c) => (
                  <tr key={c._id} className="hover:bg-ink-950 transition-colors">
                    <td className="py-3">
                      <p className="font-medium">{c.name}</p>
                      {c.company && <p className="text-xs text-bone-400">{c.company}</p>}
                    </td>
                    <td className="text-right font-mono text-sm">${c.revenue.toLocaleString()}</td>
                    <td className="text-right text-sm">{c.projects}</td>
                    <td className="text-right text-sm">
                      {c.outstanding > 0 ? (
                        <span className="text-fire">{c.outstanding}</span>
                      ) : (
                        <span className="text-bone-400">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3 justify-end">
                        <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden flex-1 max-w-[140px]">
                          <div
                            className={`h-full transition-all ${
                              c.score >= 80 ? "bg-fire" : c.score >= 50 ? "bg-fire-dim" : "bg-bone-400"
                            }`}
                            style={{ width: `${c.score}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs w-8 text-right">{c.score}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-ink-800 rounded-sm p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="font-display text-lg font-medium leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-bone-400 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[220px] grid place-items-center text-bone-400 text-sm">{label}</div>
  );
}

function DarkTooltip({
  active,
  payload,
  label,
  prefix = "",
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  prefix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink-950 border border-ink-800 rounded-sm px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-bone-400 mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 capitalize">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-bone-300">{p.name}:</span>
          <span className="font-mono text-bone">{prefix}{p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}
