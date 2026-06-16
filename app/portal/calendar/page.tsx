import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CalendarView } from "@/components/calendar-view";
import { getCalendarEvents } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export default async function PortalCalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "client" || !session.user.clientId) {
    return (
      <div>
        <p className="eyebrow mb-3">— Calendar</p>
        <h1 className="display-md mb-4">Account not linked.</h1>
      </div>
    );
  }

  const events = await getCalendarEvents({
    clientId: session.user.clientId,
    visibleToClientOnly: true,
    linkPrefix: "portal",
  });

  return (
    <div>
      <div className="mb-12">
        <p className="eyebrow mb-3">— Schedule</p>
        <h1 className="display-md text-balance">Calendar</h1>
        <p className="text-bone-300 mt-2">Everything coming up across your projects.</p>
      </div>
      <CalendarView events={events} />
    </div>
  );
}
