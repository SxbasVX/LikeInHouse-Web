import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart, Leaf, Users, Shield } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likeinhouse.com";
  return {
    title: t("about_title"),
    description: t("about_description"),
    alternates: { canonical: `${baseUrl}/${locale}/nosotros` },
    openGraph: {
      title: t("about_title"),
      description: t("about_description"),
      url: `${baseUrl}/${locale}/nosotros`,
      siteName: "Like In House",
      type: "website",
      locale: locale === "es" ? "es_PE" : "en_US",
    },
  };
}

const values = [
  { key: "value_1", icon: Heart },
  { key: "value_2", icon: Users },
  { key: "value_3", icon: Shield },
  { key: "value_4", icon: Leaf },
] as const;

export default async function AboutPage() {
  const [t, th] = await Promise.all([
    getTranslations("about"),
    getTranslations("home"),
  ]);

  return (
    <div className="page-transition">
      {/* Hero */}
      <section className="animate-fade-in bg-gradient-to-br from-primary/90 to-primary py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="stagger-children grid gap-8 md:grid-cols-2">
            <Card className="transition-shadow hover:shadow-lg">
              <CardContent className="p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-3">{t("mission_title")}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("mission")}
                </p>
              </CardContent>
            </Card>
            <Card className="transition-shadow hover:shadow-lg">
              <CardContent className="p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-3">{t("vision_title")}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("vision")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="animate-slide-up text-center text-3xl font-bold mb-10">
            {t("values_title")}
          </h2>
          <div className="stagger-children grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((val) => {
              const Icon = val.icon;
              return (
                <Card key={val.key} className="text-center transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium">{t(val.key)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="animate-slide-up py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">{th("cta")}</h2>
          <p className="mt-4 text-muted-foreground">{th("cta_subtitle")}</p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" className="transition-transform hover:scale-105" asChild>
              <Link href="/tours">{th("hero_cta")}</Link>
            </Button>
            <Button size="lg" variant="outline" className="transition-transform hover:scale-105" asChild>
              <Link href="/contacto">{th("cta_button")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
