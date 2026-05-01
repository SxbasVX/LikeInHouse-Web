/**
 * HTML email templates for booking-related notifications.
 * Visualmente alineadas con la paleta de marca y el voucher PDF.
 *
 * Diseñadas tabla-based para máxima compatibilidad con clientes de email
 * (Outlook 2016+, Gmail, Apple Mail, Yahoo).
 */

const c = {
  orange:    "#e8411d",
  darkRed:   "#1C0D0C",
  teal:      "#2a6f6f",
  cream:     "#f5efe7",
  creamSoft: "#faf7f2",
  white:     "#ffffff",
  text:      "#1a1a1a",
  textSoft:  "#3a3a3a",
  muted:     "#6b7280",
  border:    "#e5ddd3",
  success:   "#dcfce7",
  successFg: "#15803d",
  warning:   "#fef3c7",
  warningFg: "#a16207",
};

export interface BookingEmailData {
  // Comprobante
  referenceCode: string;
  type: "RESERVATION" | "PAYMENT_LINK";

  // Servicio
  serviceName: string;
  serviceDescription?: string | null;
  serviceImageUrl?: string | null;
  serviceDestination?: string | null;
  serviceDurationLabel?: string | null;
  serviceIncludes?: string[];

  // Cliente
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;

  // Pago
  amountPaid: number;
  totalAmount: number;
  currency: string;

  // Detalles del viaje
  dateStr: string;
  adults?: number;
  children?: number;

  // Estado del email
  isPaid: boolean;             // true = bienvenida + pagado, false = pending
  paymentInstructions?: string | null;

