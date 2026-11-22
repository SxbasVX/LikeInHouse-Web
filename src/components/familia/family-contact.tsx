"use client";

import { useTranslations } from "next-intl";
import { Clock, Mail, Phone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { waUrl } from "@/lib/whatsapp";
import { QuoteRequestForm } from "@/components/public/quote-request-form";
import { familyBtnPrimary } from "@/components/familia/styles";
import { SectionHeading } from "@/components/familia/section-heading";

// Contacto de la web familiar: formulario de cotización + WhatsApp y datos.
export function FamilyContact() {
  const t = useTranslations("familia");
  const { data: settings } = trpc.public.settings.useQuery(undefined, { staleTime: 10 * 60 * 1000 });
  const get = (key: string, fallback: string) => {
    const v = (settings as Record<string, unknown> | undefined)?.[key];
    return typeof v === "string" && v ? v : fallback;
  };
  const phone = get("phone", "+51 913 406 888");
  const email = get("contactEmail", "info@likeinhouseperu.com");

  const rows = [
    { icon: Phone, label: t("contact_phone_label"), value: phone, href: `tel:${phone.replace(/[^+\d]/g, "")}` },
    { icon: Mail, label: t("contact_email_label"), value: email, href: `mailto:${email}` },
    { icon: Clock, label: t("contact_hours_label"), value: t("contact_hours") },
  ];

  return (
    <div>
      <section className="border-b border-gray-100 bg-[#faf8f5] py-16 lg:py-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <SectionHeading as="h1" eyebrow={t("contact_eyebrow")} title={t("contact_title_1")} accent={t("contact_title_2")} text={t("contact_text")} />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:px-12 lg:py-20">
        <div id="cotizar" className="scroll-mt-28 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
          <h2 className="font-heading text-2xl font-bold text-brand-darkRed">{t("contact_form_title")}</h2>
          <p className="mb-6 mt-2 font-light text-gray-500">{t("contact_form_text")}</p>
          <QuoteRequestForm />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28">
          <div className="rounded-[2rem] bg-brand-darkRed p-8 text-white">
            <h2 className="font-heading text-2xl font-bold">{t("contact_whatsapp_title")}</h2>
            <p className="mt-2 text-sm font-light leading-relaxed text-white/75">{t("contact_whatsapp_text")}</p>
            <a
              href={waUrl(t("cta_whatsapp_message"))}
              target="_blank"
              rel="noopener noreferrer"
              className={`${familyBtnPrimary} mt-6 w-full`}
            >
              {t("contact_whatsapp_button")}
            </a>
          </div>

          <ul className="divide-y divide-gray-100 rounded-[2rem] border border-gray-100 bg-white px-8">
            {rows.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex items-start gap-3 py-5">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-darkRed">{label}</p>
                  {href ? (
                    <a href={href} className="break-all text-sm font-light text-gray-600 hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange">
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm font-light text-gray-600">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}
