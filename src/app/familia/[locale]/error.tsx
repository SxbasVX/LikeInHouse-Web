"use client";

import { useTranslations } from "next-intl";
import { BrowserFrame, SmilingSun } from "@/components/familia/illustrations";
import { familyBtnPrimary } from "@/components/familia/styles";

export default function FamilyError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("familia");
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <BrowserFrame className="w-full max-w-lg">
        <div role="alert" className="flex flex-col items-center px-6 py-10 text-center">
          <SmilingSun className="w-20" />
          <h1 className="mt-4 font-heading text-2xl font-black text-brand-darkRed">{t("error_title")}</h1>
          <p className="mt-3 max-w-sm text-brand-darkRed/80">{t("error_text")}</p>
          <button type="button" onClick={reset} className={`${familyBtnPrimary} mt-8`}>
            {t("error_retry")}
          </button>
        </div>
      </BrowserFrame>
    </div>
  );
}
