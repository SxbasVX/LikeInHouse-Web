"use client";

import { useTranslations, useLocale } from "next-intl";
import { Phone, Mail, Clock, ArrowUpRight, MessageCircle, FileText } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { waUrl } from "@/lib/whatsapp";
import { trpc } from "@/lib/trpc";
import { QuoteRequestForm } from "@/components/public/quote-request-form";

export function ContactContent() {
  const t = useTranslations("contact");
  const tc = useTranslations("common");
  const tQuote = useTranslations("quote");
  const locale = useLocale();
  const isEs = locale === "es";

  const { data: settings } = trpc.public.settings.useQuery(undefined, { staleTime: 10 * 60 * 1000 });
  const getSetting = (key: string, fallback: string = "") => {
    if (!settings) return fallback;
    return (settings as Record<string, string>)[key] || fallback;
  };
  const phone = getSetting("phone", "+51 913 406 888");
  const email = getSetting("contactEmail", "info@likeinhouseperu.com");

  const heroAnim = useScrollAnimation({ threshold: 0.1 });
  const cardsAnim = useScrollAnimation({ threshold: 0.1 });

  const whatsappIcon = (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );

  const infoRows = [
    { icon: Phone, label: tc("phone"), value: phone, hint: isEs ? "Llamadas y WhatsApp" : "Calls & WhatsApp" },
    { icon: Mail, label: tc("email"), value: email, href: `mailto:${email}`, hint: isEs ? "Cotizaciones y consultas" : "Quotes & inquiries" },
    { icon: Clock, label: isEs ? "Horario" : "Hours", value: isEs ? "Lun - Sáb" : "Mon - Sat", hint: "8:00 AM - 6:00 PM" },
  ];

  return (
    <>
      {/* Hero compacto: deja ver el formulario sin hacer scroll */}
      <section className="bg-[#faf8f5] border-b border-gray-100">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 pt-12 pb-20 lg:pt-16 lg:pb-24">
          <div
            ref={heroAnim.ref}
            className={`${heroAnim.isVisible ? "scroll-visible" : "scroll-hidden"} text-center`}
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-3">
              {t("title")}
            </span>
            <h1 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl leading-tight">
              {isEs ? "Planifica tu " : "Plan your "}
              <span className="font-serif italic font-normal text-brand-darkRed">
                {isEs ? "próxima aventura." : "next adventure."}
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-gray-500 font-light leading-relaxed">
              {t("subtitle")}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#cotizar"
                className="inline-flex items-center gap-2 rounded-full bg-brand-darkRed px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-orange"
              >
                <FileText className="h-4 w-4" />
                {tQuote("button")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario primero; WhatsApp y datos de contacto al costado */}
      <section className="bg-white pb-16 lg:pb-24">
        <div
          ref={cardsAnim.ref}
          className={`${cardsAnim.isVisible ? "scroll-visible" : "scroll-hidden"} relative -mt-12 mx-auto max-w-6xl px-4 sm:px-6 lg:px-12`}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            {/* Solicitud de cotización */}
            <div
              id="cotizar"
              className="scroll-mt-24 rounded-3xl border border-gray-100 border-t-4 border-t-brand-orange bg-white p-6 shadow-xl sm:p-10"
            >
              <h2 className="font-heading text-2xl font-bold text-gray-900 sm:text-3xl">{tQuote("title")}</h2>
              <p className="mt-2 mb-8 text-gray-500">{tQuote("subtitle")}</p>
              <QuoteRequestForm />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              {/* WhatsApp compacto */}
              <div className="rounded-3xl border border-[#25D366]/20 bg-gradient-to-br from-[#25D366]/5 to-[#25D366]/15 p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25D366]/15 text-[#25D366]">
                  {whatsappIcon}
                </div>
                <h2 className="font-heading text-xl font-bold text-gray-900">
                  {isEs ? "¿Prefieres escribirnos?" : "Prefer to message us?"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  {isEs
                    ? "Resolvemos tus dudas y confirmamos disponibilidad al instante."
                    : "We answer questions and confirm availability instantly."}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#128C4A]">
                  <MessageCircle className="h-4 w-4" />
                  {t("reply_fast")}
                </div>
                <a
                  href={waUrl(isEs ? "Hola, quiero información sobre tours" : "Hi, I'd like info about tours")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-5 flex items-center justify-between rounded-full bg-[#25D366] py-2.5 pl-6 pr-2 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1fb855]"
                >
                  {isEs ? "Iniciar conversación" : "Start a conversation"}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors group-hover:bg-white group-hover:text-[#25D366]">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </a>
              </div>

              {/* Datos de contacto */}
              <div className="divide-y divide-gray-100 rounded-3xl bg-[#faf8f5] px-6">
                {infoRows.map(({ icon: Icon, label, value, href, hint }) => (
                  <div key={label} className="flex items-start gap-4 py-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10">
                      <Icon className="h-5 w-5 text-brand-teal" />
                    </span>
                    <div className="min-w-0">
                      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                      {href ? (
                        <a href={href} className="break-all text-sm font-semibold text-gray-800 transition-colors hover:text-brand-teal">
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-gray-800">{value}</p>
                      )}
                      <p className="mt-0.5 text-xs text-gray-400">{hint}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
