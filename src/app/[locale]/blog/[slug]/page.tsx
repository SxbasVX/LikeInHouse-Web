"use client";

import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar } from "lucide-react";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useTranslations("blog");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isEs = locale === "es";

  const { data: post, isLoading } = trpc.public.blogPostBySlug.useQuery({ slug });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full rounded-lg mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Post no encontrado</h1>
        <Button variant="outline" className="mt-6" asChild>
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tc("back")}
          </Link>
        </Button>
      </div>
    );
  }

  const title = isEs ? post.titleEs : post.titleEn;
  const content = isEs ? post.contentEs : post.contentEn;

  // Simple Tiptap JSON content renderer
  const renderContent = (json: any) => {
    if (!json || !Array.isArray(json.content)) return null;
    return json.content.map((node: any, i: number) => {
      if (node.type === "paragraph" && node.content) {
        return (
          <p key={i} className="mb-4">
            {node.content.map((child: any, j: number) => child.text || "").join("")}
          </p>
        );
      }
      if (node.type === "heading" && node.content) {
        const Tag = `h${node.attrs?.level || 2}` as keyof JSX.IntrinsicElements;
        return (
          <Tag key={i} className="mt-6 mb-3 font-bold">
            {node.content.map((child: any) => child.text || "").join("")}
          </Tag>
        );
      }
      return null;
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Button variant="ghost" size="sm" className="mb-6" asChild>
        <Link href="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tc("back")}
        </Link>
      </Button>

      {post.coverImageUrl && (
        <img
          src={post.coverImageUrl}
          alt={title}
          className="mb-6 w-full rounded-lg object-cover aspect-video"
        />
      )}

      <div className="mb-6 flex items-center gap-3">
        {post.category && <Badge variant="secondary">{post.category}</Badge>}
        {post.publishedAt && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {new Date(post.publishedAt).toLocaleDateString(
              isEs ? "es-PE" : "en-US",
              { day: "numeric", month: "long", year: "numeric" }
            )}
          </span>
        )}
      </div>

      <h1 className="text-3xl font-bold mb-6 sm:text-4xl">{title}</h1>

      <div className="prose prose-lg max-w-none">
        {renderContent(content)}
      </div>
    </div>
  );
}
