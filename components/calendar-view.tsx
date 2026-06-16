"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flag, FileCheck2, Receipt, ListChecks } from "lucide-react";

export type CalendarEvent = {
  id: string;
  date: string; // ISO
  title: string;
  type: "milestone" | "deliverable" | "invoice" | "task";
  link?: string;
  meta?: string;
};

const TYPE_ICON = {
  milestone: Flag,
  deliverable: FileCheck2,
  invoice: Receipt,
  task: ListChecks,
};

const TYPE_COLOR: Record<CalendarEvent["type"], string> = {
  milestone: "bg-fire/15 border-fire/40 text-fire",
  deliverable: "bg-bone/10 border-bone/30 text-bone",
  invoice: "bg-fire/10 border-fire/30 text-fire",
  task: "bg-ink-800 border-ink-700 text-bone-300",
};

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [filter, setFilter] = useState<"all" | CalendarEvent["type"]>("all");

  const filtered = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.type === filter)),
    [events, filter]
  );

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of filtered) {
      const key = new Date(e.date).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [filtered]);

  const days = useMemo(() => buildMonthGrid(cursor), [cursor]);

  function nav(delta: number) {
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + delta);
    setCursor(next);
  }

  function goToday() {
    const d = new Date();
    d.setDate(1);
    setCursor(d);
  }

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });
  const todayKey = new Date().toDateString();

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav(-1)}
            className="h-9 w-9 grid place-items-center border border-ink-700 hover:border-fire hover:text-fire rounded-sm transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToday}
            className="px-4 py-2 text-sm border border-ink-700 hover:border-fire hover:text-fire rounded-full transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => nav(1)}
            className="h-9 w-9 grid place-items-center border border-ink-700 hover:border-fire hover:text-fire rounded-sm transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="font-display text-2xl font-medium ml-2">{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {(["all", "milestone", "deliverable", "task", "invoice"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                filter === f ? "border-fire text-fire bg-fire/10" : "border-ink-700 text-bone-300 hover:border-bone-300"
              }`}
            >
              {f === "all" ? "All" : `${f}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-ink-800 border border-ink-800 rounded-sm overflow-hidden">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="bg-ink-950 px-3 py-2 text-xs uppercase tracking-[0.18em] text-bone-400">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          const inMonth = day.getMonth() === cursor.getMonth();
          const key = day.toDateString();
          const eventsForDay = byDate.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div
              key={i}
              className={`bg-ink-950 min-h-[100px] p-2 ${!inMonth ? "opacity-30" : ""} ${
                isToday ? "ring-1 ring-inset ring-fire/60" : ""
              }`}
            >
              <p
                className={`text-xs font-mono ${
                  isToday ? "text-fire font-medium" : "text-bone-400"
                }`}
              >
                {day.getDate()}
              </p>
              <div className="space-y-1 mt-1">
                {eventsForDay.slice(0, 3).map((e) => {
                  const Icon = TYPE_ICON[e.type];
                  const content = (
                    <div className={`flex items-center gap-1 px-1.5 py-1 border rounded-sm text-[10px] truncate ${TYPE_COLOR[e.type]}`}>
                      <Icon className="h-2.5 w-2.5 flex-shrink-0" strokeWidth={2} />
                      <span className="truncate">{e.title}</span>
                    </div>
                  );
                  return e.link ? (
                    <Link key={e.id} href={e.link} className="block hover:opacity-80 transition-opacity">
                      {content}
                    </Link>
                  ) : (
                    <div key={e.id}>{content}</div>
                  );
                })}
                {eventsForDay.length > 3 && (
                  <p className="text-[10px] text-bone-400 px-1.5">+{eventsForDay.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildMonthGrid(monthDate: Date): Date[] {
  // Returns 42 days (6 weeks × 7) starting on Monday
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const weekday = (start.getDay() + 6) % 7; // 0 = Monday
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - weekday);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}
