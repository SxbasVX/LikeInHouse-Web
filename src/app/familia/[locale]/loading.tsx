import { getTranslations } from "next-intl/server";

export default async function FamilyLoading() {
  const t = await getTranslations("familia");
  return (
    <div role="status" className="flex min-h-[50vh] items-center justify-center px-4">
      <span aria-hidden="true" className="h-10 w-10 rounded-full border-2 border-brand-orange/30 border-t-brand-orange motion-safe:animate-spin" />
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
