import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/server/lib/db";
import { DocViewer } from "@/components/public/doc-viewer";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const doc = await db.document.findUnique({
    where: { slug, isPublished: true },
    select: { titleEs: true, titleEn: true },
  });
  if (!doc) return { title: "Documento no encontrado | Like In House" };

  const title = locale === "es" ? doc.titleEs : doc.titleEn;
  return {
    title: `${title} | Like In House`,
    robots: { index: false, follow: false },
  };
}

export default async function DocPage({ params }: Props) {
  const { locale, slug } = await params;
  const doc = await db.document.findUnique({ where: { slug, isPublished: true } });
  if (!doc) notFound();

  return <DocViewer doc={doc} locale={locale} />;
}
