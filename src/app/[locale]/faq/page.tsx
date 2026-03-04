"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FAQPage() {
  const t = useTranslations("faq");
  const locale = useLocale();
  const isEs = locale === "es";
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: faqs, isLoading } = trpc.public.faqs.useQuery();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {faqs?.map((faq) => (
            <div key={faq.id} className="rounded-lg border">
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              >
                <span className="font-medium pr-4">
                  {isEs ? faq.questionEs : faq.questionEn}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                    openId === faq.id && "rotate-180"
                  )}
                />
              </button>
              {openId === faq.id && (
                <div className="border-t px-5 py-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {isEs ? faq.answerEs : faq.answerEn}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
