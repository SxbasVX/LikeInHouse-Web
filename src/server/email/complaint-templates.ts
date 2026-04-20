/**
 * Plantillas de email para el Libro de Reclamaciones (INDECOPI).
 * Cumple con D.S. 011-2011-PCM: confirmación al consumidor y notificación al proveedor.
 */

interface ComplaintEmailData {
  code: string;
  consumerName: string;
  consumerEmail: string;
  consumerDocType: string;
  consumerDocNum: string;
  consumerAddress: string;
  consumerPhone?: string | null;
  itemType: "PRODUCTO" | "SERVICIO";
  itemDescription: string;
  amountClaimed?: number | null;
  currency: string;
  type: "RECLAMO" | "QUEJA";
  detail: string;
  request: string;
  createdAt: Date;
}

const BRAND = "Like In House Peru";
const BRAND_EMAIL = "administracion@likeinhouseperu.com";

function formatDate(d: Date, locale = "es-PE") {
  return d.toLocaleString(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Lima",
  });
}

function typeLabel(t: "RECLAMO" | "QUEJA", locale: "es" | "en" = "es") {
  if (locale === "en") return t === "RECLAMO" ? "Complaint (Reclamo)" : "Grievance (Queja)";
  return t === "RECLAMO" ? "Reclamo" : "Queja";
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Email de confirmación enviado al consumidor */
export function consumerConfirmationEmail(data: ComplaintEmailData, locale: "es" | "en" = "es") {
  const isEs = locale === "es";
  const subject = isEs
    ? `Constancia de ${data.type === "RECLAMO" ? "Reclamo" : "Queja"} - ${data.code}`
    : `Complaint Book Receipt - ${data.code}`;

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111;">
    <div style="background: #0f172a; color: #fff; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 22px;">${isEs ? "Libro de Reclamaciones" : "Complaint Book"}</h1>
      <p style="margin: 8px 0 0; opacity: 0.85;">${BRAND}</p>
    </div>
    <div style="padding: 24px;">
      <p>${isEs ? `Estimado(a)` : `Dear`} <strong>${escapeHtml(data.consumerName)}</strong>,</p>
      <p>${isEs
        ? `Le confirmamos que hemos recibido su ${typeLabel(data.type)} a través de nuestro Libro de Reclamaciones virtual.`
        : `We confirm we have received your ${typeLabel(data.type, "en")} through our virtual Complaint Book.`}</p>

      <div style="background: #f1f5f9; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0;">
        <p style="margin: 0;"><strong>${isEs ? "Código" : "Code"}:</strong> ${data.code}</p>
        <p style="margin: 4px 0 0;"><strong>${isEs ? "Fecha" : "Date"}:</strong> ${formatDate(data.createdAt, isEs ? "es-PE" : "en-US")}</p>
        <p style="margin: 4px 0 0;"><strong>${isEs ? "Tipo" : "Type"}:</strong> ${typeLabel(data.type, locale)}</p>
      </div>

      <h3 style="margin-top: 24px; color: #0f172a;">${isEs ? "Detalle registrado" : "Recorded details"}</h3>
      <p><strong>${isEs ? "Bien/Servicio" : "Product/Service"}:</strong> ${data.itemType}<br/>${escapeHtml(data.itemDescription)}</p>
      ${data.amountClaimed ? `<p><strong>${isEs ? "Monto reclamado" : "Amount claimed"}:</strong> ${data.currency} ${data.amountClaimed.toFixed(2)}</p>` : ""}
      <p><strong>${isEs ? "Descripción" : "Description"}:</strong><br/>${escapeHtml(data.detail)}</p>
      <p><strong>${isEs ? "Pedido del consumidor" : "Consumer's request"}:</strong><br/>${escapeHtml(data.request)}</p>

      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 6px;">
        <p style="margin: 0; font-size: 14px;">${isEs
          ? `De acuerdo al D.S. 011-2011-PCM, el proveedor dará respuesta en un plazo no mayor a <strong>treinta (30) días calendario</strong>, contados desde la presente fecha.`
          : `In accordance with D.S. 011-2011-PCM, the provider will respond within no more than <strong>thirty (30) calendar days</strong>, counted from this date.`}
        </p>
      </div>

      <p style="font-size: 13px; color: #475569;">${isEs
        ? `La formulación del reclamo o queja no impide acudir a otras vías de solución de controversias, ni es requisito previo para interponer una denuncia ante el INDECOPI.`
        : `Filing a complaint or grievance does not prevent you from seeking other dispute resolution channels, nor is it a prerequisite to file a complaint with INDECOPI.`}</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
      <p style="font-size: 12px; color: #64748b; text-align: center;">
        ${BRAND} · ${BRAND_EMAIL}
      </p>
    </div>
  </div>`;

  return { subject, html };
}

/** Email de notificación enviado al proveedor (admin) */
export function providerNotificationEmail(data: ComplaintEmailData) {
  const subject = `[Libro de Reclamaciones] Nuevo ${data.type === "RECLAMO" ? "Reclamo" : "Queja"} - ${data.code}`;

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111;">
    <div style="background: #b91c1c; color: #fff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 20px;">Nuevo registro en el Libro de Reclamaciones</h1>
    </div>
    <div style="padding: 24px;">
      <p><strong>Código:</strong> ${data.code}</p>
      <p><strong>Tipo:</strong> ${typeLabel(data.type)}</p>
      <p><strong>Fecha:</strong> ${formatDate(data.createdAt)}</p>

      <h3 style="margin-top: 20px; color: #0f172a;">Datos del consumidor</h3>
      <p>
        <strong>${escapeHtml(data.consumerName)}</strong><br/>
        ${data.consumerDocType}: ${escapeHtml(data.consumerDocNum)}<br/>
        ${escapeHtml(data.consumerAddress)}<br/>
        ${escapeHtml(data.consumerEmail)}${data.consumerPhone ? ` · ${escapeHtml(data.consumerPhone)}` : ""}
      </p>

      <h3 style="margin-top: 20px; color: #0f172a;">Bien / Servicio contratado</h3>
      <p><strong>Tipo:</strong> ${data.itemType}</p>
      <p>${escapeHtml(data.itemDescription)}</p>
      ${data.amountClaimed ? `<p><strong>Monto reclamado:</strong> ${data.currency} ${data.amountClaimed.toFixed(2)}</p>` : ""}

      <h3 style="margin-top: 20px; color: #0f172a;">Detalle del ${data.type === "RECLAMO" ? "reclamo" : "queja"}</h3>
      <p>${escapeHtml(data.detail)}</p>

      <h3 style="margin-top: 20px; color: #0f172a;">Pedido del consumidor</h3>
      <p>${escapeHtml(data.request)}</p>

      <div style="background: #fee2e2; border: 1px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 6px;">
        <p style="margin: 0; font-size: 14px;"><strong>Plazo máximo de respuesta:</strong> 30 días calendario (D.S. 011-2011-PCM).</p>
        <p style="margin: 8px 0 0; font-size: 14px;">Responder desde el panel admin: <strong>/admin/reclamaciones</strong></p>
      </div>
    </div>
  </div>`;

  return { subject, html };
}

/** Email cuando el proveedor responde al reclamo */
export function consumerResponseEmail(
  data: ComplaintEmailData & { response: string; status: string },
  locale: "es" | "en" = "es"
) {
  const isEs = locale === "es";
  const subject = isEs
    ? `Respuesta a su ${data.type === "RECLAMO" ? "Reclamo" : "Queja"} - ${data.code}`
    : `Response to your ${typeLabel(data.type, "en")} - ${data.code}`;

  const statusLabel: Record<string, string> = {
    PENDIENTE: isEs ? "Pendiente" : "Pending",
    EN_PROCESO: isEs ? "En Proceso" : "In Process",
    RESUELTO: isEs ? "Resuelto" : "Resolved",
    RECHAZADO: isEs ? "Rechazado" : "Rejected",
  };

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111;">
    <div style="background: #0f172a; color: #fff; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 22px;">${isEs ? "Respuesta del proveedor" : "Provider response"}</h1>
      <p style="margin: 8px 0 0; opacity: 0.85;">${BRAND}</p>
    </div>
    <div style="padding: 24px;">
      <p>${isEs ? `Estimado(a)` : `Dear`} <strong>${escapeHtml(data.consumerName)}</strong>,</p>
      <p>${isEs
        ? `Le remitimos la respuesta a su ${typeLabel(data.type)} con código <strong>${data.code}</strong>.`
        : `We provide the response to your ${typeLabel(data.type, "en")} with code <strong>${data.code}</strong>.`}</p>

      <div style="background: #f1f5f9; border-left: 4px solid #0ea5e9; padding: 16px; margin: 16px 0;">
        <p style="margin: 0;"><strong>${isEs ? "Estado" : "Status"}:</strong> ${statusLabel[data.status] || data.status}</p>
      </div>

      <h3 style="margin-top: 24px; color: #0f172a;">${isEs ? "Respuesta" : "Response"}</h3>
      <p style="white-space: pre-wrap;">${escapeHtml(data.response)}</p>

      <p style="font-size: 13px; color: #475569; margin-top: 24px;">${isEs
        ? `Si considera que su reclamo no ha sido resuelto satisfactoriamente, puede acudir al INDECOPI o a otros mecanismos de solución de controversias.`
        : `If you consider your complaint was not resolved satisfactorily, you may contact INDECOPI or other dispute resolution mechanisms.`}</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"/>
      <p style="font-size: 12px; color: #64748b; text-align: center;">
        ${BRAND} · ${BRAND_EMAIL}
      </p>
    </div>
  </div>`;

  return { subject, html };
}
