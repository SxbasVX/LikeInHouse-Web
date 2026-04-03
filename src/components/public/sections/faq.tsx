"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

interface FAQ {
  id: string;
  questionEs: string;
  questionEn: string | null;
  answerEs: string;
  answerEn: string | null;
}

interface FAQSectionProps {
  faqs: FAQ[];
  title?: string;
  subtitle?: string;
}

export function FAQSection({ faqs, title, subtitle }: FAQSectionProps) {
  const locale = useLocale();
  const isEs = locale === "es";
  const [openId, setOpenId] = useState<string | null>(null);
  const section = useScrollAnimation({ threshold: 0.1 });

  if (faqs.length === 0) return null;

  // Mostrar máximo 6 en la homepage
  const visibleFaqs = faqs.slice(0, 6);

  return (
    <section className="bg-gray-50 py-16 lg:py-24 px-4 sm:px-6 lg:px-12">
      <div ref={section.ref} className={`mx-auto max-w-3xl ${section.isVisible ? "scroll-visible" : "scroll-hidden"}`}>

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-3">
            {isEs ? "Preguntas Frecuentes" : "FAQ"}
          </span>
          <h2 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl leading-tight">
            {isEs ? "¿Tienes dudas?" : "Got questions?"}
            <br />
            <span className="font-serif italic font-normal text-brand-darkRed">
              {isEs ? "Nosotros respondemos." : "We have answers."}
            </span>
          </h2>
        </div>

        {/* Acordeón */}
        <div className="space-y-3">
          {visibleFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`overflow-hidden rounded-2xl bg-white shadow-sm border transition-all duration-200 ${
                  isOpen ? "border-brand-orange/30 shadow-md" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <button
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                >
                  <span className={`text-base font-semibold pr-4 leading-snug ${isOpen ? "text-brand-darkRed" : "text-gray-800"}`}>
                    {isEs ? faq.questionEs : (faq.questionEn || faq.questionEs)}
                  </span>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isOpen ? "bg-brand-orange text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </span>
                </button>

                <div className={`grid transition-all duration-200 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <div className="border-t border-gray-100 px-6 pb-5 pt-4">
                      <p className="text-[15px] leading-relaxed text-gray-500">
                        {isEs ? faq.answerEs : (faq.answerEn || faq.answerEs)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Link a página completa */}
        {faqs.length > 6 && (
          <div className="mt-8 text-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:border-brand-orange hover:text-brand-darkRed transition-all"
            >
              {isEs ? "Ver todas las preguntas" : "View all questions"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
