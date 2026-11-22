import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { familyBtnPrimary, familyBtnSecondary } from "@/components/familia/styles";

export default async function FamilyNotFound() {
  const t = await getTranslations("familia");
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#faf8f5] px-4 py-20 text-center">
      <p className="font-serif text-7xl italic text-brand-orange">404</p>
      <h1 className="mt-4 font-heading text-3xl font-light text-brand-darkRed sm:text-4xl">{t("not_found_title")}</h1>
      <p className="mt-4 max-w-lg text-lg font-light text-gray-500">{t("not_found_text")}</p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/" className={familyBtnPrimary}>{t("not_found_back")}</Link>
        <Link href="/tours" className={familyBtnSecondary}>{t("not_found_tours")}</Link>
      </div>
    </div>
  );
}
