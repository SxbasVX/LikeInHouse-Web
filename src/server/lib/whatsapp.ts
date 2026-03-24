import { createAuditLog } from "@/server/lib/audit";

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

export async function sendWhatsAppAlert(message: string) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;

    if (!token || !phoneId || !adminPhone) {
        console.warn("[WhatsApp] No se enviará la alerta, faltan las variables de entorno de Meta integradas (.env)");
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
                to: adminPhone,
                type: "text",
                text: { preview_url: false, body: message },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("[WhatsApp] Error de Meta API:", errorData);
            createAuditLog({ userId: "SYSTEM", action: "WHATSAPP_ERROR", entity: "WhatsApp", entityId: "alert", changes: { error: JSON.stringify(errorData) } });
            return false;
        }

        return true;
    } catch (error) {
        console.error(`[WhatsApp] Error de red inesperado al enviar alerta: ${error}`);
        createAuditLog({ userId: "SYSTEM", action: "WHATSAPP_ERROR", entity: "WhatsApp", entityId: "alert", changes: { error: String(error) } });
        return false;
    }
}

/**
 * Envía un mensaje a un cliente final.
 * NOTA DE PRODUCCIÓN: Meta exige el formato 'template' para iniciar pláticas con usuarios.
 * Por ahora usaremos 'text' para propósitos de prueba de flujo, pero requerirá
 * aprobación de plantilla en Facebook Business Manager para lanzamiento oficial.
 */
export async function sendWhatsAppToClient(phone: string, message: string) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId || !phone) {
        console.warn("[WhatsApp] No se enviará el mensaje al cliente, faltan datos o variables de entorno");
        return false;
    }

    // Limpieza básica de número (Meta exige E.164, ej: 51999888777 sin el +)
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 8) {
        const maskedPhone = cleanPhone.length > 4 ? "***" + cleanPhone.slice(-4) : "****";
        console.warn(`[WhatsApp] Número de cliente inválido: ${maskedPhone}`);
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
                to: cleanPhone,
                type: "text",
                text: { preview_url: false, body: message },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const maskedPhone = cleanPhone.length > 4 ? "***" + cleanPhone.slice(-4) : "****";
            console.error(`[WhatsApp] Error al enviar mensaje a cliente (${maskedPhone}):`, errorData);
            createAuditLog({ userId: "SYSTEM", action: "WHATSAPP_ERROR", entity: "WhatsApp", entityId: cleanPhone, changes: { error: JSON.stringify(errorData) } });
            return false;
        }

        return true;
    } catch (error) {
        console.error(`[WhatsApp] Error de red al contactar al cliente: ${error}`);
        createAuditLog({ userId: "SYSTEM", action: "WHATSAPP_ERROR", entity: "WhatsApp", entityId: cleanPhone, changes: { error: String(error) } });
        return false;
    }
}