  // Branding (resuelto en el caller)
  isEs: boolean;
  publicWebUrl: string;        // ej "https://likeinhouseperu.com"
  logoUrl: string;             // PNG
  company: {
    name: string;
    legalName?: string;
    ruc?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pill(label: string, value: string): string {
  return `
    <td valign="middle" style="padding:6px 10px;background:#ffffff;border-radius:16px;font-family:Arial,Helvetica,sans-serif;">
      <span style="font-size:9px;color:${c.muted};letter-spacing:1.2px;text-transform:uppercase;font-weight:bold;">${escapeHtml(label)}</span>
      <span style="font-size:13px;color:${c.darkRed};font-weight:bold;margin-left:6px;">${escapeHtml(value)}</span>
    </td>`;
}

export function bookingConfirmationEmail(data: BookingEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    isEs,
    isPaid,
    referenceCode,
    serviceName,
    serviceDescription,
    serviceImageUrl,
    serviceDestination,
    serviceDurationLabel,
    serviceIncludes,
    clientName,
    amountPaid,
    totalAmount,
    currency,
    dateStr,
    adults,
    children,
    paymentInstructions,
    publicWebUrl,
    logoUrl,
    company,
  } = data;

  const currSym = currency === "PEN" ? "S/" : "$";
  const pending = Math.max(0, totalAmount - amountPaid);
  const totalPax = (adults || 0) + (children || 0);
  const includes = (serviceIncludes || []).filter(Boolean).slice(0, 8);

  const subject = isPaid
    ? (isEs
        ? `✓ Reserva confirmada · ${serviceName} · ${referenceCode}`
        : `✓ Booking confirmed · ${serviceName} · ${referenceCode}`)
    : (isEs
        ? `Solicitud recibida · ${serviceName} · ${referenceCode}`
        : `Request received · ${serviceName} · ${referenceCode}`);

  const heroTitle = isPaid
    ? (isEs ? "¡Listo! Tu reserva está confirmada" : "Your booking is confirmed")
    : (isEs ? "Hemos recibido tu solicitud" : "We received your request");

  const heroSub = isPaid
    ? (isEs
        ? `Estamos preparando todo para tu próxima aventura. Aquí está tu comprobante.`
        : `We are getting everything ready for your next adventure. Here is your voucher.`)
    : (isEs
        ? `Para confirmar tu reserva necesitamos completar el pago. Te dejamos los detalles abajo.`
        : `To confirm your booking we need to complete the payment. Details below.`);

  // Pills row
  const pillsHtml = `
    <table cellpadding="0" cellspacing="6" border="0">
      <tr>
        ${pill(isEs ? "Ref" : "Ref", referenceCode)}
        ${pill(isEs ? "Fecha" : "Date", dateStr || (isEs ? "A coordinar" : "TBD"))}
        ${totalPax > 0 ? pill(isEs ? "Pasajeros" : "Passengers", String(totalPax)) : ""}
        ${serviceDurationLabel ? pill(isEs ? "Duración" : "Duration", serviceDurationLabel) : ""}
        ${serviceDestination ? pill(isEs ? "Destino" : "Destination", serviceDestination) : ""}
      </tr>
    </table>`;

  // Includes list
  const includesHtml = includes.length === 0 ? "" : `
    <tr>
      <td style="padding:0 32px 24px;">
        <div style="background:${c.creamSoft};border:1px solid ${c.border};border-radius:10px;padding:20px;">
          <div style="font-size:14px;font-weight:bold;color:${c.darkRed};margin-bottom:12px;">
            ${isEs ? "✓ Qué incluye tu experiencia" : "✓ What your experience includes"}
          </div>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${includes
              .map(
                (it, i) => `
                  <tr>
                    <td valign="top" width="20" style="padding:4px 0;color:${c.teal};font-weight:bold;font-size:14px;">✓</td>
                    <td valign="top" style="padding:4px 0;color:${c.textSoft};font-size:13px;line-height:1.5;">${escapeHtml(it)}</td>
                  </tr>`
              )
              .join("")}
          </table>
        </div>
      </td>
    </tr>`;

  // Status badge
  const statusBadge = isPaid
    ? `<span style="display:inline-block;background:${c.success};color:${c.successFg};font-size:11px;font-weight:bold;padding:4px 12px;border-radius:999px;letter-spacing:0.5px;">✓ ${isEs ? "CONFIRMADO" : "CONFIRMED"}</span>`
    : `<span style="display:inline-block;background:${c.warning};color:${c.warningFg};font-size:11px;font-weight:bold;padding:4px 12px;border-radius:999px;letter-spacing:0.5px;">⏱ ${isEs ? "PENDIENTE" : "PENDING"}</span>`;

  // Payment instructions block (only when not paid)
  const paymentBlock = isPaid ? "" : `
    <tr>
      <td style="padding:0 32px 24px;">
        <div style="background:#fffbf0;border:1px solid #f5e4a0;border-radius:10px;padding:18px;">
          <div style="font-size:14px;font-weight:bold;color:${c.warningFg};margin-bottom:8px;">
            ${isEs ? "📌 Próximos pasos" : "📌 Next steps"}
          </div>
          <p style="margin:0;font-size:13px;color:${c.textSoft};line-height:1.6;">
            ${isEs
              ? `Para completar tu reserva, escríbenos por WhatsApp${company.phone ? ` al <strong>${escapeHtml(company.phone)}</strong>` : ""} con tu código <strong>${escapeHtml(referenceCode)}</strong>. Te enviaremos el link de pago seguro y resolveremos cualquier consulta.`
              : `To finalize your booking, contact us via WhatsApp${company.phone ? ` at <strong>${escapeHtml(company.phone)}</strong>` : ""} with your code <strong>${escapeHtml(referenceCode)}</strong>. We will share the secure payment link and answer any questions.`}
          </p>
          ${paymentInstructions ? `<p style="margin:12px 0 0;font-size:13px;color:${c.textSoft};line-height:1.6;">${escapeHtml(paymentInstructions)}</p>` : ""}
        </div>
      </td>
    </tr>`;

  // Service hero block
  const serviceImageBlock = serviceImageUrl
    ? `<tr><td style="padding:0;"><img src="${serviceImageUrl}" alt="${escapeHtml(serviceName)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;max-height:240px;object-fit:cover;border-radius:0;" /></td></tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="${isEs ? "es" : "en"}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3efe9;font-family:Arial,Helvetica,sans-serif;color:${c.text};">
  <!-- Preheader (hidden) -->
  <div style="display:none;font-size:1px;color:#f3efe9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${isPaid
      ? (isEs ? `Tu reserva ${referenceCode} está confirmada. ¡Nos vemos pronto!` : `Your booking ${referenceCode} is confirmed. See you soon!`)
      : (isEs ? `Recibimos tu solicitud ${referenceCode}. Faltan unos pasos para confirmar.` : `We received your request ${referenceCode}. A few steps to confirm.`)}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f3efe9" style="background:#f3efe9;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;background:${c.white};border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">

          <!-- Top accent bar -->
          <tr><td style="height:6px;background:${c.orange};line-height:6px;font-size:0;">&nbsp;</td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td valign="middle" style="padding:0;">
                    <img src="${logoUrl}" alt="Like In House" height="56" style="display:block;height:56px;width:auto;border:0;" />
                  </td>
                  <td valign="middle" align="right" style="padding:0;">
                    <div style="display:inline-block;background:${c.creamSoft};border-left:3px solid ${c.orange};border-radius:8px;padding:10px 14px;text-align:right;">
                      <div style="font-size:9px;color:${c.muted};letter-spacing:2px;text-transform:uppercase;">${isEs ? "Comprobante" : "Voucher"}</div>
                      <div style="font-size:16px;color:${c.orange};font-weight:bold;letter-spacing:0.5px;">${escapeHtml(referenceCode)}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="padding:0 32px;"><div style="height:1px;background:${c.orange};opacity:0.4;"></div></td></tr>

          <!-- Hero -->
          <tr>
            <td style="padding:28px 32px 16px;">
              <h1 style="margin:0 0 8px;font-size:24px;line-height:1.2;color:${c.darkRed};font-weight:bold;">${escapeHtml(heroTitle)}</h1>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:${c.textSoft};">
                ${isEs ? "Hola" : "Hi"} <strong>${escapeHtml(clientName)}</strong>,
              </p>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:${c.textSoft};">
                ${escapeHtml(heroSub)}
              </p>
              <div style="margin-top:8px;">${statusBadge}</div>
            </td>
          </tr>

          <!-- Service hero -->
          <tr>
            <td style="padding:0 32px 16px;">
              <div style="background:${c.cream};border-radius:12px;overflow:hidden;">
                ${serviceImageBlock ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="padding:0;"><img src="${serviceImageUrl}" alt="${escapeHtml(serviceName)}" width="600" style="display:block;width:100%;max-width:560px;height:auto;max-height:220px;object-fit:cover;" /></td></tr></table>` : ""}
                <div style="padding:20px 22px;">
                  <div style="font-size:10px;color:${c.orange};letter-spacing:2px;text-transform:uppercase;font-weight:bold;margin-bottom:6px;">${isEs ? "Servicio Contratado" : "Contracted Service"}</div>
                  <div style="font-size:20px;font-weight:bold;color:${c.darkRed};line-height:1.2;margin-bottom:${serviceDescription ? "8px" : "12px"};">${escapeHtml(serviceName)}</div>
                  ${serviceDescription ? `<p style="margin:0 0 14px;font-size:13px;color:${c.textSoft};line-height:1.5;">${escapeHtml(serviceDescription)}</p>` : ""}
                  ${pillsHtml}
                </div>
              </div>
            </td>
          </tr>

