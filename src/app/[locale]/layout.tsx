import { Montserrat, Lato } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { TRPCProvider } from "@/lib/trpc-provider";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { WhatsAppButton } from "@/components/public/whatsapp-button";
import { Analytics } from "@/components/public/analytics";
import { TrafficTracker } from "@/components/public/traffic-tracker";
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
      <body className={`${lato.variable} ${montserrat.variable} font-sans antialiased text-brand-darkRed bg-brand-beige/20`}>
        <NextIntlClientProvider messages={messages}>
          <TRPCProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1 pt-[100px]">{children}</main>
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
