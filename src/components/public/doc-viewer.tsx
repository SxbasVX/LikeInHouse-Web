"use client";

import { Link } from "@/i18n/routing";
import { ArrowLeft, FileText, Globe } from "lucide-react";

interface DocViewerProps {
  doc: {
    slug: string;
    titleEs: string;
    titleEn: string;
    type: string;
    pdfUrl: string | null;
    contentEs: string | null;
    contentEn: string | null;
  };
  locale: string;
}

export function DocViewer({ doc, locale }: DocViewerProps) {
  const isEs = locale === "es";
  const title = isEs ? doc.titleEs : doc.titleEn;
  const content = isEs ? doc.contentEs : doc.contentEn;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de la página */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="shrink-0 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-orange transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {isEs ? "Inicio" : "Home"}
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <div className="flex items-center gap-2 min-w-0">
              {doc.type === "PDF" ? (
                <FileText className="h-4 w-4 shrink-0 text-brand-orange" />
              ) : (
                <Globe className="h-4 w-4 shrink-0 text-brand-teal" />
              )}
              <h1 className="font-semibold text-gray-900 truncate">{title}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {doc.type === "PDF" ? (
        doc.pdfUrl ? (
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="rounded-xl overflow-hidden shadow-lg bg-white" style={{ height: "calc(100vh - 160px)" }}>
              <iframe
                src={`/api/docs/${doc.slug}/pdf#toolbar=1&navpanes=0&scrollbar=1`}
                className="w-full h-full border-0"
                title={title}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-32 text-muted-foreground">
            {isEs ? "PDF no disponible" : "PDF not available"}
          </div>
        )
      ) : (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
          {content ? (
            <div
              className="prose prose-gray max-w-none prose-headings:font-heading prose-a:text-brand-orange prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="text-center text-muted-foreground py-20">
              {isEs ? "Contenido no disponible" : "Content not available"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
