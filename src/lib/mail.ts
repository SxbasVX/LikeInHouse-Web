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
    text,
    replyTo,
    trustedHtml,
}: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    /**
     * Set to true ONLY when html is fully built by our own code (no user-supplied
     * HTML). Skips sanitization so inline `style` attrs (needed for email clients)
     * survive. NEVER set to true with HTML that interpolates raw user input.
     */
    trustedHtml?: boolean;
}) => {
    const resend = getResend();
    if (!resend) {
        console.error("[Email] RESEND_API_KEY not configured, skipping email send");
        return { data: null, error: { message: "Email not configured" } };
    }

    const from = process.env.EMAIL_FROM || "Like In House <reservas@likeinhouseperu.com>";

    const finalHtml = trustedHtml ? html : sanitizeHtml(html);

    return await resend.emails.send({
        from,
        to,
        subject,
        html: finalHtml,
        ...(text ? { text } : {}),
        ...(replyTo ? { replyTo } : {}),
    });
};
