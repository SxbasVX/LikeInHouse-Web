"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { trpc } from "@/lib/trpc";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
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
  const section = useScrollAnimation({ threshold: 0.2 });

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
    <section className="bg-brand-darkRed py-12 lg:py-14 relative overflow-hidden">
      {/* Glow naranja sutil de fondo */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full bg-brand-orange/10 blur-3xl pointer-events-none" />

      <div
        ref={section.ref}
        className={`${section.isVisible ? "scroll-visible" : "scroll-hidden"} relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8`}
      >
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Lado izquierdo — texto */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange/15 ring-1 ring-brand-orange/30">
              <Award className="h-6 w-6 text-brand-orange" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {isEs ? "Certificaciones y avales" : "Certifications & awards"}
              </p>
              <p className="text-xs text-white/60">
                {isEs ? "Avalados por instituciones del sector turismo" : "Endorsed by tourism industry institutions"}
              </p>
            </div>
          </div>

          {/* Separador */}
          <div className="hidden md:block w-px h-12 bg-white/15" />

          {/* Lado derecho — logos */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-5 flex-1">
            {items.map((item, i) => {
              const img = (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.name}
                  loading="lazy"
                  className="h-10 sm:h-12 w-auto max-w-[140px] object-contain opacity-85 group-hover:opacity-100 transition-all duration-300"
                />
              );
              const wrap = (children: React.ReactNode) => (
                <div className="group flex items-center justify-center h-16 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] ring-1 ring-white/10 hover:ring-white/25 transition-all duration-300">
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
