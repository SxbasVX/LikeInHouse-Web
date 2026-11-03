"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CatalogAccessGate } from "./catalog-access-gate";
import { CatalogInbox } from "./catalog-inbox";
import { CatalogReview } from "./catalog-review";
import { CatalogReviewList } from "./catalog-review-list";
import { CatalogRevision } from "./catalog-revision";

function SectionTabs({ active }: { active: "import" | "review" }) {
  const tabs = [
    { value: "import", label: "Importar catálogos", href: "/admin/dev/catalog-import", icon: FileUp },
    { value: "review", label: "Revisión del catálogo", href: "/admin/dev/catalog-import?view=review", icon: Sparkles },
  ] as const;
  return <nav aria-label="Secciones" className="mb-6 inline-flex rounded-xl border bg-white p-1">
    {tabs.map(({ value, label, href, icon: Icon }) => <Link key={value} href={href} aria-current={active === value ? "page" : undefined}
      className={cn("inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition", active === value ? "bg-brand-teal text-white shadow-sm" : "text-muted-foreground hover:bg-muted")}>
      <Icon className="h-4 w-4" />{label}</Link>)}
  </nav>;
}

export function CatalogImportScreen() {
  const view = useSearchParams().get("view") === "review" ? "review" : "import";
  return <CatalogAccessGate>{(status) => <>
    <SectionTabs active={view} />
    {view === "review" ? <CatalogReviewList status={status} /> : <CatalogInbox status={status} />}
  </>}</CatalogAccessGate>;
}

export function CatalogReviewScreen({ importTourId }: { importTourId: string }) {
  return <CatalogAccessGate>{() => <CatalogReview importTourId={importTourId} />}</CatalogAccessGate>;
}

export function CatalogRevisionScreen({ revisionId }: { revisionId: string }) {
  return <CatalogAccessGate>{() => <CatalogRevision revisionId={revisionId} />}</CatalogAccessGate>;
}
