import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/server/lib/auth";
import { isCatalogImportEnabled } from "@/server/catalog-import/access";
import { CatalogImportScreen } from "@/components/admin/catalog-import/catalog-import-screen";

export default async function CatalogImportPage() {
  if (!isCatalogImportEnabled()) redirect("/admin");

  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  if (session.user.role !== "DEVELOPER") redirect("/admin");

  return (
    <div className="min-h-screen bg-[hsl(26,44%,97%)]">
      <div className="mx-auto max-w-7xl p-4 sm:p-8">
        <Suspense><CatalogImportScreen /></Suspense>
      </div>
    </div>
  );
}
