"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { trpc } from "@/lib/trpc";
import { Calendar, ArrowUpRight } from "lucide-react";

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
      <div className="py-20 text-center">
        <p className="text-gray-400 text-base">{t("no_posts")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayData.posts.map((post: any) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            {/* Imagen */}
            {post.coverImageUrl ? (
              <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                <img
                  src={post.coverImageUrl}
                  alt={isEs ? post.titleEs : post.titleEn}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="aspect-[16/9] bg-gradient-to-br from-brand-orange/10 to-brand-teal/10" />
            )}

            {/* Contenido */}
            <div className="flex flex-1 flex-col p-5">
              {post.category && (
                <span className="mb-2 inline-block self-start rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-orange">
                  {post.category}
                </span>
              )}
              <h2 className="mb-2 font-heading text-lg font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-brand-darkRed transition-colors">
                {isEs ? post.titleEs : post.titleEn}
              </h2>
              <p className="mb-4 flex-1 text-sm text-gray-500 line-clamp-2 leading-relaxed">
                {isEs ? post.excerptEs : post.excerptEn}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                {post.publishedAt ? (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.publishedAt).toLocaleDateString(
                      isEs ? "es-PE" : "en-US",
                      { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }
                    )}
                  </span>
                ) : <span />}
                <span className="flex items-center gap-1 text-xs font-semibold text-brand-orange group-hover:gap-2 transition-all">
                  {t("read_more")}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Paginación */}
      {displayData.pages > 1 && (
        <div className="mt-10 flex justify-center items-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {tc("previous")}
          </button>
          <span className="text-sm text-gray-400">{page} / {displayData.pages}</span>
          <button
            disabled={page >= displayData.pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {tc("next")}
          </button>
        </div>
      )}
    </>
  );
}
