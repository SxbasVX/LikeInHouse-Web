"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";

interface BlogListProps {
  initialData: {
    posts: any[];
    total: number;
    pages: number;
  };
}

export function BlogList({ initialData }: BlogListProps) {
  const t = useTranslations("blog");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isEs = locale === "es";
  const [page, setPage] = useState(1);

  const hasFilters = page > 1;

  const { data } = trpc.public.blogPosts.useQuery(
    { page, limit: 6 },
    { initialData: hasFilters ? undefined : initialData, enabled: hasFilters }
  );

  const displayData = data || initialData;

  if (displayData.posts.length === 0) {
    return (
      <p className="animate-fade-in py-20 text-center text-muted-foreground">
        {t("no_posts")}
      </p>
    );
  }

  return (
    <>
      <div className="stagger-children grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayData.posts.map((post: any) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <Card className="group overflow-hidden transition-shadow hover:shadow-lg h-full">
              {post.coverImageUrl && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.coverImageUrl}
                    alt={isEs ? post.titleEs : post.titleEn}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <CardContent className="p-5">
                {post.category && (
                  <Badge variant="secondary" className="mb-2">
                    {post.category}
                  </Badge>
                )}
                <h2 className="mb-2 font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {isEs ? post.titleEs : post.titleEn}
                </h2>
                <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                  {isEs ? post.excerptEs : post.excerptEn}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {post.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.publishedAt).toLocaleDateString(
                        isEs ? "es-PE" : "en-US",
                        { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }
                      )}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-primary">
                    {t("read_more")}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {displayData.pages > 1 && (
        <div className="mt-10 flex justify-center gap-3">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {tc("previous")}
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            {page} / {displayData.pages}
          </span>
          <Button
            variant="outline"
            disabled={page >= displayData.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            {tc("next")}
          </Button>
        </div>
      )}
    </>
  );
}
