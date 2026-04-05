"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, ArrowUpRight, ArrowLeft, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";

// Imagen más pequeña = carga más rápida
const HERO_BG = "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1400&q=75";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Error al iniciar sesión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0A0D0C] p-4 sm:p-6">

      {/* Fondo — sin scale ni blur, solo overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src={HERO_BG}
          alt="Perú"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={75}
        />
        {/* Un solo overlay sólido — sin backdrop-filter */}
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,13,12,0.72)" }} />
      </div>

      {/* Volver al sitio — sin blur */}
      <div className="absolute top-5 left-5 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al sitio
        </Link>
      </div>

      {/* Logo encima del card */}
      <div className="relative z-10 mb-5 flex justify-center">
        <Image
          src="/Logo-Azul.svg"
          alt="LikeInHouse"
          width={260}
          height={67}
          className="object-contain"
          priority
        />
      </div>

      {/* Card — sin backdrop-blur, fondo sólido */}
      <div className="relative z-10 flex w-full max-w-[760px] rounded-3xl overflow-hidden shadow-2xl">

        {/* Panel izquierdo naranja */}
        <div
          className="hidden md:flex w-[42%] flex-col justify-between p-8 relative overflow-hidden"
          style={{ backgroundColor: "#e8411d" }}
        >
          {/* Círculos decorativos (solo CSS, sin filtros) */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-12 w-64 h-64 rounded-full bg-white/8" />
          <div className="absolute top-1/2 -right-10 w-36 h-36 rounded-full bg-white/8" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-1.5 text-white/60 text-xs font-semibold uppercase tracking-widest">
              <MapPin className="h-3.5 w-3.5" />
              Agencia de turismo · Perú
            </div>
            <h2 className="font-heading text-2xl font-bold text-white leading-snug">
              Gestiona tu agencia desde un solo lugar
            </h2>
            <p className="text-white/65 text-sm leading-relaxed">
              Tours, reservas, clientes y pagos. Todo centralizado.
            </p>
          </div>

          <p className="relative z-10 text-white/35 text-[11px]">
            Hecho por Vyper Design
          </p>
        </div>

        {/* Panel derecho — fondo sólido oscuro, sin backdrop-blur */}
        <div className="flex-1 bg-[#111111] border-l border-white/8 p-8 flex flex-col justify-center">

          {/* Logo mobile */}
          <div className="md:hidden mb-6 flex justify-center">
            <Image src="/Logo-Azul.svg" alt="LikeInHouse" width={160} height={41} className="object-contain" priority />
          </div>

          <div className="mb-7">
            <h1 className="font-heading text-2xl font-bold text-white mb-1">
              Bienvenido de vuelta
            </h1>
            <p className="text-sm font-serif italic" style={{ color: "#f5dfc0" }}>
              Ingresa tus credenciales para acceder
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-red-900/40 border border-red-500/30 p-4 text-sm text-red-200 mb-5">
              <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-white/75">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@likeinhouse.com"
                  className="h-11 pl-10 rounded-xl border-white/12 placeholder:text-white/30 focus:ring-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#ffffff" }}
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-brand-orange mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-white/75">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/35" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 pl-10 pr-11 rounded-xl border-white/12 placeholder:text-white/30 focus:ring-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#ffffff" }}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/75 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-brand-orange mt-1">{errors.password.message}</p>}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-brand-orange hover:bg-[#d03a18] flex items-center justify-center gap-2 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Iniciar sesión
                    <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
