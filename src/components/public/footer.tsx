"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { trpc } from "@/lib/trpc";
import Image from "next/image";
import { MapPin, Phone, Mail, ArrowUpRight } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

const SOCIALS = [
  {
    name: "YouTube",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
];

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");

  const { data: settings } = trpc.public.settings.useQuery(undefined, { staleTime: 10 * 60 * 1000 });
  const getSetting = (key: string, fallback: string) => {
    if (!settings) return fallback;
    return (settings as Record<string, string>)[key] || fallback;
  };

  const address = getSetting("address", "Av. El Sol 456, Cusco, Perú");
  const phone = getSetting("phone", "+51 84 123 456");
  const email = getSetting("contactEmail", "info@likeinhouse.com");

  return (
    <footer className="relative overflow-hidden">

      {/* ── SILUETA ANDINA ─────────────────────────────────── */}
      {/* Transición visual desde el contenido de la página al footer oscuro */}
      <div className="relative bg-gray-50 leading-[0]">
        <svg
          viewBox="0 0 1440 220"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full block"
          preserveAspectRatio="none"
        >
          {/* Capa de fondo — montañas lejanas (tono medio-oscuro) */}
          <path
            d="M0,180 L60,155 L110,165 L170,130 L230,145 L290,105 L340,120 L400,85 L450,100 L490,75 L530,90 L580,60 L630,80 L680,55 L720,70 L760,48 L810,65 L860,40 L910,58 L960,35 L1010,55 L1060,30 L1110,50 L1160,25 L1200,45 L1250,20 L1300,42 L1350,18 L1400,38 L1440,15 L1440,220 L0,220 Z"
            fill="#2A1210"
          />
          {/* Capa media — Andes intermedios */}
          <path
            d="M0,200 L50,178 L100,188 L160,162 L210,175 L260,148 L310,160 L370,132 L420,145 L470,118 L520,135 L570,108 L620,125 L670,98 L720,115 L775,88 L825,105 L875,80 L920,98 L970,72 L1020,90 L1075,65 L1125,82 L1170,58 L1220,75 L1270,52 L1320,70 L1370,48 L1440,60 L1440,220 L0,220 Z"
            fill="#3D1715"
          />
          {/* Capa frontal — montañas más cercanas y oscuras */}
          <path
            d="M0,220 L0,210 L40,195 L80,205 L130,185 L185,198 L230,175 L270,188 L320,165 L370,180 L415,158 L455,172 L500,150 L545,165 L590,142 L640,158 L690,134 L735,150 L780,128 L830,145 L880,120 L920,138 L965,115 L1010,132 L1060,108 L1110,125 L1155,102 L1200,118 L1250,95 L1300,112 L1350,90 L1400,108 L1440,88 L1440,220 Z"
            fill="#1C0D0C"
          />
        </svg>
      </div>

      {/* ── CUERPO DEL FOOTER ───────────────────────────────── */}
      <div className="bg-[#1C0D0C]">
        <div className="mx-auto max-w-[1400px] px-4 pt-10 pb-6 sm:px-6 lg:px-12">

          {/* Grid principal */}
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 lg:gap-16 pb-12 border-b border-white/8">

            {/* Columna marca */}
            <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-5">
              <Link href="/" className="inline-block">
                <Image
                  src="/Logo.svg"
                  alt="Like In House"
                  width={180}
                  height={46}
                  className="w-36 sm:w-44 h-auto object-contain brightness-0 invert"
                />
              </Link>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                {t("description", { fallback: "Experiencias auténticas en Perú con guías locales expertos, transporte seguro y momentos que duran toda la vida." })}
              </p>

              {/* Redes sociales */}
              <div className="flex items-center gap-2 mt-1">
                {SOCIALS.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    aria-label={s.name}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/40 hover:border-brand-orange hover:text-brand-orange transition-all hover:-translate-y-0.5"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>

              {/* CTA reservar */}
              <Link
                href="/tours"
                className="mt-2 inline-flex w-fit items-center justify-between rounded-full bg-brand-orange hover:bg-brand-darkRed text-white pl-5 pr-1.5 py-1.5 text-sm font-bold transition-all group"
              >
                Ver todos los tours
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 group-hover:bg-white group-hover:text-brand-orange transition-colors ml-3">
                  <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                </span>
              </Link>
            </div>

            {/* Columnas de navegación y contacto */}
            <div className="md:col-span-7 lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-10">

              {/* Destinos / Links */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">
                  Explora
                </h4>
                <ul className="space-y-3">
                  {[
                    { label: tc("home", { fallback: "Inicio" }), href: "/" },
                    { label: tc("tours", { fallback: "Tours" }), href: "/tours" },
                    { label: tc("about", { fallback: "Nosotros" }), href: "/nosotros" },
                    { label: "Blog", href: "/blog" },
                    { label: tc("faq", { fallback: "Preguntas Frecuentes" }), href: "/faq" },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/55 hover:text-brand-orange transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contacto */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">
                  Contacto
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-start gap-2.5">
                    <Mail className="h-4 w-4 mt-0.5 shrink-0 text-brand-orange" />
                    <span className="text-sm text-white/55 break-all">{email}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Phone className="h-4 w-4 mt-0.5 shrink-0 text-brand-orange" />
                    <span className="text-sm text-white/55">{phone}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-brand-orange" />
                    <span className="text-sm text-white/55 leading-snug">{address}</span>
                  </li>
                </ul>
              </div>

              {/* Newsletter */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-5">
                  Newsletter
                </h4>
                <p className="text-sm text-white/45 mb-4 leading-relaxed">
                  Ofertas exclusivas y tips de viaje directo a tu correo.
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-brand-orange/50 transition-colors"
                  />
                  <button className="w-full rounded-full bg-white/10 hover:bg-brand-orange text-white text-sm font-semibold py-2.5 transition-all">
                    Suscribirme
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-white/25">
              © {CURRENT_YEAR} LikeInHouse. {tc("all_rights", { fallback: "Todos los derechos reservados." })}
            </p>
            <p className="text-xs text-white/20">
              Hecho con ♥ en Cusco, Perú
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
