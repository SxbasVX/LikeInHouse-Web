"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, LogIn, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";

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
    <div className="min-h-screen flex" style={{ backgroundColor: "hsl(26,44%,94%)" }}>

      {/* Panel izquierdo — brand */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: "#e8411d" }}
      >
        {/* Círculos decorativos */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-15"
          style={{ backgroundColor: "#fff" }}
        />
        <div
          className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: "#fff" }}
        />
        <div
          className="absolute top-1/2 -right-16 w-48 h-48 rounded-full opacity-10"
          style={{ backgroundColor: "#fff" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Image
            src="/Logo-Azul.svg"
            alt="LikeInHouse"
            width={200}
            height={52}
            className="object-contain"
            priority
          />
        </div>

        {/* Texto central */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2 text-white/70 text-sm font-medium uppercase tracking-widest">
            <MapPin className="h-4 w-4" />
            Agencia de turismo · Perú
          </div>
          <h2 className="font-heading text-4xl font-bold text-white leading-tight">
            Gestiona tu agencia<br />desde un solo lugar
          </h2>
          <p className="text-white/75 text-base leading-relaxed max-w-xs">
            Tours, reservas, clientes y pagos. Todo centralizado para que te enfoques en lo que importa.
          </p>
        </div>

        {/* Footer del panel */}
        <div className="relative z-10">
          <p className="text-white/50 text-xs">
            © {new Date().getFullYear()} LikeInHouse · Acceso restringido
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">

        {/* Volver al sitio */}
        <div className="absolute top-6 right-8">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al sitio
          </Link>
        </div>

        {/* Logo mobile */}
        <div className="lg:hidden mb-8">
          <Image
            src="/Logo-Azul.svg"
            alt="LikeInHouse"
            width={160}
            height={41}
            className="object-contain"
            priority
          />
        </div>

        <div className="w-full max-w-[400px]">

          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-gray-900 tracking-tight mb-1">
              Bienvenido de vuelta
            </h1>
            <p className="text-gray-500 text-sm">
              Ingresa tus credenciales para acceder al panel
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {error && (
              <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@likeinhouse.com"
                  className="h-12 pl-10 rounded-xl border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:ring-orange-400/20"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 pl-10 pr-11 rounded-xl border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:ring-orange-400/20"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl font-semibold text-white text-sm shadow-sm transition-all"
                style={{ backgroundColor: "#e8411d" }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Ingresando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Iniciar sesión
                    <LogIn className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
