import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Balloons, BrowserFrame } from "@/components/familia/illustrations";
import { familyBtnPrimary, familyBtnSecondary } from "@/components/familia/styles";

export default async function FamilyNotFound() {
  const t = await getTranslations("familia");
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <BrowserFrame className="w-full max-w-lg" label="404">
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <Balloons className="w-20" />
          <h1 className="mt-4 font-heading text-2xl font-black text-brand-darkRed sm:text-3xl">{t("not_found_title")}</h1>
          <p className="mt-3 max-w-sm text-brand-darkRed/80">{t("not_found_text")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className={familyBtnPrimary}>{t("not_found_back")}</Link>
            <Link href="/tours" className={familyBtnSecondary}>{t("not_found_tours")}</Link>
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}
