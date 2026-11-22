"use client";

import { useTranslations } from "next-intl";
import { Thread } from "@/components/familia/textile";
import { familyBtnPrimary } from "@/components/familia/styles";

export default function FamilyError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("familia");
  return (
    <div role="alert" className="mx-auto flex min-h-[60vh] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6">
      <Thread color="#FC451F" />
      <h1 className="mt-6 font-familia text-4xl leading-tight text-fam-tinta">{t("error_title")}</h1>
      <p className="mt-4 max-w-lg text-lg text-fam-tinta/75">{t("error_text")}</p>
      <button type="button" onClick={reset} className={`${familyBtnPrimary} mt-9 self-start`}>
        {t("error_retry")}
      </button>
    </div>
  );
}
