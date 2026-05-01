import { db } from "@/server/lib/db";
import { sendEmail } from "@/lib/mail";
import { bookingConfirmationEmail, type BookingEmailData } from "./booking-templates";

/**
 * Resuelve la URL pública raíz (sin subdominios internos como panel.*).
 * Usada para links del email y URL del logo PNG.
 */
function getPublicWebUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL || "https://likeinhouseperu.com";
  return raw.replace(/^(https?:\/\/)(panel|admin|app|dashboard|staging|dev)\./i, "$1").replace(/\/$/, "");
}

async function loadCompanyFromSettings(): Promise<BookingEmailData["company"]> {
  // Best-effort: si la DB falla seguimos con defaults
  try {
    const rows = await db.setting.findMany({
      where: {
        key: {
          in: ["phone", "contactEmail", "address", "companyLegalName", "companyRuc"],
        },
      },
      select: { key: true, value: true },
    });
    const map: Record<string, string> = {};
    for (const r of rows) {
      const v = typeof r.value === "string" ? r.value : (r.value == null ? "" : String(r.value));
      if (v) map[r.key] = v;
    }
    return {
      name: "Like In House",
      legalName: map.companyLegalName || "Like In House Peru S.R.L.",
      ruc: map.companyRuc || undefined,
      address: map.address || undefined,
      phone: map.phone || undefined,
      email: map.contactEmail || undefined,
    };
  } catch (err) {
    console.error("[Email] Settings lookup failed, using defaults:", err);
    return {
      name: "Like In House",
      legalName: "Like In House Peru S.R.L.",
    };
  }
}

export type SendBookingEmailInput = Omit<
  BookingEmailData,
  "publicWebUrl" | "logoUrl" | "company"
>;

/**
 * Envía el email de confirmación/recibo de reserva. Fire-and-forget seguro:
 * NUNCA lanza, solo logea. Llamar sin await desde la lógica de negocio.
 */
export async function sendBookingEmail(input: SendBookingEmailInput): Promise<void> {
  try {
    if (!input.clientEmail || !/.+@.+\..+/.test(input.clientEmail)) {
      console.warn("[Email] Booking email skipped: invalid recipient");
      return;
    }

    const publicWebUrl = getPublicWebUrl();
    const logoUrl = `${publicWebUrl}/Logo-Cuadrado.png`;
    const company = await loadCompanyFromSettings();

    const data: BookingEmailData = {
      ...input,
      publicWebUrl,
      logoUrl,
      company,
    };

    const { subject, html, text } = bookingConfirmationEmail(data);

    const result = await sendEmail({
      to: input.clientEmail,
      subject,
      html,
      text,
      trustedHtml: true,
      replyTo: company.email,
    });

    if (result.error) {
      console.error("[Email] Booking email failed:", result.error);
    } else {
      console.log("[Email] Booking email sent:", input.referenceCode, "->", input.clientEmail);
    }
  } catch (err) {
    console.error("[Email] Booking email exception:", err);
  }
}
