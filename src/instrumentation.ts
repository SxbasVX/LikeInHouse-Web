export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Sentry config moved to instrumentation-node.ts for Next 15 Turbopack compatibility
    // await import("./instrumentation-node");
  }

  // Validate required env vars at startup (only in production server)
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const required: Record<string, string | undefined> = {
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      CRON_SECRET: process.env.CRON_SECRET,
    };

    const recommended: Record<string, string | undefined> = {
      PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
      PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    };

    const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length > 0) {
      throw new Error(
        `🚫 Missing REQUIRED environment variables: ${missing.join(", ")}. ` +
        `The application cannot start without these.`
      );
    }

    const missingRec = Object.entries(recommended).filter(([, v]) => !v).map(([k]) => k);
    if (missingRec.length > 0) {
      console.warn(
        `⚠️ Missing recommended environment variables: ${missingRec.join(", ")}. ` +
        `Some features (payments, emails, webhooks) may not work correctly.`
      );
    }
  }
}
