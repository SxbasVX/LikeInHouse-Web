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
    <div className="page-transition mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="animate-slide-up mb-10 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <BlogList initialData={initialData} />
    </div>
  );
}
