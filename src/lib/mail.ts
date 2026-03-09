import { Resend } from "resend";
import { sanitizeHtml } from "@/server/lib/sanitize";

const globalForResend = globalThis as unknown as { resend: Resend | null };

function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null;
    if (!globalForResend.resend) {
        globalForResend.resend = new Resend(process.env.RESEND_API_KEY);
    }
    return globalForResend.resend;
}

export const sendEmail = async ({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) => {
    const resend = getResend();
    if (!resend) {
        console.error("[Email] RESEND_API_KEY not configured, skipping email send");
        return { data: null, error: { message: "Email not configured" } };
    }

    const from = process.env.EMAIL_FROM || "Cotizaciones Like In House <ventas@tudominio.com>";

    // Sanitize HTML to prevent injection via user-supplied data
    const safeHtml = sanitizeHtml(html);

    return await resend.emails.send({
        from,
        to,
        subject,
        html: safeHtml,
    });
};
