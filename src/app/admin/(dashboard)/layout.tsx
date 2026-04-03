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
    <div className="flex h-screen gap-3 bg-[hsl(26,44%,94%)] p-3">
      <AdminSidebar user={session.user} />
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-[hsl(26,44%,97%)]">
        <AdminHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
