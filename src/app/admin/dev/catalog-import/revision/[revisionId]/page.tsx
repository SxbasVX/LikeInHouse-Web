import { notFound, redirect } from "next/navigation";
import { auth } from "@/server/lib/auth";
import { isCatalogImportEnabled } from "@/server/catalog-import/access";
import { CatalogRevisionScreen } from "@/components/admin/catalog-import/catalog-import-screen";

export default async function CatalogRevisionPage({ params }: { params: Promise<{ revisionId: string }> }) {
  if (!isCatalogImportEnabled()) redirect("/admin");

  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  if (session.user.role !== "DEVELOPER") redirect("/admin");

  const { revisionId } = await params;
  if (!/^c[a-z0-9]{20,32}$/.test(revisionId)) notFound();

  return (
    <div className="min-h-screen bg-[hsl(26,44%,97%)]">
      <div className="mx-auto max-w-7xl p-4 sm:p-8">
        <CatalogRevisionScreen revisionId={revisionId} />
      </div>
    </div>
  );
}
