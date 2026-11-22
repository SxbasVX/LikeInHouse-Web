"use client";

import { useLocale, useTranslations } from "next-intl";
import { Mail, Phone } from "lucide-react";
import { Link } from "@/i18n/routing";
import { trpc } from "@/lib/trpc";
import { getBaseUrl } from "@/lib/seo";
import { TextileBand } from "@/components/familia/textile";

const YEAR = new Date().getFullYear();

const EXPLORE = [
  { key: "nav_tours", href: "/tours" },
  { key: "nav_about", href: "/nosotros" },
  { key: "nav_faq", href: "/faq" },
  { key: "nav_contact", href: "/contacto" },
] as const;

const LEGAL = [
  { key: "legal_complaints", href: "/libro-reclamaciones" },
  { key: "legal_terms", href: "/terminos" },
  { key: "legal_cancellation", href: "/politicas-cancelacion" },
  { key: "legal_privacy", href: "/privacidad" },
] as const;

const SOCIALS = [
  { name: "Facebook", key: "facebookUrl", fallback: "https://www.facebook.com/likeinhouseperu" },
  { name: "Instagram", key: "instagramUrl", fallback: "https://www.instagram.com/likeinhouseperu" },
  { name: "TikTok", key: "tiktokUrl", fallback: "https://www.tiktok.com/@likeinhouseperu" },
];

const linkCls = "rounded text-sm text-white/75 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fam-maiz";

export function FamilyFooter() {
  const t = useTranslations("familia");
  const locale = useLocale();
  const { data: settings } = trpc.public.settings.useQuery(undefined, { staleTime: 10 * 60 * 1000 });
  const get = (key: string, fallback: string) => {
    const v = (settings as Record<string, unknown> | undefined)?.[key];
    return typeof v === "string" && v ? v : fallback;
  };
  const phone = get("phone", "+51 913 406 888");
  const email = get("contactEmail", "info@likeinhouseperu.com");

  return (
    <footer className="mt-auto">
      <TextileBand />
      <div className="bg-fam-valle text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="font-familia text-2xl text-white">{t("site_name")}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/75">{t("footer_text")}</p>
            <a href={`${getBaseUrl()}/${locale}`} className={`mt-4 inline-block font-semibold ${linkCls}`}>
              {t("nav_main_site")}
            </a>
          </div>

          <nav aria-label={t("footer_explore")}>
            <p className="text-sm font-bold text-fam-maiz">{t("footer_explore")}</p>
            <ul className="mt-3 space-y-2">
              {EXPLORE.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkCls}>{t(l.key)}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("footer_legal")}>
            <p className="text-sm font-bold text-fam-maiz">{t("footer_legal")}</p>
            <ul className="mt-3 space-y-2">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkCls}>{t(l.key)}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-sm font-bold text-fam-maiz">{t("footer_contact")}</p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className={linkCls}>{phone}</a>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={`mailto:${email}`} className={`break-all ${linkCls}`}>{email}</a>
              </li>
            </ul>
            <ul className="mt-4 flex flex-wrap gap-2">
              {SOCIALS.map((s) => (
                <li key={s.name}>
                  <a
                    href={get(s.key, s.fallback)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-full border border-white/30 px-3 py-1 text-xs font-bold text-white/85 hover:border-white hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fam-maiz"
                  >
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/65 sm:px-6">
            © {YEAR} Like In House S.R.L. {t("footer_rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
