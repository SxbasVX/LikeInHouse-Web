import "server-only";
import type { Prisma, PrismaClient, QuoteRequest } from "@prisma/client";
import { sendCrmLead, type CrmLead } from "./crm";

type Db = PrismaClient | Prisma.TransactionClient;

export const TRAVEL_WINDOW_LABELS: Record<string, string> = {
  this_month: "Este mes",
  "1_3_months": "En 1 a 3 meses",
  "3_6_months": "En 3 a 6 meses",
  undecided: "Aún no lo sabe",
  exact: "Fechas exactas",
};

const toIsoDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : undefined);

export function buildCrmLead(qr: QuoteRequest): CrmLead {
  const when = qr.travelWindow && qr.travelWindow !== "exact" ? TRAVEL_WINDOW_LABELS[qr.travelWindow] : undefined;
  return {
    nombre: qr.name,
    telefono: qr.phone ?? undefined,
    correo: qr.email ?? undefined,
    destino: qr.destination ?? undefined,
    fecha_salida: toIsoDate(qr.departureDate),
    fecha_retorno: toIsoDate(qr.returnDate),
    adultos: qr.adults,
    ninos: qr.children,
    infantes: qr.infants,
    mensaje: [when && `Cuándo viaja: ${when}`, qr.message].filter(Boolean).join("\n") || undefined,
    tour: qr.tourName ?? undefined,
    idioma: qr.locale,
  };
}

/**
 * Busca o crea el cliente para que la base propia tenga los mismos contactos que el CRM.
 * Con correo: se crea/actualiza por correo (es único). Solo con WhatsApp: se vincula si ya
 * existe un cliente con ese teléfono; si no, los datos quedan en la propia solicitud.
 */
export async function linkQuoteRequestClient(
  db: Db,
  contact: { name: string; email?: string | null; phone?: string | null; locale: string }
): Promise<string | null> {
  if (contact.email) {
    const email = contact.email.toLowerCase();
    const existing = await db.client.findUnique({ where: { email } });
    if (existing) {
      if (!existing.phone && contact.phone) {
        await db.client.update({ where: { id: existing.id }, data: { phone: contact.phone } });
      }
      return existing.id;
    }
    const created = await db.client.create({
      data: { email, firstName: contact.name, lastName: "", phone: contact.phone || null, language: contact.locale },
    });
    return created.id;
  }
  if (contact.phone) {
    const byPhone = await db.client.findFirst({ where: { phone: contact.phone }, select: { id: true } });
    return byPhone?.id ?? null;
  }
  return null;
}

/** Envía la solicitud al CRM y guarda el resultado. Nunca lanza. */
export async function syncQuoteRequestToCrm(db: Db, quoteRequest: QuoteRequest) {
  const result = await sendCrmLead(buildCrmLead(quoteRequest));
  return db.quoteRequest.update({
    where: { id: quoteRequest.id },
    data: result.ok
      ? { crmStatus: "SENT", crmError: null, crmSyncedAt: new Date(), crmAttempts: { increment: 1 } }
      : {
          crmStatus: result.disabled ? "DISABLED" : "FAILED",
          crmError: result.error,
          crmAttempts: { increment: result.disabled ? 0 : 1 },
        },
  });
}
