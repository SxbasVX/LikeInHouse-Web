"use client";

import { useLocale } from "next-intl";
import Image from "next/image";
import { trpc } from "@/lib/trpc";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Award } from "lucide-react";

export function CertificationsSection() {
  const locale = useLocale();
  const isEs = locale === "es";
  const header = useScrollAnimation({ threshold: 0.2 });
  const logos = useScrollAnimation({ threshold: 0.1 });

  const { data: settings } = trpc.public.settings.useQuery(undefined, { staleTime: 10 * 60 * 1000 });
  const getSetting = (key: string) => {
    if (!settings) return "";
    return (settings as Record<string, string>)[key] || "";
  };

  const items = [1, 2, 3, 4, 5]
    .map((i) => ({
      url: getSetting(`footerLogo${i}Url`),
      link: getSetting(`footerLogo${i}Link`),
    }))
    .filter((item) => item.url);

  if (items.length === 0) return null;

  return (
    <section className="bg-white py-16 lg:py-20 border-t border-gray-100">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div
          ref={header.ref}
          className={`${header.isVisible ? "scroll-visible" : "scroll-hidden"} text-center mb-10`}
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-3">
            {isEs ? "Respaldo" : "Certifications"}
          </span>
          <h2 className="font-heading text-2xl font-bold text-gray-900 sm:text-3xl leading-tight">
            {isEs ? "Certificaciones y" : "Certifications &"}
            <br />
            <span className="font-serif italic font-normal text-brand-darkRed">
              {isEs ? "reconocimientos." : "awards."}
            </span>
          </h2>
        </div>

        <div
          ref={logos.ref}
          className={`${logos.isVisible ? "scroll-visible" : "scroll-hidden"} flex flex-wrap items-center justify-center gap-5 sm:gap-6`}
        >
          {items.map((item, i) => {
            const card = (
              <div className="group flex items-center justify-center rounded-2xl border border-gray-100 bg-[#faf8f5] p-5 sm:p-6 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-brand-orange/20">
                <Image
                  src={item.url}
                  alt={`${isEs ? "Certificación" : "Certification"} ${i + 1}`}
                  width={120}
                  height={80}
                  className="h-14 sm:h-16 w-auto object-contain"
                />
              </div>
            );
            return item.link ? (
              <a key={i} href={item.link} target="_blank" rel="noopener noreferrer">
                {card}
              </a>
            ) : (
              <div key={i}>{card}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
