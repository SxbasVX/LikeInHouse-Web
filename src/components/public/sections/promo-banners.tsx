"use client";

import { useLocale } from "next-intl";
import { trpc } from "@/lib/trpc";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export function PromoBannersSection() {
  const locale = useLocale();
  const isEs = locale === "es";
  const { data: banners = [] } = trpc.public.activeBanners.useQuery();

  if (banners.length === 0) return null;

  return (
    <section className="bg-white py-10 lg:py-14">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">

        {/* Un solo banner — ancho completo */}
        {banners.length === 1 && (
          <SingleBanner banner={banners[0]} isEs={isEs} />
        )}

        {/* Dos banners — grid 2 cols */}
        {banners.length === 2 && (
          <div className="grid sm:grid-cols-2 gap-5">
            {banners.map((b) => <BannerCard key={b.id} banner={b} isEs={isEs} />)}
          </div>
        )}

        {/* 3+ banners — primero grande, resto pequeños */}
        {banners.length >= 3 && (
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SingleBanner banner={banners[0]} isEs={isEs} />
            </div>
            <div className="flex flex-col gap-5">
              {banners.slice(1, 3).map((b) => <BannerCard key={b.id} banner={b} isEs={isEs} tall />)}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

function SingleBanner({ banner, isEs }: { banner: any; isEs: boolean }) {
  const title = isEs ? banner.titleEs : banner.titleEn;
  const subtitle = isEs ? banner.subtitleEs : banner.subtitleEn;
  const linkText = (isEs ? banner.linkTextEs : banner.linkTextEn) || (isEs ? "Ver más" : "Learn more");

  return (
    <a
      href={banner.linkUrl || "#"}
      className="group relative flex items-end overflow-hidden rounded-[1.75rem] min-h-[280px] lg:min-h-[360px] shadow-xl"
      {...(!banner.linkUrl ? { onClick: (e) => e.preventDefault() } : { target: "_blank", rel: "noopener noreferrer" })}
    >
      <Image
        src={banner.imageUrl}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 1200px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      <div className="relative z-10 p-8 lg:p-10 flex items-end justify-between w-full gap-4">
        <div>
          <p className="text-white text-2xl lg:text-3xl font-bold leading-tight drop-shadow-lg max-w-xl">
            {title}
          </p>
          {subtitle && (
            <p className="mt-2 text-white/80 text-base lg:text-lg font-light">
              {subtitle}
            </p>
          )}
        </div>
        {banner.linkUrl && (
          <span className="shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 border border-white/30 backdrop-blur-sm group-hover:bg-brand-orange group-hover:border-brand-orange transition-all">
            <ArrowUpRight className="h-5 w-5 text-white group-hover:rotate-12 transition-transform" />
          </span>
        )}
      </div>
    </a>
  );
}

function BannerCard({ banner, isEs, tall }: { banner: any; isEs: boolean; tall?: boolean }) {
  const title = isEs ? banner.titleEs : banner.titleEn;
  const subtitle = isEs ? banner.subtitleEs : banner.subtitleEn;

  return (
    <a
      href={banner.linkUrl || "#"}
      className={`group relative flex items-end overflow-hidden rounded-[1.5rem] shadow-lg ${tall ? "flex-1" : "min-h-[200px]"}`}
      style={tall ? { minHeight: "160px" } : {}}
      {...(!banner.linkUrl ? { onClick: (e) => e.preventDefault() } : { target: "_blank", rel: "noopener noreferrer" })}
    >
      <Image
        src={banner.imageUrl}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 400px"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="relative z-10 p-5 w-full">
        <p className="text-white font-bold text-lg leading-snug line-clamp-2">{title}</p>
        {subtitle && <p className="text-white/70 text-sm mt-1 line-clamp-1">{subtitle}</p>}
      </div>
    </a>
  );
}
