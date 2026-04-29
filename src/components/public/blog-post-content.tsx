"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar } from "lucide-react";

interface BlogPost {
  slug: string;
  titleEs: string;
  titleEn: string;
  contentEs: unknown;
  contentEn: unknown;
  coverImageUrl: string | null;
  category: string | null;
  publishedAt: Date | string | null;
}

interface TiptapNode {
  type?: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: { level?: number };
}

function renderContent(json: unknown) {
  if (!json || typeof json !== "object") return null;
  const root = json as TiptapNode;
  if (!Array.isArray(root.content)) return null;

  return root.content.map((node, i) => {
    if (node.type === "paragraph" && Array.isArray(node.content)) {
      return (
        <p key={i} className="mb-4">
          {node.content.map((child) => child.text || "").join("")}
        </p>
      );
    }
    if (node.type === "heading" && Array.isArray(node.content)) {
      const Tag = `h${node.attrs?.level || 2}` as keyof JSX.IntrinsicElements;
      return (
        <Tag key={i} className="mt-6 mb-3 font-bold">
          {node.content.map((child) => child.text || "").join("")}
        </Tag>
      );
    }
    return null;
  });
}

export function BlogPostContent({ post }: { post: BlogPost }) {
  const tc = useTranslations("common");
  const locale = useLocale();
  const isEs = locale === "es";
  const title = isEs ? post.titleEs : post.titleEn;
  const content = isEs ? post.contentEs : post.contentEn;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Button variant="ghost" size="sm" className="mb-6" asChild>
        <Link href="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tc("back")}
        </Link>
      </Button>

      {post.coverImageUrl && (
        <div className="relative mb-6 w-full aspect-video overflow-hidden rounded-lg">
          <Image
            src={post.coverImageUrl}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      <div className="mb-6 flex items-center gap-3">
        {post.category && <Badge variant="secondary">{post.category}</Badge>}
        {post.publishedAt && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {new Date(post.publishedAt).toLocaleDateString(
                isEs ? "es-PE" : "en-US",
                { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
              )}
            </time>
          </span>
        )}
      </div>

      <h1 className="text-3xl font-bold mb-6 sm:text-4xl">{title}</h1>

      <div className="prose prose-lg max-w-none">{renderContent(content)}</div>
    </article>
  );
}
