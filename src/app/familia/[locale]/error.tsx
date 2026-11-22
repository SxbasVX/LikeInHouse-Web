"use client";

import { useTranslations } from "next-intl";
import { familyBtnPrimary } from "@/components/familia/styles";

export default function FamilyError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("familia");
  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center bg-[#faf8f5] px-4 py-20 text-center">
      <h1 className="font-heading text-3xl font-light text-brand-darkRed sm:text-4xl">{t("error_title")}</h1>
      <p className="mt-4 max-w-lg text-lg font-light text-gray-500">{t("error_text")}</p>
      <button type="button" onClick={reset} className={`${familyBtnPrimary} mt-9`}>
        {t("error_retry")}
      </button>
    </div>
  );
}
