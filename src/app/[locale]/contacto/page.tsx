import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ContactForm } from "@/components/public/contact-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, MessageCircle, Clock } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likeinhouse.com";
  return {
    title: t("contact_title"),
    description: t("contact_description"),
    alternates: { canonical: `${baseUrl}/${locale}/contacto` },
    openGraph: {
      title: t("contact_title"),
      description: t("contact_description"),
      url: `${baseUrl}/${locale}/contacto`,
      siteName: "Like In House",
      type: "website",
      locale: locale === "es" ? "es_PE" : "en_US",
    },
  };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <div className="page-transition mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="animate-slide-up mb-10 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <Card>
            <CardContent className="p-6">
              <ContactForm />
            </CardContent>
          </Card>
        </div>

        <div className="animate-slide-up space-y-6" style={{ animationDelay: "200ms" }}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Oficina</p>
                  <p className="text-sm text-muted-foreground">
                    Av. El Sol 456, Cusco, Peru
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Telefono</p>
                  <p className="text-sm text-muted-foreground">+51 84 123 456</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">info@perutours.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Horario</p>
                  <p className="text-sm text-muted-foreground">
                    Lun - Sab: 8:00 AM - 6:00 PM
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-brand-teal/10 border-brand-teal/30">
            <CardContent className="p-6 text-center">
              <MessageCircle className="mx-auto mb-2 h-8 w-8 text-brand-teal" />
              <p className="font-medium text-brand-darkTeal">{t("whatsapp_cta")}</p>
              <Button
                className="mt-3 bg-brand-teal hover:bg-brand-darkTeal"
                asChild
              >
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51984123456"}?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20tours`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("whatsapp_button")}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
