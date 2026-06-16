"use client";

import { Check, Circle, Clock } from "lucide-react";

type Milestone = {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  dueDate?: string;
  completedAt?: string;
};

export function MilestonesPanel({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return (
      <div className="border border-ink-800 rounded-sm p-6 text-center">
        <p className="text-sm text-bone-300">No milestones set yet.</p>
      </div>
    );
  }

  return (
    <ol className="relative border-l border-ink-800 pl-6 space-y-8 ml-2">
      {milestones.map((m) => {
        const done = m.status === "completed";
        const active = m.status === "in_progress";
        return (
          <li key={m._id} className="relative">
            <span
              className={`absolute -left-[33px] top-0 h-5 w-5 rounded-full border-2 grid place-items-center ${
                done
                  ? "bg-fire border-fire"
                  : active
                  ? "bg-ink border-fire"
                  : "bg-ink border-ink-700"
              }`}
            >
              {done ? (
                <Check className="h-3 w-3 text-bone" strokeWidth={3} />
              ) : active ? (
                <Clock className="h-2.5 w-2.5 text-fire" strokeWidth={2.5} />
              ) : (
                <Circle className="h-2 w-2 text-bone-400" strokeWidth={2.5} />
              )}
            </span>
            <p
              className={`font-medium leading-tight ${
                done ? "text-bone-400 line-through decoration-bone-400/40" : "text-bone"
              }`}
            >
              {m.title}
            </p>
            {m.description && (
              <p className="text-sm text-bone-300 mt-1 leading-relaxed text-pretty">
                {m.description}
              </p>
            )}
            <p className="text-xs text-bone-400 mt-2">
              {done && m.completedAt
                ? `Completed ${new Date(m.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                : m.dueDate
                ? `Due ${new Date(m.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                : active
                ? "In progress"
                : "Upcoming"}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
