"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Target, Eye, Heart, Leaf, Users, Shield, ArrowUpRight } from "lucide-react";

import { useScrollAnimation, useStaggerAnimation } from "@/hooks/use-scroll-animation";

const ABOUT_IMG = "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=800&q=80";
const TEAM_IMG = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80";

const values = [
  { key: "value_1", icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
  { key: "value_2", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
  { key: "value_3", icon: Shield, color: "text-amber-500", bg: "bg-amber-50" },
  { key: "value_4", icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-50" },
] as const;

export function AboutContent() {
  const t = useTranslations("about");

  const heroAnim = useScrollAnimation({ threshold: 0.1 });
  const missionImgAnim = useScrollAnimation({ threshold: 0.15 });
  const missionCardsAnim = useScrollAnimation({ threshold: 0.15 });
  const valuesTitleAnim = useScrollAnimation({ threshold: 0.1 });
  const valuesAnim = useStaggerAnimation({ threshold: 0.1 });
  const teamTextAnim = useScrollAnimation({ threshold: 0.15 });
  const teamImgAnim = useScrollAnimation({ threshold: 0.15 });

  return (
    <>
      {/* Hero */}
      <section className="bg-[#faf8f5] border-b border-gray-100">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12 py-20 lg:py-28">
          <div
            ref={heroAnim.ref}
            className={`${heroAnim.isVisible ? "scroll-visible" : "scroll-hidden"} text-center`}
          >
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-teal mb-4">
              {t("badge", { fallback: "Conócenos" })}
            </p>
            <h1 className="font-heading text-4xl font-light text-brand-darkRed sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.1]">
              {t("title").split(" ").slice(0, 2).join(" ")}{" "}
              <span className="font-serif italic font-normal text-brand-teal">
                {t("title").split(" ").slice(2).join(" ") || "nuestra historia"}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 font-light leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="bg-white py-20 lg:py-28 overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            {/* Imagen — slide from left */}
            <div
              ref={missionImgAnim.ref}
              className={`${missionImgAnim.isVisible ? "scroll-visible-left" : "scroll-hidden-left"} relative rounded-[2.5rem] overflow-hidden aspect-[4/3] shadow-2xl`}
            >
              <Image
                src={ABOUT_IMG}
                alt="Peru landscape"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            {/* Cards — slide from right */}
            <div
              ref={missionCardsAnim.ref}
              className={`${missionCardsAnim.isVisible ? "scroll-visible-right" : "scroll-hidden-right"} space-y-6`}
            >
              {[
                { icon: Target, title: t("mission_title"), body: t("mission"), accent: "border-brand-orange" },
                { icon: Eye, title: t("vision_title"), body: t("vision"), accent: "border-brand-teal" },
              ].map(({ icon: Icon, title, body, accent }) => (
                <div
                  key={title}
                  className={`rounded-2xl bg-white p-7 border-l-4 ${accent} shadow-sm`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className="h-5 w-5 text-brand-darkRed" />
                    <h2 className="font-heading text-xl font-bold text-brand-darkRed">{title}</h2>
                  </div>
                  <p className="text-gray-500 leading-relaxed text-[15px]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="bg-[#faf8f5] py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div
            ref={valuesTitleAnim.ref}
            className={`${valuesTitleAnim.isVisible ? "scroll-visible" : "scroll-hidden"} text-center mb-14`}
          >
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-teal mb-3">
              Lo que nos define
            </p>
            <h2 className="font-heading text-3xl font-light text-brand-darkRed sm:text-4xl tracking-tight">
              {t("values_title").split(" ")[0]}{" "}
              <span className="font-serif italic font-normal text-brand-teal">
                {t("values_title").split(" ").slice(1).join(" ")}
              </span>
            </h2>
          </div>
          <div
            ref={valuesAnim.ref}
            className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-4 ${valuesAnim.className}`}
          >
            {values.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.key}
                  className="rounded-2xl bg-white p-7 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  <span className={`flex h-14 w-14 mx-auto items-center justify-center rounded-2xl ${val.bg} mb-4`}>
                    <Icon className={`h-6 w-6 ${val.color}`} />
                  </span>
                  <p className="font-heading font-bold text-brand-darkRed">{t(val.key)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="bg-white py-20 lg:py-28 overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            {/* Texto — slide from left */}
            <div
              ref={teamTextAnim.ref}
              className={teamTextAnim.isVisible ? "scroll-visible-left" : "scroll-hidden-left"}
            >
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-teal mb-3">
                Nuestro equipo
              </p>
              <h2 className="font-heading text-3xl font-light text-brand-darkRed sm:text-4xl tracking-tight mb-4">
                Guías locales{" "}
                <span className="font-serif italic font-normal text-brand-teal">expertos</span>
              </h2>
              <p className="text-gray-500 leading-relaxed text-[15px] mb-6">
                Nuestro equipo está formado por guías locales certificados que conocen cada rincón del Perú.
                Con años de experiencia, hacemos que cada viaje sea una experiencia auténtica e inolvidable.
              </p>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-between rounded-full bg-brand-darkRed hover:bg-brand-orange text-white pl-6 pr-1.5 py-1.5 text-sm font-bold transition-all group"
              >
                Conócenos
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 group-hover:bg-white group-hover:text-brand-orange transition-colors ml-3">
                  <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                </span>
              </Link>
            </div>

            {/* Imagen — slide from right */}
            <div
              ref={teamImgAnim.ref}
              className={`${teamImgAnim.isVisible ? "scroll-visible-right" : "scroll-hidden-right"} relative rounded-[2.5rem] overflow-hidden aspect-[4/3] shadow-2xl`}
            >
              <Image
                src={TEAM_IMG}
                alt="Nuestro equipo"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
