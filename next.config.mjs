import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimización: compilador SWC para minificación más rápida
  swcMinify: true,

  // Optimización: compresión de respuestas
  compress: true,

  // Optimización: generar source maps solo en dev
  productionBrowserSourceMaps: false,

  // Optimización: reducir bundle con tree-shaking agresivo
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{ kebabCase member }}",
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    // Optimización: formatos modernos de imagen
    formats: ["image/avif", "image/webp"],
  },

  // Optimización: headers de caché para assets estáticos
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
    ];
  },
};

export default withNextIntl(nextConfig);
