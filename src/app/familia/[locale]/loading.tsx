import { getTranslations } from "next-intl/server";

export default async function FamilyLoading() {
  const t = await getTranslations("familia");
  return (
    <div role="status" className="flex min-h-[50vh] items-center justify-center px-4">
      {/* Tres hilos que laten mientras carga */}
      <div aria-hidden="true" className="flex gap-1.5">
        {["#F2B33D", "#FC451F", "#15A58E"].map((c, i) => (
          <span
            key={c}
            className="h-10 w-1.5 rounded-full motion-safe:animate-pulse"
            style={{ backgroundColor: c, animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">{t("loading")}</span>
    </div>
  );
}
