import { CalendarView } from "@/components/calendar-view";
import { getCalendarEvents } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const events = await getCalendarEvents({ linkPrefix: "admin" });

  return (
    <div>
      <div className="mb-12">
        <p className="eyebrow mb-3">— Schedule</p>
        <h1 className="display-md text-balance">Calendar</h1>
        <p className="text-bone-300 mt-2">Milestones, deliverables, task deadlines, and invoice due dates.</p>
      </div>
      <CalendarView events={events} />
    </div>
  );
}
