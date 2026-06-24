import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { SidebarProvider, SidebarLayoutShell } from "@/components/admin/sidebar-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-ink flex">
        <AdminSidebar />
        <SidebarLayoutShell>
          <AdminTopbar user={session.user} />
          <main className="flex-1 px-6 lg:px-10 py-8 lg:py-12 max-w-[1600px] w-full">
            {children}
          </main>
        </SidebarLayoutShell>
      </div>
    </SidebarProvider>
  );
}