          ${includesHtml}

          ${paymentBlock}

          <!-- Payment summary -->
          <tr>
            <td style="padding:0 32px 24px;">
              <div style="font-size:10px;color:${c.orange};letter-spacing:2px;text-transform:uppercase;font-weight:bold;margin-bottom:8px;">${isEs ? "Resumen de Pago" : "Payment Summary"}</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid ${c.border};border-radius:12px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-size:13px;color:${c.muted};">${escapeHtml(serviceName)}</td>
                        <td align="right" style="font-size:13px;color:${c.text};font-weight:bold;">${currSym} ${totalAmount.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="padding:0 18px;"><div style="height:1px;background:${c.border};"></div></td></tr>
                <tr>
                  <td style="padding:14px 18px;">
                    <div style="background:${c.cream};border-radius:8px;padding:14px 16px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="font-size:15px;color:${c.darkRed};font-weight:bold;">${isPaid ? (isEs ? "Total Pagado" : "Total Paid") : (isEs ? "Pagado a Cuenta" : "Paid So Far")}</td>
                          <td align="right" style="font-size:22px;color:${c.orange};font-weight:bold;">${currSym} ${amountPaid.toFixed(2)}</td>
                        </tr>
                      </table>
                    </div>
                    ${pending > 0.01 ? `
                      <div style="margin-top:10px;background:#fffbf0;border:1px solid #f5e4a0;border-radius:8px;padding:12px 14px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td style="font-size:12px;color:${c.warningFg};font-weight:bold;">${isEs ? "Saldo Pendiente" : "Pending Balance"}</td>
                            <td align="right" style="font-size:14px;color:${c.warningFg};font-weight:bold;">${currSym} ${pending.toFixed(2)}</td>
                          </tr>
                        </table>
                      </div>
                    ` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA WhatsApp -->
          ${company.phone ? `
          <tr>
            <td align="center" style="padding:0 32px 24px;">
              <a href="https://wa.me/${company.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent((isEs ? "Hola, escribo por mi reserva " : "Hi, I'm writing about my booking ") + referenceCode)}"
                 style="display:inline-block;background:#25D366;color:#ffffff;font-weight:bold;font-size:14px;text-decoration:none;padding:12px 26px;border-radius:999px;">
                ${isEs ? "Escribir por WhatsApp" : "Message us on WhatsApp"}
              </a>
            </td>
          </tr>` : ""}

          <!-- Footer -->
          <tr>
            <td style="padding:0;">
              <div style="background:${c.darkRed};color:${c.white};padding:20px 32px;font-family:Arial,Helvetica,sans-serif;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td valign="top" style="padding:0;">
                      <div style="font-size:14px;font-weight:bold;color:${c.white};margin-bottom:4px;">${escapeHtml(company.legalName || company.name)}</div>
                      <div style="font-size:11px;color:rgba(255,255,255,0.55);line-height:1.5;">
                        ${isEs ? "Agencia de viajes y turismo · Perú" : "Travel & tourism agency · Peru"}
                        ${company.ruc ? ` · RUC ${escapeHtml(company.ruc)}` : ""}
                        ${company.address ? `<br/>${escapeHtml(company.address)}` : ""}
                      </div>
                    </td>
                    <td valign="top" align="right" style="padding:0;">
                      <a href="${publicWebUrl}" style="font-size:12px;color:${c.orange};font-weight:bold;text-decoration:none;display:block;margin-bottom:3px;">${escapeHtml(publicWebUrl.replace(/^https?:\/\//, ""))}</a>
                      ${company.email ? `<a href="mailto:${escapeHtml(company.email)}" style="font-size:12px;color:${c.white};text-decoration:none;display:block;margin-bottom:3px;">${escapeHtml(company.email)}</a>` : ""}
                      ${company.phone ? `<div style="font-size:12px;color:${c.white};font-weight:bold;">${escapeHtml(company.phone)}</div>` : ""}
                    </td>
                  </tr>
                </table>
                <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);font-size:10px;color:rgba(255,255,255,0.4);text-align:center;">
                  ${isEs ? `© ${new Date().getFullYear()} ${escapeHtml(company.name)}. Todos los derechos reservados.` : `© ${new Date().getFullYear()} ${escapeHtml(company.name)}. All rights reserved.`}
                </div>
              </div>
              <div style="height:4px;background:${c.orange};line-height:4px;font-size:0;">&nbsp;</div>
            </td>
          </tr>

        </table>

        <!-- Disclaimer -->
        <p style="margin:14px 0 0;font-size:11px;color:#9ca3af;max-width:560px;text-align:center;line-height:1.5;">
          ${isEs
            ? "Este correo es una constancia de tu reserva. Si no esperabas este mensaje, puedes ignorarlo."
            : "This email is a record of your reservation. If you weren't expecting it, you can ignore it."}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Plain-text fallback
  const text = [
    isPaid
      ? (isEs ? `Tu reserva está confirmada — ${serviceName}` : `Your booking is confirmed — ${serviceName}`)
      : (isEs ? `Recibimos tu solicitud — ${serviceName}` : `We received your request — ${serviceName}`),
    "",
    `${isEs ? "Código" : "Code"}: ${referenceCode}`,
    `${isEs ? "Fecha" : "Date"}: ${dateStr || (isEs ? "A coordinar" : "TBD")}`,
    totalPax > 0 ? `${isEs ? "Pasajeros" : "Passengers"}: ${totalPax}` : "",
    serviceDestination ? `${isEs ? "Destino" : "Destination"}: ${serviceDestination}` : "",
    serviceDurationLabel ? `${isEs ? "Duración" : "Duration"}: ${serviceDurationLabel}` : "",
    "",
    `${isEs ? "Total" : "Total"}: ${currSym} ${totalAmount.toFixed(2)}`,
    `${isEs ? "Pagado" : "Paid"}: ${currSym} ${amountPaid.toFixed(2)}`,
    pending > 0.01 ? `${isEs ? "Saldo pendiente" : "Pending"}: ${currSym} ${pending.toFixed(2)}` : "",
    "",
    company.phone ? (isEs ? `Contacto: WhatsApp ${company.phone}` : `Contact: WhatsApp ${company.phone}`) : "",
    publicWebUrl,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}
