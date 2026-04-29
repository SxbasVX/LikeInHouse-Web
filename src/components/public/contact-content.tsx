"use client";

import { useTranslations, useLocale } from "next-intl";
import { Phone, Mail, Clock, ArrowUpRight, MessageCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { waUrl } from "@/lib/whatsapp";
import { trpc } from "@/lib/trpc";

export function ContactContent() {
  const t = useTranslations("contact");
  const tc = useTranslations("common");
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

  return (
    <>
      {/* Hero compacto */}
      <section className="bg-[#faf8f5] border-b border-gray-100">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
          <div
            ref={heroAnim.ref}
            className={`${heroAnim.isVisible ? "scroll-visible" : "scroll-hidden"} text-center`}
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-3">
              {t("title")}
            </span>
            <h1 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl leading-tight">
              {isEs ? "Planifica tu" : "Plan your"}
              <br />
              <span className="font-serif italic font-normal text-brand-darkRed">
                {isEs ? "próxima aventura." : "next adventure."}
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-gray-500 font-light leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <section className="bg-white py-16 lg:py-24">
        <div
          ref={cardsAnim.ref}
          className={`${cardsAnim.isVisible ? "scroll-visible" : "scroll-hidden"} mx-auto max-w-5xl px-4 sm:px-6 lg:px-12`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* WhatsApp CTA - columna grande */}
            <div className="lg:col-span-3 rounded-3xl bg-gradient-to-br from-[#25D366]/5 to-[#25D366]/15 border border-[#25D366]/20 p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/15 mb-6">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-[#25D366]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2 sm:text-3xl">
                  {isEs ? "Escríbenos por WhatsApp" : "Message us on WhatsApp"}
                </h2>
                <p className="text-gray-500 leading-relaxed mb-2">
                  {isEs
                    ? "Es la forma más rápida de contactarnos. Resolvemos tus dudas, armamos itinerarios personalizados y confirmamos disponibilidad al instante."
                    : "The fastest way to reach us. We answer questions, build custom itineraries and confirm availability instantly."}
                </p>
                <div className="flex items-center gap-2 text-sm text-[#25D366] font-medium mb-8">
                  <MessageCircle className="h-4 w-4" />
                  {t("reply_fast")}
                </div>
              </div>
              <a
                href={waUrl(isEs ? "Hola, quiero información sobre tours" : "Hi, I'd like info about tours")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between rounded-full bg-[#25D366] hover:bg-[#1fb855] text-white pl-7 pr-2 py-3 text-base font-bold transition-all group shadow-lg hover:shadow-xl hover:scale-[1.02] w-full sm:w-auto sm:max-w-xs"
              >
                {isEs ? "Iniciar conversación" : "Start a conversation"}
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 group-hover:bg-white group-hover:text-[#25D366] transition-colors ml-4">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </a>
            </div>

            {/* Info cards - columna lateral */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Teléfono */}
              <div className="flex items-start gap-4 rounded-2xl bg-[#faf8f5] p-6 flex-1">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10">
                  <Phone className="h-5 w-5 text-brand-teal" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    {tc("phone")}
                  </p>
                  <p className="text-base font-semibold text-gray-800">{phone}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isEs ? "Llamadas y WhatsApp" : "Calls & WhatsApp"}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 rounded-2xl bg-[#faf8f5] p-6 flex-1">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10">
                  <Mail className="h-5 w-5 text-brand-teal" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    {tc("email")}
                  </p>
                  <a href={`mailto:${email}`} className="text-base font-semibold text-gray-800 hover:text-brand-teal transition-colors break-all">
                    {email}
                  </a>
                  <p className="text-xs text-gray-400 mt-1">
                    {isEs ? "Cotizaciones y consultas" : "Quotes & inquiries"}
                  </p>
                </div>
              </div>

              {/* Horario */}
              <div className="flex items-start gap-4 rounded-2xl bg-[#faf8f5] p-6 flex-1">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10">
                  <Clock className="h-5 w-5 text-brand-teal" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    {isEs ? "Horario" : "Hours"}
                  </p>
                  <p className="text-base font-semibold text-gray-800">
                    {isEs ? "Lun - Sáb" : "Mon - Sat"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">8:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
