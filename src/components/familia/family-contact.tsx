"use client";

import { useTranslations } from "next-intl";
import { Clock, Mail, Phone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { waUrl } from "@/lib/whatsapp";
import { QuoteRequestForm } from "@/components/public/quote-request-form";
import { familyBtnOnDark } from "@/components/familia/styles";

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
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 lg:pt-20">
        <h1 className="max-w-[18ch] font-familia text-4xl leading-[1.06] text-fam-tinta sm:text-5xl">{t("contact_title")}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fam-tinta/75">{t("contact_text")}</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:pb-24">
        <div id="cotizar" className="scroll-mt-28 rounded-3xl border border-fam-tinta/10 bg-white p-5 sm:p-8">
          <h2 className="font-familia text-2xl text-fam-tinta">{t("contact_form_title")}</h2>
          <p className="mb-6 mt-2 text-fam-tinta/75">{t("contact_form_text")}</p>
          <QuoteRequestForm />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28">
          <div className="rounded-3xl bg-fam-valle p-6 text-white">
            <h2 className="font-familia text-2xl">{t("contact_whatsapp_title")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80">{t("contact_whatsapp_text")}</p>
            <a
              href={waUrl(t("cta_whatsapp_message"))}
              target="_blank"
              rel="noopener noreferrer"
              className={`${familyBtnOnDark} mt-5 w-full`}
            >
              {t("contact_whatsapp_button")}
            </a>
          </div>

          <ul className="divide-y divide-fam-tinta/10 px-1">
            {rows.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className="flex items-start gap-3 py-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-fam-valle" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-fam-tinta">{label}</p>
                  {href ? (
                    <a href={href} className="break-all text-sm text-fam-tinta/80 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fam-maiz">
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm text-fam-tinta/80">{value}</p>
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
