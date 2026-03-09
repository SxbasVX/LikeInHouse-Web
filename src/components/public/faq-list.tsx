"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div className="stagger-children space-y-3">
      {faqs.map((faq) => (
        <div key={faq.id} className="rounded-lg border transition-shadow hover:shadow-sm">
          <button
            className="flex w-full items-center justify-between px-5 py-4 text-left"
            onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
          >
            <span className="font-medium pr-4">
              {isEs ? faq.questionEs : (faq.questionEn || faq.questionEs)}
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                openId === faq.id && "rotate-180"
              )}
            />
          </button>
          <div
            className={cn(
              "grid transition-all duration-200",
              openId === faq.id ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="border-t px-5 py-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {isEs ? faq.answerEs : (faq.answerEn || faq.answerEs)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
