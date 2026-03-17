import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ContactForm } from "@/components/public/contact-form";
import { MapPin, Phone, Mail, MessageCircle, Clock, ArrowUpRight } from "lucide-react";

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
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51984123456";

  return (
    <div className="page-transition">
      {/* Header */}
      <section className="bg-white border-b border-gray-100 pt-16 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-3">
            Contacto
          </span>
          <h1 className="font-heading text-4xl font-bold text-gray-900 sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-base text-gray-500 max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Contenido */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">

            {/* Formulario */}
            <div className="lg:col-span-2">
              <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
                <h2 className="font-heading text-xl font-bold text-gray-900 mb-6">{t("send_message")}</h2>
                <ContactForm />
              </div>
            </div>

            {/* Info de contacto */}
            <div className="space-y-4">

              {/* Datos */}
              <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-5 text-sm uppercase tracking-wider">Información</h3>
                <div className="space-y-5">
                  {[
                    { icon: MapPin, label: "Oficina", value: "Av. El Sol 456, Cusco, Peru" },
                    { icon: Phone, label: "Teléfono", value: "+51 84 123 456" },
                    { icon: Mail, label: "Email", value: "info@perutours.com" },
                    { icon: Clock, label: "Horario", value: "Lun - Sab: 8:00 AM - 6:00 PM" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange/10">
                        <Icon className="h-4 w-4 text-brand-orange" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp */}
              <div className="rounded-3xl bg-brand-teal/8 border border-brand-teal/20 p-6 text-center">
                <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-brand-teal/15 mb-3">
                  <MessageCircle className="h-6 w-6 text-brand-teal" />
                </span>
                <p className="font-semibold text-brand-darkTeal mb-4">{t("whatsapp_cta")}</p>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20tours`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between w-full rounded-full bg-brand-teal hover:bg-brand-darkTeal text-white pl-5 pr-1.5 py-1.5 text-sm font-bold transition-all group"
                >
                  {t("whatsapp_button")}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 group-hover:bg-white group-hover:text-brand-darkTeal transition-colors">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
