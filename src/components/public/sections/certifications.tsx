"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { trpc } from "@/lib/trpc";
import { Award } from "lucide-react";

const CERT_NAMES = [
  "Mincetur",
  "PromPerú",
  "Y tú qué planes?",
  "Gercetur Cusco",
  "Dircetur Tumbes",
];

export function CertificationsSection() {
  const locale = useLocale();
  const isEs = locale === "es";

  const { data: settings } = trpc.public.settings.useQuery(undefined, { staleTime: 30 * 1000 });
  const getSetting = (key: string) => {
    if (!settings) return "";
    return (settings as Record<string, string>)[key] || "";
  };

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
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Lado izquierdo — texto */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10">
              <Award className="h-6 w-6 text-brand-teal" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">
                {isEs ? "Certificaciones y avales" : "Certifications & awards"}
              </p>
              <p className="text-xs text-gray-500">
                {isEs ? "Avalados por instituciones del sector turismo" : "Endorsed by tourism industry institutions"}
              </p>
            </div>
          </div>

          {/* Separador */}
          <div className="hidden md:block w-px h-12 bg-brand-teal/15" />

          {/* Lado derecho — logos */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-5 flex-1">
            {items.map((item, i) => {
              const img = (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.name}
                  loading="lazy"
                  className="h-12 sm:h-14 w-auto max-w-[160px] object-contain opacity-90 group-hover:opacity-100 transition-all duration-300"
                />
              );
              const wrap = (children: React.ReactNode) => (
                <div className="group flex items-center justify-center h-20 px-5 rounded-xl bg-gray-100/60 hover:bg-gray-200/70 ring-1 ring-gray-200 hover:ring-gray-300 transition-all duration-300">
                  {children}
                </div>
              );
              if (!item.link) return <div key={i} title={item.name}>{wrap(img)}</div>;
              const isExternal = item.link.startsWith("http");
              return isExternal ? (
                <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" title={item.name}>
                  {wrap(img)}
                </a>
              ) : (
                <Link key={i} href={item.link as any} title={item.name}>
                  {wrap(img)}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
