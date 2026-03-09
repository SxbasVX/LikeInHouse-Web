"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Map, Eye, EyeOff, Shield, Plane, Mountain, Globe2, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "Password requerido"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

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
        setError("Credenciales incorrectas");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Error al iniciar sesion. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-brand-darkRed">
      {/* Left Panel - Branding (desktop) */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-darkTeal via-brand-teal to-brand-darkTeal" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-teal/20 via-transparent to-transparent" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        {/* Floating animated orbs */}
        <div className="absolute top-[15%] left-[10%] w-72 h-72 rounded-full bg-brand-teal/15 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[5%] w-96 h-96 rounded-full bg-brand-orange/10 blur-[120px] animate-pulse" style={{ animationDelay: "1s", animationDuration: "4s" }} />
        <div className="absolute top-[60%] left-[40%] w-48 h-48 rounded-full bg-brand-beige/10 blur-[80px] animate-pulse" style={{ animationDelay: "2s", animationDuration: "5s" }} />

        <div className={cn(
          "relative z-10 flex flex-col items-center justify-center w-full px-16 text-white transition-all duration-1000",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          {/* Logo */}
          <div className={cn(
            "flex items-center gap-4 mb-16 transition-all duration-700 delay-200",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          )}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <Map className="h-6 w-6 text-brand-orange" />
            </div>
            <span className="text-2xl font-heading font-bold tracking-tight text-white/90">LikeInHouse</span>
          </div>

          {/* Central illustration */}
          <div className={cn(
            "relative mb-14 transition-all duration-1000 delay-300",
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"
          )}>
            {/* Outer ring - slow spin */}
            <div className="w-72 h-72 rounded-full border border-white/[0.08] flex items-center justify-center animate-[spin_30s_linear_infinite]">
              {/* Orbit icons */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="h-7 w-7 rounded-lg bg-brand-orange/20 backdrop-blur-sm border border-brand-orange/30 flex items-center justify-center">
                  <Plane className="h-3.5 w-3.5 text-brand-orange" />
                </div>
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <div className="h-7 w-7 rounded-lg bg-brand-beige/20 backdrop-blur-sm border border-brand-beige/30 flex items-center justify-center">
                  <Globe2 className="h-3.5 w-3.5 text-brand-beige" />
                </div>
              </div>
              <div className="absolute top-1/2 -left-3 -translate-y-1/2">
                <div className="h-7 w-7 rounded-lg bg-brand-teal/30 backdrop-blur-sm border border-brand-teal/40 flex items-center justify-center">
                  <Mountain className="h-3.5 w-3.5 text-white/80" />
                </div>
              </div>
              <div className="absolute top-1/2 -right-3 -translate-y-1/2">
                <div className="h-7 w-7 rounded-lg bg-brand-orange/20 backdrop-blur-sm border border-brand-orange/30 flex items-center justify-center">
                  <Compass className="h-3.5 w-3.5 text-brand-orange" />
                </div>
              </div>
            </div>

            {/* Middle ring */}
            <div className="absolute inset-8 rounded-full border border-white/[0.06]" />

            {/* Center shield */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-teal/25 to-brand-orange/15 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl shadow-brand-darkTeal/30">
                <Shield className="h-14 w-14 text-brand-beige/80" />
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-8 animate-[bounce_3s_ease-in-out_infinite]">
              <div className="px-4 py-2 bg-white/[0.07] backdrop-blur-md rounded-xl border border-white/10 text-xs font-medium text-white/80 shadow-lg">
                Panel Admin
              </div>
            </div>
            <div className="absolute -bottom-4 -left-6 animate-[bounce_3s_ease-in-out_infinite]" style={{ animationDelay: "1.5s" }}>
              <div className="px-4 py-2 bg-white/[0.07] backdrop-blur-md rounded-xl border border-white/10 text-xs font-medium text-white/80 shadow-lg">
                Gestion Total
              </div>
            </div>
          </div>

          {/* Text */}
          <div className={cn(
            "text-center transition-all duration-700 delay-500",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <h2 className="text-3xl font-heading font-bold mb-3 bg-gradient-to-r from-white to-brand-beige bg-clip-text text-transparent">
              Panel de Gestion
            </h2>
            <p className="text-white/50 max-w-sm leading-relaxed text-sm">
              Gestiona tours, reservas, cotizaciones y contenido de tu plataforma desde un solo lugar.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full lg:w-[45%] items-center justify-center px-6 py-12 bg-brand-darkRed relative">
        {/* Subtle gradient on right panel */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-darkTeal/10 via-transparent to-transparent" />

        <div className={cn(
          "w-full max-w-[420px] relative z-10 transition-all duration-700 delay-100",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}>
          {/* Mobile branding */}
          <div className={cn(
            "flex flex-col items-center mb-10 lg:hidden transition-all duration-500",
            mounted ? "opacity-100" : "opacity-0"
          )}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-teal/20 border border-brand-teal/30 mb-4">
              <Map className="h-7 w-7 text-brand-teal" />
            </div>
            <span className="text-2xl font-heading font-bold text-white tracking-tight">LikeInHouse</span>
            <p className="text-white/40 text-sm mt-1">Panel de Gestion</p>
          </div>

          {/* Form card */}
          <div className={cn(
            "bg-[#1a1520] rounded-3xl border border-white/[0.06] p-8 sm:p-10 shadow-2xl shadow-black/20 transition-all duration-700 delay-200",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className={cn(
              "transition-all duration-500 delay-300",
              mounted ? "opacity-100" : "opacity-0"
            )}>
              <h1 className="text-2xl font-heading font-bold text-white text-center">
                Iniciar sesion
              </h1>
              <p className="text-white/40 text-center mt-2 mb-8 text-sm">
                Ingresa tus credenciales para acceder
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 text-center animate-[shake_0.5s_ease-in-out]">
                  {error}
                </div>
              )}

              {/* Email field */}
              <div className={cn(
                "space-y-2 transition-all duration-500 delay-[400ms]",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              )}>
                <label htmlFor="email" className="text-xs font-medium text-white/40 pl-1 uppercase tracking-wider">
                  Email o usuario
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="h-13 rounded-xl bg-white/[0.04] border-white/[0.08] px-4 text-sm text-white placeholder:text-white/20 focus:bg-white/[0.06] focus:border-brand-teal/50 focus:ring-1 focus:ring-brand-teal/20 transition-all duration-300"
                  {...register("email", {
                    required: "Email requerido",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Email invalido",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-xs text-red-400 pl-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password field */}
              <div className={cn(
                "space-y-2 transition-all duration-500 delay-500",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              )}>
                <label htmlFor="password" className="text-xs font-medium text-white/40 pl-1 uppercase tracking-wider">
                  Contrasena
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className="h-13 rounded-xl bg-white/[0.04] border-white/[0.08] px-4 pr-12 text-sm text-white placeholder:text-white/20 focus:bg-white/[0.06] focus:border-brand-teal/50 focus:ring-1 focus:ring-brand-teal/20 transition-all duration-300"
                    {...register("password", {
                      required: "Password requerido",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors duration-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 pl-1">{errors.password.message}</p>
                )}
              </div>

              {/* Submit button */}
              <div className={cn(
                "pt-2 transition-all duration-500 delay-[600ms]",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              )}>
                <Button
                  type="submit"
                  className="w-full h-13 rounded-xl bg-gradient-to-r from-brand-orange to-[#ff5a33] hover:from-[#ff5a33] hover:to-brand-orange text-white font-heading font-semibold text-sm shadow-lg shadow-brand-orange/20 transition-all duration-300 hover:shadow-brand-orange/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2.5">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Verificando...
                    </span>
                  ) : (
                    "Ingresar"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer text */}
          <div className={cn(
            "text-center mt-8 transition-all duration-500 delay-700",
            mounted ? "opacity-100" : "opacity-0"
          )}>
            <div className="flex items-center justify-center gap-2 text-white/20 text-xs">
              <div className="h-px w-8 bg-white/10" />
              <span>Acceso restringido</span>
              <div className="h-px w-8 bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
