import { redirect } from "next/navigation";
import { auth } from "@/server/lib/auth";
import { isCatalogImportEnabled } from "@/server/catalog-import/access";
import { CatalogImportAccess } from "@/components/admin/catalog-import/catalog-import-access";

export default async function CatalogImportPage() {
  if (!isCatalogImportEnabled()) redirect("/admin");

  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  if (session.user.role !== "DEVELOPER" && session.user.role !== "ADMIN") redirect("/admin");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-darkRed">
          AI Catalog Importer
        </h1>
        <p className="font-serif italic text-brand-teal">
          Herramienta privada para analizar catálogos y preparar borradores.
        </p>
      </div>
      <CatalogImportAccess />
    </div>
  );
}
