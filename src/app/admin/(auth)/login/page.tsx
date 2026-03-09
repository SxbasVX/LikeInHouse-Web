"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Map, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        {/* Decorative shapes */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Map className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight">LikeInHouse</span>
          </div>

          {/* Illustration area */}
          <div className="relative mb-10">
            <div className="w-64 h-64 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Shield className="h-20 w-20 text-white/80" />
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -top-2 -right-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
              Admin
            </div>
            <div className="absolute -bottom-2 -left-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
              Panel
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-3 text-center">
            Panel de Gestion
          </h2>
          <p className="text-white/70 text-center max-w-sm leading-relaxed">
            Gestiona tours, reservas, cotizaciones y contenido de tu plataforma desde un solo lugar.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-10 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <Map className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">LikeInHouse</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center">
              Iniciar sesion
            </h1>
            <p className="text-gray-500 text-center mt-2 mb-8 text-sm">
              Ingresa tus credenciales para acceder
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3.5 text-sm text-red-600 text-center">
                  {error}
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-gray-500 pl-1">
                  Email o usuario
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 px-4 text-sm placeholder:text-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20"
                  {...register("email", {
                    required: "Email requerido",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Email invalido",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 pl-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-gray-500 pl-1">
                  Contrasena
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className="h-12 rounded-xl border-gray-200 bg-gray-50/50 px-4 pr-11 text-sm placeholder:text-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20"
                    {...register("password", {
                      required: "Password requerido",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 pl-1">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all hover:shadow-md"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Ingresando...
                  </span>
                ) : (
                  "Ingresar"
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Acceso restringido a personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}
