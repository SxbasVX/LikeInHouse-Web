"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, ArrowUpRight, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";

const HERO_BG = "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1920&q=80";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
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
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0A0D0C]">

      {/* Background — misma foto que el landing */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src={HERO_BG}
          alt="Perú"
          fill
          priority
          className="object-cover scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D0C]/80 via-black/50 to-[#0A0D0C]/95" />
      </div>

      {/* Volver al sitio */}
      <div className="absolute top-6 left-8 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-black/50 backdrop-blur-md transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al sitio
        </Link>
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center w-full px-4">

        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/Logo-Azul.svg"
            alt="LikeInHouse"
            width={200}
            height={52}
            className="object-contain"
            priority
          />
        </div>

        {/* Título estilo landing */}
        <div className="text-center mb-10">
          <h1
            className="font-heading text-5xl sm:text-6xl font-light text-white leading-tight tracking-tight mb-2"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}
          >
            Panel
          </h1>
          <span
            className="block font-serif italic font-normal text-4xl sm:text-5xl"
            style={{
              color: "#f5dfc0",
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
              transform: "rotate(-1deg)",
              display: "inline-block",
            }}
          >
            Administrativo
          </span>
        </div>

        {/* Card glassmorphism */}
        <div className="w-full max-w-[420px] rounded-2xl border border-white/15 bg-black/40 backdrop-blur-2xl p-8 shadow-2xl">

          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-red-500/15 border border-red-500/25 p-4 text-sm text-white mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0 animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-white/80">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@likeinhouse.com"
                  className="h-12 pl-10 rounded-xl bg-white/10 border-white/15 text-white placeholder:text-white/35 focus:bg-white/15 focus:border-white/40 focus:ring-0"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-brand-orange mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-white/80">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 pl-10 pr-11 rounded-xl bg-white/10 border-white/15 text-white placeholder:text-white/35 focus:bg-white/15 focus:border-white/40 focus:ring-0"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-brand-orange mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-brand-orange hover:bg-[#e33e1a] flex items-center justify-center gap-2 text-white font-bold text-sm transition-all hover:scale-[1.02] shadow-[0_0_24px_rgba(252,69,31,0.35)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
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

        <p className="mt-8 text-white/30 text-xs">
          © {new Date().getFullYear()} LikeInHouse · Acceso restringido
        </p>
      </div>
    </div>
  );
}
