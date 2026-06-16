import Link from "next/link";
import { computeAllClientHealth } from "@/lib/client-health";
import { Activity, AlertCircle, CheckCircle2, Clock, MinusCircle, TrendingDown, Heart } from "lucide-react";

export const dynamic = "force-dynamic";

const BAND_META = {
  excellent: { label: "Excellent", color: "border-fire/40 bg-fire/5 text-fire", icon: CheckCircle2 },
  good: { label: "Good", color: "border-fire/30 bg-fire/[0.03] text-fire/90", icon: CheckCircle2 },
  fair: { label: "Fair", color: "border-bone-300/30 bg-ink-900 text-bone-300", icon: Clock },
  at_risk: { label: "At risk", color: "border-fire/60 bg-fire/10 text-fire", icon: TrendingDown },
  critical: { label: "Critical", color: "border-fire bg-fire/15 text-fire", icon: AlertCircle },
} as const;

export default async function ClientHealthPage() {
  const reports = await computeAllClientHealth();

  const bands = {
    excellent: reports.filter((r) => r.band === "excellent").length,
    good: reports.filter((r) => r.band === "good").length,
    fair: reports.filter((r) => r.band === "fair").length,
    at_risk: reports.filter((r) => r.band === "at_risk").length,
    critical: reports.filter((r) => r.band === "critical").length,
  };
  const avgScore = reports.length > 0 ? Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length) : 0;

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow mb-3">— Studio · Health</p>
        <h1 className="display-md text-balance">Client health</h1>
        <p className="text-bone-300 mt-2">
          Weighted across payment reliability, response speed, engagement, revisions, and project momentum.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard label="Avg. score" value={avgScore || "—"} icon={Heart} accent />
        <SummaryCard label="Excellent" value={bands.excellent} icon={CheckCircle2} />
        <SummaryCard label="Good" value={bands.good} icon={CheckCircle2} />
        <SummaryCard label="Fair" value={bands.fair} icon={Clock} />
        <SummaryCard label="At risk" value={bands.at_risk} icon={TrendingDown} accent={bands.at_risk > 0} />
        <SummaryCard label="Critical" value={bands.critical} icon={AlertCircle} accent={bands.critical > 0} />
      </div>

      {/* Reports */}
      {reports.length === 0 ? (
        <div className="border border-ink-800 rounded-sm p-16 text-center">
          <p className="text-bone-300">No active clients to score.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => {
            const meta = BAND_META[r.band];
            const Icon = meta.icon;
            return (
              <article
                key={r._id}
                className="border border-ink-800 hover:border-fire/40 rounded-sm overflow-hidden transition-colors"
              >
                <header className="flex items-center justify-between gap-4 p-5 border-b border-ink-800 flex-wrap">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className={`h-10 w-10 rounded-full grid place-items-center border ${meta.color} flex-shrink-0`}>
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/clients/${r._id}`}
                        className="font-medium hover:text-fire transition-colors block truncate"
                      >
                        {r.name}
                      </Link>
                      {r.company && <p className="text-xs text-bone-400 truncate">{r.company}</p>}
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 border rounded-full uppercase tracking-wider ${meta.color} flex-shrink-0`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-bone-400">Score</p>
                      <p className={`font-display text-2xl font-medium ${r.score >= 70 ? "text-fire" : r.score >= 50 ? "text-bone" : "text-fire/80"}`}>
                        {r.score}
                      </p>
                    </div>
                    <div className="w-32 hidden sm:block">
                      <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${r.score >= 70 ? "bg-fire" : r.score >= 50 ? "bg-bone-300" : "bg-fire-dim"}`}
                          style={{ width: `${r.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </header>

                <div className="p-5">
                  {/* Signal breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                    {r.signals.map((s) => (
                      <div key={s.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-bone-300">{s.label}</span>
                          <span className="font-mono text-bone-400">{s.score}</span>
                        </div>
                        <div className="h-1 bg-ink-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${s.score >= 70 ? "bg-fire" : s.score >= 50 ? "bg-bone-300" : "bg-fire-dim"}`}
                            style={{ width: `${s.score}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-bone-400 leading-tight">{s.detail}</p>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="flex items-center gap-6 pt-4 border-t border-ink-800 text-xs text-bone-300 flex-wrap">
                    <span>Revenue · <span className="text-bone font-mono">${r.totals.revenue.toLocaleString()}</span></span>
                    {r.totals.outstanding > 0 && (
                      <span>Outstanding · <span className="text-fire font-mono">${r.totals.outstanding.toLocaleString()}</span></span>
                    )}
                    <span>Active projects · <span className="text-bone">{r.totals.activeProjects}</span></span>
                    {r.totals.openRevisions > 0 && (
                      <span>Open revisions · <span className="text-fire">{r.totals.openRevisions}</span></span>
                    )}
                    {r.totals.daysSinceLastActivity !== null && (
                      <span>
                        Last activity ·{" "}
                        <span className={r.totals.daysSinceLastActivity > 14 ? "text-fire" : "text-bone"}>
                          {r.totals.daysSinceLastActivity === 0 ? "today" : `${r.totals.daysSinceLastActivity}d ago`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent?: boolean;
}) {
  return (
    <div className={`border rounded-sm p-4 ${accent ? "border-fire/40 bg-fire/5" : "border-ink-800"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-[0.2em] text-bone-300">{label}</span>
        <Icon className="h-3.5 w-3.5 text-fire" strokeWidth={1.5} />
      </div>
      <p className="font-display text-2xl font-medium">{value}</p>
    </div>
  );
}
