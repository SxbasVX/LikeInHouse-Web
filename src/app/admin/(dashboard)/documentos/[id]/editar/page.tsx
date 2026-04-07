import { notFound } from "next/navigation";
import { db } from "@/server/lib/db";
import { DocumentForm } from "@/components/admin/document-form";

export const metadata = { title: "Editar Documento | Admin" };

export default async function EditarDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) notFound();

  const initialData = {
    id: doc.id,
    slug: doc.slug,
    titleEs: doc.titleEs,
    titleEn: doc.titleEn,
    type: doc.type as "PDF" | "CONTENT",
    pdfUrl: doc.pdfUrl,
    contentEs: doc.contentEs,
    contentEn: doc.contentEn,
    isPublished: doc.isPublished,
    sortOrder: doc.sortOrder,
  };

  return <DocumentForm documentId={id} initialData={initialData} />;
}
