import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">{t("hero_title")}</h1>
      <p className="text-xl text-muted-foreground">{t("hero_subtitle")}</p>
    </main>
  );
}
