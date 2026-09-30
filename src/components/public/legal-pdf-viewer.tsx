"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface LegalPdfViewerProps {
  file: string;
  title: string;
  downloadLabel: string;
}

export function LegalPdfViewer({ file, title, downloadLabel }: LegalPdfViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [pageWidth, setPageWidth] = useState(720);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const element = viewerRef.current;
    if (!element) return;

    const updateWidth = () => {
      setPageWidth(Math.max(280, Math.min(element.clientWidth - 32, 820)));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const previousPage = () => setPageNumber((page) => Math.max(1, page - 1));
  const nextPage = () => setPageNumber((page) => Math.min(pageCount, page + 1));

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 45) return;
    if (distance < 0) nextPage();
    else previousPage();
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-[#202124] shadow-lg">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
        <p className="truncate text-sm font-medium">{title}</p>
        <a
          href={file}
          download
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-semibold transition-colors hover:bg-white/20"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{downloadLabel}</span>
        </a>
      </div>

      <div
        ref={viewerRef}
        className="relative flex min-h-[62vh] items-center justify-center overflow-hidden bg-[#525659] p-4 sm:p-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {pageCount > 1 && (
          <>
            <button
              type="button"
              onClick={previousPage}
              disabled={pageNumber === 1}
              aria-label="Página anterior"
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-30 sm:left-4"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={nextPage}
              disabled={pageNumber === pageCount}
              aria-label="Página siguiente"
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-30 sm:right-4"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        <Document
          file={file}
          loading={<p className="text-sm text-white/70">Cargando documento...</p>}
          error={<p className="text-sm text-white/70">No se pudo cargar el documento.</p>}
          onLoadSuccess={({ numPages }) => {
            setPageCount(numPages);
            setPageNumber(1);
          }}
        >
          <Page
            pageNumber={pageNumber}
            width={pageWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="max-w-full shadow-xl"
          />
        </Document>
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-white/10 px-4 py-3 text-sm text-white/80">
        <span aria-live="polite">
          Página {pageNumber} de {pageCount || "..."}
        </span>
      </div>
    </section>
  );
}
