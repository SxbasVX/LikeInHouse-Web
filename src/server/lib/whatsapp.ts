import { createAuditLog } from "@/server/lib/audit";
import { db } from "@/server/lib/db";

export const OWNER_PHONES_SETTING_KEY = "owner.whatsapp_phones";

/**
 * Lee la lista de teléfonos de dueños desde Settings (editable en /admin/contenido → Configuración).
 * Si no hay ningún número configurado, cae al legacy WHATSAPP_ADMIN_PHONE como fallback.
 * Retorna siempre array limpio (solo dígitos, no vacío).
 */
export async function getOwnerPhones(): Promise<string[]> {
  try {
    const setting = await db.setting.findUnique({
      where: { key: OWNER_PHONES_SETTING_KEY },
      select: { value: true },
    });
    if (setting) {
      let list: unknown[] = [];
      if (Array.isArray(setting.value)) {
        list = setting.value;
      } else if (typeof setting.value === "string") {
        list = setting.value.split(/[,\s\n]+/);
      }
      const cleaned = list
        .map((v) => String(v).replace(/\D/g, ""))
        .filter((v) => v.length >= 8);
      if (cleaned.length > 0) return cleaned;
    }
  } catch (err) {
    console.error("[WhatsApp] No se pudo leer owner.whatsapp_phones:", err);
  }

  const fallback = (process.env.WHATSAPP_ADMIN_PHONE || "").replace(/\D/g, "");
  return fallback.length >= 8 ? [fallback] : [];
}

// Structured booking event for consistent notifications
export interface BookingEvent {
  type: "NEW_BOOKING";
  referenceCode: string;
  tourName: string;
  clientName: string;
  date?: string;
  people: number;
  totalAmount: number;
  currency: string;
  origin: "WEB" | "MANUAL" | "QUOTATION" | "PAYMENT_LINK";
  paymentStatus: "paid" | "pending";
}

/**
 * Sends a structured booking notification to the admin.
 * Formats the BookingEvent into a readable WhatsApp message.
 * Failures are silent — never breaks the booking flow.
 */
export function sendBookingNotification(event: BookingEvent): Promise<boolean> {
  const originLabels: Record<string, string> = {
    WEB: "Web Pública",
    MANUAL: "Manual (Admin)",
    QUOTATION: "Cotización",
    PAYMENT_LINK: "Link de Pago",
  };

  const statusIcon = event.paymentStatus === "paid" ? "✅" : "⏳";
  const lines = [
    `🔔 *Nueva Reserva — ${originLabels[event.origin] || event.origin}*`,
    `Ref: ${event.referenceCode}`,
    `Tour: ${event.tourName}`,
    `Cliente: ${event.clientName}`,
    `Pasajeros: ${event.people}`,
    `Monto: ${event.currency} ${event.totalAmount.toFixed(2)}`,
    `Pago: ${statusIcon} ${event.paymentStatus === "paid" ? "Pagado" : "Pendiente"}`,
  ];
  if (event.date) lines.push(`Fecha: ${event.date}`);

  return sendWhatsAppAlert(lines.join("\n")).catch((err) => {
    console.error("[WhatsApp] Error en sendBookingNotification:", err);
    return false;
  });
}

async function sendWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            return response;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < maxRetries) {
                await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            }
        }
    }
    throw lastError;
}

/**
 * Envía un mensaje a un número específico vía Meta Cloud API.
 * Helper interno con retry + auditoría. No valida cuál es el destinatario.
 */
async function sendToPhone(phone: string, message: string): Promise<boolean> {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token || !phoneId) {
        console.warn("[WhatsApp] Faltan WHATSAPP_TOKEN o WHATSAPP_PHONE_ID en env");
        return false;
    }
    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    try {
        const response = await sendWithRetry(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: phone,
                type: "text",
                text: { preview_url: false, body: message },
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            const masked = phone.length > 4 ? "***" + phone.slice(-4) : "****";
            console.error(`[WhatsApp] Error de Meta API (${masked}):`, errorData);
            createAuditLog({ userId: "SYSTEM", action: "WHATSAPP_ERROR", entity: "WhatsApp", entityId: masked, changes: { error: JSON.stringify(errorData) } });
            return false;
        }
        return true;
    } catch (error) {
        const masked = phone.length > 4 ? "***" + phone.slice(-4) : "****";
        console.error(`[WhatsApp] Error de red (${masked}): ${error}`);
        createAuditLog({ userId: "SYSTEM", action: "WHATSAPP_ERROR", entity: "WhatsApp", entityId: masked, changes: { error: String(error) } });
        return false;
    }
}

/**
 * Envía una alerta a TODOS los dueños configurados en Settings.
 * Si no hay dueños configurados, cae a WHATSAPP_ADMIN_PHONE (legacy).
 * No rompe el flujo si Meta falla: siempre resuelve (solo devuelve false).
 */
export async function sendWhatsAppAlert(message: string): Promise<boolean> {
    const phones = await getOwnerPhones();
    if (phones.length === 0) {
        console.warn("[WhatsApp] No se enviará la alerta: no hay dueños configurados ni WHATSAPP_ADMIN_PHONE");
        return false;
    }
    const results = await Promise.all(phones.map((p) => sendToPhone(p, message)));
    return results.some(Boolean);
}

/**
 * Envía un mensaje a un cliente final.
 * NOTA DE PRODUCCIÓN: Meta exige el formato 'template' para iniciar pláticas con usuarios.
 * Por ahora usaremos 'text' para propósitos de prueba de flujo, pero requerirá
 * aprobación de plantilla en Facebook Business Manager para lanzamiento oficial.
 */
export async function sendWhatsAppToClient(phone: string, message: string): Promise<boolean> {
    if (!phone) {
        console.warn("[WhatsApp] No se enviará al cliente: falta número");
        return false;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 8) {
        console.warn("[WhatsApp] Número de cliente inválido");
        return false;
    }
    return sendToPhone(cleanPhone, message);
}

