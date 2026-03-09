"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default function ToursError({
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
        {error.message || "Something went wrong loading tours"}
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} variant="outline">
          {t("back")}
        </Button>
        <Button asChild>
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
    </div>
  );
}
