"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ChevronDown } from "lucide-react";

interface FAQ {
  id: string;
  questionEs: string;
  questionEn: string | null;
  answerEs: string;
  answerEn: string | null;
}

export function FAQList({ faqs }: { faqs: FAQ[] }) {
  const locale = useLocale();
  const isEs = locale === "es";
  const [openId, setOpenId] = useState<string | null>(null);

  if (faqs.length === 0) {
    return <p className="py-12 text-center text-gray-400">No hay preguntas disponibles.</p>;
  }

  return (
    <div className="space-y-3">
      {faqs.map((faq) => {
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
  );
}
