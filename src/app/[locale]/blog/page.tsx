import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getServerCaller } from "@/lib/trpc-server";
import { BlogList } from "@/components/public/blog-list";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://likeinhouse.com";
  return {
    title: t("blog_title"),
    description: t("blog_description"),
    alternates: { canonical: `${baseUrl}/${locale}/blog` },
    openGraph: {
      title: t("blog_title"),
      description: t("blog_description"),
      url: `${baseUrl}/${locale}/blog`,
      siteName: "Like In House",
      type: "website",
      locale: locale === "es" ? "es_PE" : "en_US",
    },
  };
}

export default async function BlogPage() {
  const [caller, t] = await Promise.all([
    getServerCaller(),
    getTranslations("blog"),
  ]);

  const initialData = await caller.public.blogPosts({ page: 1, limit: 6 });

  return (
    <div className="page-transition">
      {/* Header */}
      <section className="bg-white border-b border-gray-100 pt-16 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-3">
            Blog
          </span>
          <h1 className="font-heading text-4xl font-bold text-gray-900 sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-base text-gray-500 max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BlogList initialData={initialData} />
        </div>
      </section>
    </div>
  );
}
