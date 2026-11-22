import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Thread } from "@/components/familia/textile";
import { familyBtnPrimary, familyBtnSecondary } from "@/components/familia/styles";

export default async function FamilyNotFound() {
  const t = await getTranslations("familia");
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6">
      <Thread color="#F2B33D" />
      <h1 className="mt-6 max-w-[20ch] font-familia text-4xl leading-tight text-fam-tinta sm:text-5xl">{t("not_found_title")}</h1>
      <p className="mt-4 max-w-lg text-lg text-fam-tinta/75">{t("not_found_text")}</p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link href="/" className={familyBtnPrimary}>{t("not_found_back")}</Link>
        <Link href="/tours" className={familyBtnSecondary}>{t("not_found_tours")}</Link>
      </div>
    </div>
  );
}
