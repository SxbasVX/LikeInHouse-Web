"use client";

import { useTranslations } from "next-intl";
import { Clock, Mail, Phone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { waUrl } from "@/lib/whatsapp";
import { QuoteRequestForm } from "@/components/public/quote-request-form";
import { BrowserFrame, Waves } from "@/components/familia/illustrations";
import { familyBtnPrimary } from "@/components/familia/styles";

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
      <section className="bg-brand-beige">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-6 lg:pt-16">
          <h1 className="max-w-2xl font-heading text-[2rem] font-black leading-tight text-brand-darkRed sm:text-5xl">
            {t("contact_title")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-brand-darkRed/85">{t("contact_text")}</p>
        </div>
        <Waves color="#FFFBEF" className="h-6 sm:h-10" />
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:pb-20">
        <BrowserFrame label={t("site_name")}>
          <div id="cotizar" className="scroll-mt-28 px-5 py-8 sm:px-8">
            <h2 className="font-heading text-2xl font-black text-brand-darkRed">{t("contact_form_title")}</h2>
            <p className="mb-6 mt-2 text-brand-darkRed/80">{t("contact_form_text")}</p>
            <QuoteRequestForm />
          </div>
        </BrowserFrame>

        <aside className="space-y-5 lg:sticky lg:top-28">
          <div className="rounded-3xl border-2 border-brand-teal bg-white p-6">
            <h2 className="font-heading text-xl font-extrabold text-brand-darkRed">{t("contact_whatsapp_title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-darkRed/80">{t("contact_whatsapp_text")}</p>
            <a
              href={waUrl(t("cta_whatsapp_message"))}
              target="_blank"
              rel="noopener noreferrer"
              className={`${familyBtnPrimary} mt-5 w-full`}
            >
              {t("contact_whatsapp_button")}
            </a>
          </div>

          <ul className="divide-y-2 divide-dashed divide-brand-orange/30 rounded-3xl border-2 border-brand-orange bg-white px-6">
            {rows.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex items-start gap-3 py-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-darkTeal" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-darkRed">{label}</p>
                  {href ? (
                    <a href={href} className="break-all text-sm text-brand-darkRed/85 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange">
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm text-brand-darkRed/85">{value}</p>
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
