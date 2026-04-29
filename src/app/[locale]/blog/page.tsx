import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getServerCaller } from "@/lib/trpc-server";
import { BlogList } from "@/components/public/blog-list";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return buildMetadata({
    locale,
    title: t("blog_title"),
    description: t("blog_description"),
    pathByLocale: "/blog",
    keywords:
      locale === "es"
        ? ["blog Perú", "consejos viaje Perú", "tips turismo", "guía viajes Perú"]
        : ["Peru blog", "Peru travel tips", "tourism tips", "Peru travel guide"],
  });
}

export default async function BlogPage() {
  const [caller, t] = await Promise.all([
    getServerCaller(),
    getTranslations("blog"),
  ]);

  const initialData = await caller.public.blogPosts({ page: 1, limit: 6 });

  return (
    <div className="page-transition">
      {/* Header — mismo estilo que tours catalog */}
      <section className="bg-[#faf8f5] border-b border-gray-100">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 py-20 lg:py-28">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-teal mb-4">
              {t("badge", { fallback: "Tips & experiencias" })}
            </p>
            <h1 className="font-heading text-4xl font-light text-brand-darkRed sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.1]">
              {t("title").split(" ")[0]}{" "}
              <span className="font-serif italic font-normal text-brand-teal">
                {t("title").split(" ").slice(1).join(" ") || "de viajeros"}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 font-light leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <BlogList initialData={initialData} />
        </div>
      </section>
    </div>
  );
}
