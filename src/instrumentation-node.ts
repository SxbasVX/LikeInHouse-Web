import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance: sample 20% of transactions in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // Debug mode for development
    debug: false,

    // Only send events in production
    enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
