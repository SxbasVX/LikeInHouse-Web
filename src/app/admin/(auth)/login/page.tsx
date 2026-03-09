"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Map, Eye, EyeOff, ShieldCheck, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        setError("Credenciales incorrectas");
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
    <div className="flex min-h-screen bg-[#09090b] font-sans text-neutral-200 selection:bg-brand-teal/30">
      {/* Left Panel - Branding (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-950 border-r border-white/5">
        {/* Stunning Ambient Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-brand-teal/20 blur-[130px] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-orange/10 blur-[120px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite] delay-1000" />

        {/* Noise overlay for texture */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/40 to-zinc-950 z-0 pointer-events-none" />

        <div className={cn(
          "relative z-10 flex flex-col justify-center h-full w-full px-16 xl:px-24 transition-all duration-1000 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        )}>
          {/* Logo Section */}
          <div className="flex items-center gap-4 mb-20 transition-all duration-700 delay-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-teal to-brand-darkTeal shadow-lg shadow-brand-teal/20 border border-white/10">
              <Map className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-heading font-black tracking-tight text-white flex items-center gap-1.5">
              LikeIn<span className="text-brand-teal">House</span>
            </span>
          </div>

          <div className="max-w-xl space-y-8 relative z-10">
            <h1 className="text-5xl xl:text-6xl font-heading font-bold text-white leading-[1.15] tracking-tight">
              Gestión total<br />de tus viajes.
            </h1>
            <p className="text-lg text-neutral-400 leading-relaxed max-w-md">
              Administra tours integrales, controla tus reservas y gestiona a tus clientes desde un panel de control avanzado.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-8">
              <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm shadow-xl shadow-black/20">
                <ShieldCheck className="h-6 w-6 text-brand-teal mb-2" />
                <span className="font-semibold text-white">Seguridad 100%</span>
                <span className="text-sm text-neutral-500">Datos encriptados y protegidos</span>
              </div>
              <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm shadow-xl shadow-black/20">
                <Map className="h-6 w-6 text-brand-orange mb-2" />
                <span className="font-semibold text-white">Control Global</span>
                <span className="text-sm text-neutral-500">Maneja todo desde un solo lugar</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Subtle ambient light on the right */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-teal/10 blur-[150px] rounded-full pointer-events-none" />

        <div className={cn(
          "w-full max-w-[400px] relative z-10 transition-all duration-700 delay-300 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          {/* Mobile Header */}
          <div className="flex flex-col items-center mb-10 lg:hidden text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-teal to-brand-darkTeal shadow-lg shadow-brand-teal/20 border border-white/10 mb-5">
              <Map className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-heading font-black tracking-tight text-white mb-2">LikeInHouse</h1>
            <p className="text-neutral-400 text-sm">Acceso al Panel Administrativo</p>
          </div>

          <div className="flex flex-col space-y-8">
            <div className="hidden lg:block space-y-2 mb-2">
              <h2 className="text-3xl font-heading font-bold text-white tracking-tight">Bienvenido</h2>
              <p className="text-neutral-400 text-sm">Ingresa tus credenciales para continuar.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 font-medium animate-in slide-in-from-top-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Email input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider ml-1">
                    Correo Electrónico
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 group-focus-within:text-brand-teal transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="admin@likeinhouse.com"
                      className="h-14 rounded-xl bg-white/[0.03] border-white/10 pl-11 pr-4 text-white placeholder:text-neutral-600 focus:bg-white/[0.06] focus:border-brand-teal/50 focus:ring-1 focus:ring-brand-teal/50 transition-all duration-300"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-400 ml-1 font-medium mt-1.5">{errors.email.message}</p>}
                </div>

                {/* Password input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider ml-1">
                    Contraseña
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 group-focus-within:text-brand-teal transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-14 rounded-xl bg-white/[0.03] border-white/10 pl-11 pr-12 text-white placeholder:text-neutral-600 focus:bg-white/[0.06] focus:border-brand-teal/50 focus:ring-1 focus:ring-brand-teal/50 transition-all duration-300"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-400 ml-1 font-medium mt-1.5">{errors.password.message}</p>}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-14 rounded-xl bg-brand-teal hover:bg-brand-teal/90 text-white font-medium text-base shadow-lg shadow-brand-teal/20 transition-all duration-300 hover:shadow-brand-teal/30 hover:-translate-y-0.5 mt-2 group relative overflow-hidden"
                  disabled={isLoading}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[shimmer_2s_infinite]" />

                  {isLoading ? (
                    <span className="flex items-center gap-3">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Ingresando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Acceder al Panel
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-3 pt-4 text-neutral-600 text-xs font-medium">
              <div className="h-px w-12 bg-white/5" />
              <span>Acceso seguro y restringido</span>
              <div className="h-px w-12 bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
