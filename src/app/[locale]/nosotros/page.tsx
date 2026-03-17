import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { Target, Eye, Heart, Leaf, Users, Shield, ArrowUpRight } from "lucide-react";

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

      {/* Header */}
      <section className="bg-white border-b border-gray-100 pt-16 pb-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-3">
            Nosotros
          </span>
          <h1 className="font-heading text-4xl font-bold text-gray-900 sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { icon: Target, title: t("mission_title"), body: t("mission") },
              { icon: Eye, title: t("vision_title"), body: t("vision") },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange/10 mb-5">
                  <Icon className="h-6 w-6 text-brand-orange" />
                </span>
                <h2 className="font-heading text-xl font-bold text-gray-900 mb-3">{title}</h2>
                <p className="text-gray-500 leading-relaxed text-[15px]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-2">
              Lo que nos define
            </span>
            <h2 className="font-heading text-3xl font-bold text-gray-900">
              {t("values_title")}
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((val) => {
              const Icon = val.icon;
              return (
                <div key={val.key} className="rounded-3xl bg-gray-50 border border-gray-100 p-6 text-center hover:border-brand-orange/20 hover:shadow-sm transition-all">
                  <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-brand-orange/10 mb-4">
                    <Icon className="h-6 w-6 text-brand-orange" />
                  </span>
                  <p className="font-semibold text-gray-800">{t(val.key)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-darkRed py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">{th("cta")}</h2>
          <p className="mt-4 text-white/70 text-base">{th("cta_subtitle")}</p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/tours"
              className="inline-flex items-center justify-between rounded-full bg-brand-orange hover:bg-white hover:text-brand-darkRed text-white pl-6 pr-1.5 py-1.5 text-sm font-bold transition-all group shadow-lg"
            >
              {th("hero_cta")}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 group-hover:bg-brand-darkRed group-hover:text-white transition-colors ml-3">
                <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              </span>
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white px-8 py-3 text-sm font-semibold transition-all"
            >
              {th("cta_button")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
