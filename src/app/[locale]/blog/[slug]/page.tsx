import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerCaller } from "@/lib/trpc-server";
import { BlogPostContent } from "@/components/public/blog-post-content";
import {
  buildMetadata,
  blogPostingJsonLd,
  breadcrumbJsonLd,
  safeJsonLd,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const caller = await getServerCaller();
  const post = await caller.public.blogPostBySlug({ slug });

  if (!post) return { title: "Post not found", robots: { index: false, follow: false } };

  const isEs = locale === "es";
  const title = (isEs ? post.metaTitleEs : post.metaTitleEn) || (isEs ? post.titleEs : post.titleEn);
  const description =
    (isEs ? post.metaDescEs : post.metaDescEn) || (isEs ? post.excerptEs : post.excerptEn);

  return buildMetadata({
    locale,
    title,
    description,
    pathByLocale: `/blog/${slug}`,
    image: post.coverImageUrl || undefined,
    ogType: "article",
    article: {
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
      section: post.category || undefined,
    },
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const caller = await getServerCaller();
  const post = await caller.public.blogPostBySlug({ slug });
  if (!post) notFound();

  const isEs = locale === "es";

  const postJsonLd = blogPostingJsonLd({
    locale,
    slug: post.slug,
    titleEs: post.titleEs,
    titleEn: post.titleEn,
    excerptEs: post.excerptEs,
    excerptEn: post.excerptEn,
    coverImageUrl: post.coverImageUrl,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    category: post.category,
  });

  const breadcrumbLd = breadcrumbJsonLd(locale, [
    { name: isEs ? "Inicio" : "Home", path: "" },
    { name: "Blog", path: "/blog" },
    { name: isEs ? post.titleEs : post.titleEn, path: `/blog/${slug}` },
  ]);

  return (
    <div className="page-transition">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(postJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }}
      />
      <BlogPostContent post={post} />
    </div>
  );
}
