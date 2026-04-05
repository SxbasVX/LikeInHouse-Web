import { redirect } from "next/navigation";
import { auth } from "@/server/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex h-screen bg-[hsl(26,44%,94%)] lg:gap-3 lg:p-3">
      <AdminSidebar user={session.user} />
      <div className="flex flex-1 flex-col overflow-hidden lg:rounded-2xl bg-[hsl(26,44%,97%)]">
        <AdminHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
