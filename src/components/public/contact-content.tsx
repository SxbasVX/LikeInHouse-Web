"use client";

import { useTranslations } from "next-intl";
import { ContactForm } from "@/components/public/contact-form";
import { MapPin, Phone, Mail, Clock, ArrowUpRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

export function ContactContent() {
  const t = useTranslations("contact");
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51984123456";

  const heroAnim = useScrollAnimation({ threshold: 0.1 });
  const formAnim = useScrollAnimation({ threshold: 0.1 });

  return (
    <>
      {/* Hero header */}
      <section className="bg-[#faf8f5] border-b border-gray-100">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 py-20 lg:py-28">
          <div
            ref={heroAnim.ref}
            className={`${heroAnim.isVisible ? "scroll-visible" : "scroll-hidden"} text-center`}
          >
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-teal mb-4">
              Contacto
            </p>
            <h1 className="font-heading text-4xl font-light text-brand-darkRed sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.1]">
              {t("title").split(" ").slice(0, 2).join(" ")}{" "}
              <span className="font-serif italic font-normal text-brand-teal">
                {t("title").split(" ").slice(2).join(" ") || "con nosotros"}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 font-light leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Contenido */}
      <section className="bg-white py-16 lg:py-20">
        <div
          ref={formAnim.ref}
          className={`${formAnim.isVisible ? "scroll-visible" : "scroll-hidden"} mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12`}
        >
          <div className="grid gap-10 lg:grid-cols-3">

            {/* Formulario */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
                <h2 className="font-heading text-xl font-bold text-brand-darkRed mb-6">
                  {t("send_message")}
                </h2>
                <ContactForm />
              </div>
            </div>

            {/* Info lateral */}
            <div className="space-y-5">

              {/* Datos de contacto */}
              <div className="rounded-2xl bg-[#faf8f5] p-7">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-brand-darkRed/60 mb-5">
                  Información
                </h3>
                <div className="space-y-5">
                  {[
                    { icon: MapPin, label: "Oficina", value: "Av. El Sol 456, Cusco, Perú" },
                    { icon: Phone, label: "Teléfono", value: "+51 84 123 456" },
                    { icon: Mail, label: "Email", value: "info@perutours.com" },
                    { icon: Clock, label: "Horario", value: "Lun - Sab: 8:00 AM - 6:00 PM" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10">
                        <Icon className="h-4 w-4 text-brand-teal" />
                      </span>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          {label}
                        </p>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp CTA */}
              <div className="rounded-2xl bg-brand-teal/5 border border-brand-teal/15 p-7 text-center">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-[#25D366]/15 mb-4">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-[#25D366]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <p className="font-heading font-bold text-brand-darkRed mb-1">
                  {t("whatsapp_cta", { fallback: "¿Prefieres WhatsApp?" })}
                </p>
                <p className="text-xs text-gray-500 mb-5">Respondemos en minutos</p>
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, quiero información sobre tours")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between w-full rounded-full bg-[#25D366] hover:bg-[#1fb855] text-white pl-5 pr-1.5 py-1.5 text-sm font-bold transition-all group"
                >
                  {t("whatsapp_button", { fallback: "Escríbenos por WhatsApp" })}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 group-hover:bg-white group-hover:text-[#25D366] transition-colors">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
