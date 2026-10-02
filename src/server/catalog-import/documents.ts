export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_DOCUMENTS = 5;

export function allowedDocumentUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const cloud = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    return Boolean(cloud) && url.protocol === "https:" && url.hostname === "res.cloudinary.com" && !url.username && !url.password && !url.port &&
      url.pathname.startsWith(`/${cloud}/raw/upload/`) && url.pathname.includes("/likesinhouse/catalog-imports/") && url.pathname.toLowerCase().endsWith(".pdf") && !url.search;
  } catch { return false; }
}

export async function downloadCatalogPdf(sourceUrl: string): Promise<Buffer> {
  if (!allowedDocumentUrl(sourceUrl)) throw new Error("Origen del documento no permitido.");
  const response = await fetch(sourceUrl, { redirect: "error", signal: AbortSignal.timeout(25_000) });
  if (!response.ok) throw new Error(`Cloudinary rechazó el PDF (HTTP ${response.status}).`);
  if (!response.body) throw new Error("Cloudinary respondió sin contenido.");
  if (Number(response.headers.get("content-length") ?? 0) > MAX_PDF_BYTES) {
    await response.body.cancel(); throw new Error("El PDF supera 20 MB.");
  }
  const reader = response.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PDF_BYTES) throw new Error("El PDF supera 20 MB.");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const pdf = Buffer.concat(chunks);
  assertPdf(pdf);
  return pdf;
}

export function assertPdf(pdf: Buffer): void {
  if (pdf.length > MAX_PDF_BYTES || pdf.subarray(0, 5).toString() !== "%PDF-") throw new Error("PDF inválido o mayor de 20 MB.");
}
