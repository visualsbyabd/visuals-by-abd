import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PortalSidebar } from "@/components/portal/sidebar";
import { PortalTopbar } from "@/components/portal/topbar";
import { connectDB } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Get unread count for the notification bell
  let unreadCount = 0;
  try {
    await connectDB();
    unreadCount = await Notification.countDocuments({ user: session.user.id, read: false });
  } catch {}

  return (
    <div className="min-h-screen bg-ink flex">
      <PortalSidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <PortalTopbar user={session.user} unreadCount={unreadCount} />
        <main className="flex-1 px-6 lg:px-10 py-8 lg:py-12 max-w-[1400px] w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
