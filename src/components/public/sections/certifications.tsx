"use client";

import { useLocale } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { trpc } from "@/lib/trpc";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Award } from "lucide-react";

export function CertificationsSection() {
  const locale = useLocale();
  const isEs = locale === "es";
  const section = useScrollAnimation({ threshold: 0.2 });

  const { data: settings } = trpc.public.settings.useQuery(undefined, { staleTime: 10 * 60 * 1000 });
  const getSetting = (key: string) => {
    if (!settings) return "";
    return (settings as Record<string, string>)[key] || "";
  };

  const CERT_NAMES = [
    "Mincetur",
    "PromPerú",
    "Y tú qué planes?",
    "Gercetur Cusco",
    "Dircetur Tumbes",
  ];

  const items = [1, 2, 3, 4, 5]
    .map((i) => ({
      url: getSetting(`footerLogo${i}Url`),
      link: getSetting(`footerLogo${i}Link`),
      name: CERT_NAMES[i - 1],
    }))
    .filter((item) => item.url);

  if (items.length === 0) return null;

  return (
    <section className="bg-brand-teal/[0.04] border-y border-brand-teal/10 py-12 lg:py-14">
      <div
        ref={section.ref}
        className={`${section.isVisible ? "scroll-visible" : "scroll-hidden"} mx-auto max-w-6xl px-4 sm:px-6 lg:px-8`}
      >
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Lado izquierdo — texto */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10">
              <Award className="h-6 w-6 text-brand-teal" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">
                {isEs ? "Certificaciones y premios" : "Certifications & awards"}
              </p>
              <p className="text-xs text-gray-500">
                {isEs ? "Avalados por instituciones del sector turismo" : "Endorsed by tourism industry institutions"}
              </p>
            </div>
          </div>

          {/* Separador */}
          <div className="hidden md:block w-px h-12 bg-brand-teal/15" />

          {/* Lado derecho — logos */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 sm:gap-8 flex-1">
            {items.map((item, i) => {
              const img = (
                <Image
                  src={item.url}
                  alt={item.name}
                  width={100}
                  height={50}
                  className="h-10 sm:h-12 w-auto object-contain grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
                />
              );
              if (!item.link) return <div key={i} title={item.name}>{img}</div>;
              const isExternal = item.link.startsWith("http");
              return isExternal ? (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" title={item.name}>
                  {img}
                </a>
              ) : (
                <Link key={i} href={item.link as any} title={item.name}>
                  {img}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
