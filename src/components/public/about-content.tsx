"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import {
  Sparkles, Compass, Users, Heart,
  Eye, Radio, Target, Star,
  ArrowUpRight, CheckCircle2, Trophy,
} from "lucide-react";
import { useScrollAnimation, useStaggerAnimation } from "@/hooks/use-scroll-animation";

const ABOUT_IMG = "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=800&q=80";

const VALUE_ICONS = [Sparkles, Compass, Users, Heart] as const;
const VALUE_COLORS = [
  { color: "text-brand-teal",   bg: "bg-brand-teal/10" },
  { color: "text-brand-orange", bg: "bg-brand-orange/10" },
  { color: "text-blue-500",     bg: "bg-blue-50" },
  { color: "text-rose-500",     bg: "bg-rose-50" },
] as const;

const EXPERIENCE_ICONS = [Target, Star, Eye, Radio] as const;

export function AboutContent() {
  const t = useTranslations("about");

  const heroAnim       = useScrollAnimation({ threshold: 0.1 });
  const whoAnim        = useScrollAnimation({ threshold: 0.1 });
  const evolutionAnim  = useScrollAnimation({ threshold: 0.1 });
  const valuesTitleAnim = useScrollAnimation({ threshold: 0.1 });
  const valuesAnim     = useStaggerAnimation({ threshold: 0.1 });
  const expAnim        = useScrollAnimation({ threshold: 0.1 });
  const expItemsAnim   = useStaggerAnimation({ threshold: 0.1 });
  const essenceAnim    = useScrollAnimation({ threshold: 0.1 });
  const awardsAnim     = useScrollAnimation({ threshold: 0.1 });

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-[#faf8f5] border-b border-gray-100">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 py-20 lg:py-28">
          <div
            ref={heroAnim.ref}
            className={`${heroAnim.isVisible ? "scroll-visible" : "scroll-hidden"} text-center`}
          >
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-teal mb-4">
              {t("badge")}
            </p>
            <h1 className="font-heading text-4xl font-light text-brand-darkRed sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.1]">
              {t("title").split(" ").slice(0, -1).join(" ")}{" "}
              <span className="font-serif italic font-normal text-brand-teal">
                {t("title").split(" ").slice(-1)}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 font-light leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* ── Quiénes somos + Evolución ────────────────────────── */}
      <section className="bg-white py-20 lg:py-28 overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-2 items-center">

            {/* Imagen */}
            <div
              ref={whoAnim.ref}
              className={`${whoAnim.isVisible ? "scroll-visible-left" : "scroll-hidden-left"} relative rounded-[2.5rem] overflow-hidden aspect-[4/3] shadow-2xl`}
            >
              <Image
                src={ABOUT_IMG}
                alt="Machu Picchu, Perú"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              {/* Badge flotante */}
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-teal">Like In House</p>
                <p className="text-sm font-semibold text-brand-darkRed">{t("badge")}</p>
              </div>
            </div>

            {/* Evolución */}
            <div
              ref={evolutionAnim.ref}
              className={`${evolutionAnim.isVisible ? "scroll-visible-right" : "scroll-hidden-right"} space-y-6`}
            >
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-teal mb-2">
                  {t("evolution_badge")}
                </p>
                <h2 className="font-heading text-3xl font-light text-brand-darkRed sm:text-4xl tracking-tight">
                  {t("evolution_title")}{" "}
                  <span className="font-serif italic font-normal text-brand-teal">
                    {t("evolution_title_accent")}
                  </span>
                </h2>
              </div>

              <ul className="space-y-3">
                {(["evolution_1", "evolution_2", "evolution_3", "evolution_4"] as const).map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-teal shrink-0 mt-0.5" />
                    <span className="text-gray-600 leading-snug text-[15px]">{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Qué nos hace diferentes (4 cards) ───────────────── */}
      <section className="bg-[#faf8f5] py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div
            ref={valuesTitleAnim.ref}
            className={`${valuesTitleAnim.isVisible ? "scroll-visible" : "scroll-hidden"} text-center mb-14`}
          >
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-teal mb-3">
              {t("values_badge")}
            </p>
            <h2 className="font-heading text-3xl font-light text-brand-darkRed sm:text-4xl tracking-tight">
              {t("values_title").split(" ").slice(0, -1).join(" ")}{" "}
              <span className="font-serif italic font-normal text-brand-teal">
                {t("values_title").split(" ").slice(-1)}
              </span>
            </h2>
          </div>

          <div
            ref={valuesAnim.ref}
            className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-4 ${valuesAnim.className}`}
          >
            {([1, 2, 3, 4] as const).map((n, i) => {
              const Icon = VALUE_ICONS[i];
              const { color, bg } = VALUE_COLORS[i];
              return (
                <div
                  key={n}
                  className="group rounded-2xl bg-white p-7 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  <span className={`flex h-14 w-14 mx-auto items-center justify-center rounded-2xl ${bg} mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </span>
                  <p className="font-heading font-bold text-brand-darkRed mb-2">{t(`value_${n}`)}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{t(`value_${n}_desc`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Experiencias para Todos ──────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div
            ref={expAnim.ref}
            className={`${expAnim.isVisible ? "scroll-visible" : "scroll-hidden"} text-center mb-14`}
          >
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-teal mb-3">
              {t("experiences_badge")}
            </p>
            <h2 className="font-heading text-3xl font-light text-brand-darkRed sm:text-4xl tracking-tight">
              {t("experiences_title")}{" "}
              <span className="font-serif italic font-normal text-brand-teal">
                {t("experiences_title_accent")}
              </span>
            </h2>
          </div>

          <div
            ref={expItemsAnim.ref}
            className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-4 ${expItemsAnim.className}`}
          >
            {([1, 2, 3, 4] as const).map((n, i) => {
              const Icon = EXPERIENCE_ICONS[i];
              return (
                <div
                  key={n}
                  className="group flex flex-col items-center text-center rounded-2xl border border-gray-100 bg-[#faf8f5] p-7 hover:border-brand-teal/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-teal/10 mb-4 group-hover:bg-brand-teal/20 transition-colors">
                    <Icon className="h-6 w-6 text-brand-teal" />
                  </span>
                  <p className="text-sm text-gray-600 leading-relaxed">{t(`experience_${n}`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Nuestra Esencia (quote) ──────────────────────────── */}
      <section className="bg-brand-darkRed py-20 lg:py-28 overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div
            ref={essenceAnim.ref}
            className={`${essenceAnim.isVisible ? "scroll-visible" : "scroll-hidden"} text-center max-w-3xl mx-auto`}
          >
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-orange mb-6">
              {t("essence_badge")}
            </p>
            <blockquote className="font-heading text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-relaxed italic">
              &ldquo;{t("essence_quote")}&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* ── Reconocimientos ─────────────────────────────────── */}
      <section className="bg-[#faf8f5] py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div
            ref={awardsAnim.ref}
            className={`${awardsAnim.isVisible ? "scroll-visible" : "scroll-hidden"}`}
          >
            <div className="text-center mb-12">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-teal mb-3">
                {t("awards_badge")}
              </p>
              <h2 className="font-heading text-3xl font-light text-brand-darkRed sm:text-4xl tracking-tight">
                {t("awards_title")}{" "}
                <span className="font-serif italic font-normal text-brand-teal">
                  {t("awards_title_accent")}
                </span>
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
              {/* Plata 2024 */}
              <div className="flex-1 flex flex-col items-center text-center rounded-2xl bg-white border border-gray-200 p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                  <Trophy className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{t("award_1_year")}</p>
                <p className="font-heading text-xl font-bold text-brand-darkRed mb-2">{t("award_1_name")}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{t("award_1_desc")}</p>
              </div>

              {/* Oro 2025 */}
              <div className="flex-1 flex flex-col items-center text-center rounded-2xl bg-white border border-brand-orange/30 p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange to-yellow-400" />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange/10 mb-4">
                  <Trophy className="h-8 w-8 text-brand-orange" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-orange mb-1">{t("award_2_year")}</p>
                <p className="font-heading text-xl font-bold text-brand-darkRed mb-2">{t("award_2_name")}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{t("award_2_desc")}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <p className="text-lg text-gray-500 mb-2">{t("cta_title")}</p>
              <p className="text-sm text-gray-400 mb-6">{t("cta_desc")}</p>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-between rounded-full bg-brand-darkRed hover:bg-brand-orange text-white pl-6 pr-1.5 py-1.5 text-sm font-bold transition-all group"
              >
                {t("cta_button")}
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 group-hover:bg-white group-hover:text-brand-orange transition-colors ml-3">
                  <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
