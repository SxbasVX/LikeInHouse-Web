"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold">{t("error")}</h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        {error.message || "Something went wrong"}
      </p>
      <Button onClick={reset} className="mt-6">
        {t("back")}
      </Button>
    </div>
  );
}
