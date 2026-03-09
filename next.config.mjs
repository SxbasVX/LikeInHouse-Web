import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimización: compresión de respuestas
  compress: true,

  // Optimización: generar source maps solo en dev
  productionBrowserSourceMaps: false,

  // Optimización: reducir bundle con tree-shaking agresivo
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // Optimización: formatos modernos de imagen
    formats: ["image/avif", "image/webp"],
  },

  // Headers de seguridad y caché
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|avif|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' blob: https://www.paypal.com https://www.sandbox.paypal.com https://*.paypal.com",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://www.paypalobjects.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://www.paypal.com https://www.sandbox.paypal.com https://*.paypal.com https://api-m.sandbox.paypal.com https://api-m.paypal.com https://*.sentry.io https://*.ingest.sentry.io",
              "frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com https://*.paypal.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
            ].join("; "),
          },
          ...(process.env.NODE_ENV === "production"
            ? [
              {
                key: "Strict-Transport-Security",
                value: "max-age=31536000; includeSubDomains",
              },
            ]
            : []),
        ],
      },
    ];
  },
};

// Wrap with Sentry only if DSN is configured
let finalConfig = withNextIntl(nextConfig);

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const { withSentryConfig } = await import("@sentry/nextjs");
  finalConfig = withSentryConfig(finalConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  });
}

export default finalConfig;
