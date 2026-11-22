import { getTranslations } from "next-intl/server";
import { SmilingSun } from "@/components/familia/illustrations";

export default async function FamilyLoading() {
  const t = await getTranslations("familia");
  return (
    <div role="status" className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <SmilingSun className="w-16 motion-safe:animate-[spin_6s_linear_infinite]" />
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
