import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Montserrat, Lato, Playfair_Display } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { TRPCProvider } from "@/lib/trpc-provider";
import { Toaster } from "@/components/ui/toaster";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { Analytics } from "@/components/public/analytics";
import { TrafficTracker } from "@/components/public/traffic-tracker";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { FamilyComingSoon } from "@/components/familia/family-coming-soon";
import { routing } from "@/i18n/routing";
import { getFamilyBaseUrl } from "@/lib/family-site";
import { getFamilySiteAccess } from "@/server/lib/family-site";
import {
  getBaseUrl,
  ogLocale,
  safeJsonLd,
  travelAgencyJsonLd,
  FAMILY_SITE_NAME,
  DEFAULT_OG_IMAGE,
} from "@/lib/seo";
import "@/app/globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

const lato = Lato({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lato",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-playfair",
});

export const viewport: Viewport = {
  themeColor: "#0F8A76",
  width: "device-width",
  initialScale: 1,
};

function isLocale(value: string): value is "es" | "en" {
  return (routing.locales as readonly string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const [t, access] = await Promise.all([
    getTranslations({ locale, namespace: "familia" }),
    getFamilySiteAccess(),
  ]);
  const base = getFamilyBaseUrl();
  const image = `${getBaseUrl()}${DEFAULT_OG_IMAGE}`;
  const indexable = access.published;

  return {
    metadataBase: new URL(base),
    title: {
      default: t("meta_home_title"),
      template: `%s | ${FAMILY_SITE_NAME}`,
    },
    description: t("meta_home_description"),
    applicationName: FAMILY_SITE_NAME,
    authors: [{ name: FAMILY_SITE_NAME, url: base }],
    creator: FAMILY_SITE_NAME,
    publisher: FAMILY_SITE_NAME,
    formatDetection: { email: false, address: false, telephone: false },
    alternates: {
      canonical: `${base}/${locale}`,
      languages: {
        es: `${base}/es`,
        en: `${base}/en`,
        "x-default": `${base}/es`,
      },
    },
    openGraph: {
      type: "website",
      siteName: FAMILY_SITE_NAME,
      locale: ogLocale(locale),
      alternateLocale: locale === "es" ? "en_US" : "es_PE",
      url: `${base}/${locale}`,
      images: [{ url: image, width: 1200, height: 630, alt: FAMILY_SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta_home_title"),
      description: t("meta_home_description"),
      images: [image],
    },
    // Mientras no se publique, nada se indexa (ni siquiera con vista previa)
    robots: indexable
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } }
      : { index: false, follow: false, nocache: true },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-icon.png",
    },
  };
}

export default async function FamilyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // Fija el idioma aunque se entre directo por /familia/... (sin middleware de idioma)
  setRequestLocale(locale);

  const [messages, access, t] = await Promise.all([
    getMessages(),
    getFamilySiteAccess(),
    getTranslations({ locale, namespace: "familia" }),
  ]);

  const fonts = `${lato.variable} ${montserrat.variable} ${playfair.variable}`;

  if (!access.canView) {
    return (
      <html lang={locale}>
        <body className={`${fonts} theme-familia font-sans antialiased text-brand-darkRed bg-black`}>
          <FamilyComingSoon locale={locale} />
        </body>
      </html>
    );
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${fonts} theme-familia font-sans antialiased text-brand-darkRed bg-brand-beige/20`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(travelAgencyJsonLd(locale)) }}
        />
        <NextIntlClientProvider messages={messages}>
          <TRPCProvider>
            {/* Misma barra y pie que la web principal, con la marca "Familia" */}
            <div className="flex min-h-screen flex-col">
              <Navbar variant="family" />
              <main className="flex-1 pt-20">{children}</main>
              <Footer variant="family" />
            </div>
            {access.isPreview && (
              <div
                role="status"
                className="fixed bottom-4 left-4 z-[60] flex max-w-[calc(100vw-6rem)] flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-brand-darkRed px-4 py-2 text-xs font-semibold text-white shadow-lg sm:text-sm"
              >
                <span>{t("preview_text")}</span>
                {/* Enlace normal (no prefetch): la ruta borra la cookie de vista previa */}
                <a href="/api/familia/preview?exit=1" className="rounded text-brand-orange underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  {t("preview_exit")}
                </a>
              </div>
            )}
            <WhatsAppButton />
            <TrafficTracker />
            <Toaster />
            <Analytics />
          </TRPCProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
