import type { Metadata, Viewport } from "next";
import { Montserrat, Lato, Playfair_Display } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { TRPCProvider } from "@/lib/trpc-provider";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { Analytics } from "@/components/public/analytics";
import { TrafficTracker } from "@/components/public/traffic-tracker";
import {
  getBaseUrl,
  ogLocale,
  safeJsonLd,
  travelAgencyJsonLd,
  SITE_NAME,
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
  themeColor: "#4E6E69",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const base = getBaseUrl();
  const image = `${base}${DEFAULT_OG_IMAGE}`;

  return {
    metadataBase: new URL(base),
    title: {
      default: t("home_title"),
      template: `%s | ${SITE_NAME}`,
    },
    description: t("home_description"),
    applicationName: SITE_NAME,
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    authors: [{ name: SITE_NAME, url: base }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
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
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      alternateLocale: locale === "es" ? "en_US" : "es_PE",
      url: `${base}/${locale}`,
      images: [{ url: image, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("home_title"),
      description: t("home_description"),
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-icon.png",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${lato.variable} ${montserrat.variable} ${playfair.variable} font-sans antialiased text-brand-darkRed bg-brand-beige/20`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(travelAgencyJsonLd(locale)) }}
        />
        <NextIntlClientProvider messages={messages}>
          <TRPCProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1 pt-20">{children}</main>
              <Footer />
            </div>
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
