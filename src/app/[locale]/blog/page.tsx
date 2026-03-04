"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowRight } from "lucide-react";

export default function BlogPage() {
  const t = useTranslations("blog");
  const locale = useLocale();
  const isEs = locale === "es";
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.public.blogPosts.useQuery({ page, limit: 6 });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      ) : data && data.posts.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="group overflow-hidden transition-shadow hover:shadow-lg h-full">
                  {post.coverImageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.coverImageUrl}
                        alt={isEs ? post.titleEs : post.titleEn}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
                            { day: "numeric", month: "short", year: "numeric" }
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

          {data.pages > 1 && (
            <div className="mt-10 flex justify-center gap-3">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                {page} / {data.pages}
              </span>
              <Button
                variant="outline"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="py-20 text-center text-muted-foreground">{t("no_posts")}</p>
      )}
    </div>
  );
}
