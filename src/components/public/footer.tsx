"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Map, Mail, Phone, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";

// Use a fixed year to avoid hydration mismatch between server and client
const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");

  const { data: settings } = trpc.public.settings.useQuery(undefined, { staleTime: 10 * 60 * 1000 });
  const getSetting = (key: string, fallback: string) => {
    if (!settings) return fallback;
    // settings is Record<string, string> from Object.fromEntries in cache.ts
    const record = settings as Record<string, string>;
    return record[key] || fallback;
  };

  const address = getSetting("address", "Av. El Sol 456, Cusco, Peru");
  const phone = getSetting("phone", "+51 84 123 456");
  const email = getSetting("contactEmail", "info@perutours.com");

  return (
    <footer className="border-t bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Map className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-white">LikeInHouse</span>
            </div>
            <p className="text-sm leading-relaxed">{t("description")}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t("quick_links")}
            </h3>
            <ul className="space-y-2">
              {[
                { label: tc("tours"), href: "/tours" },
                { label: tc("about"), href: "/nosotros" },
                { label: tc("blog"), href: "/blog" },
                { label: tc("faq"), href: "/faq" },
                { label: tc("contact"), href: "/contacto" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              {t("contact_info")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                {address}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                {phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                {email}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs">
          <p>
            &copy; {CURRENT_YEAR} LikeInHouse.{" "}
            {tc("all_rights")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
