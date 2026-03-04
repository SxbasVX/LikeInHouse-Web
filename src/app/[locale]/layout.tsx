import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { TRPCProvider } from "@/lib/trpc-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <TRPCProvider>
            {children}
            <Toaster />
          </TRPCProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
