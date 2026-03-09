import { createAuditLog } from "@/server/lib/audit";

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
        console.warn(`[WhatsApp] Número de cliente inválido: ${phone}`);
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
            console.error(`[WhatsApp] Error al enviar mensaje a cliente (${cleanPhone}):`, errorData);
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

