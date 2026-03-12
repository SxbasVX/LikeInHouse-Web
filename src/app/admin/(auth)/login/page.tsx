"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const BG_IMAGE = "https://images.unsplash.com/photo-1526392060635-9d60198d3de3?q=80&w=2000&auto=format&fit=crop"; 

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
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 font-sans overflow-hidden">
      
      {/* Background Image & Overlays */}
      <div className="absolute inset-0 z-0">
        <Image
          src={BG_IMAGE}
          alt="Peru Landscape"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      </div>

      {/* Back to Home Button */}
      <Link 
        href="/" 
        className={cn(
          "absolute top-8 left-8 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-all bg-black/20 hover:bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al sitio
      </Link>

      {/* Login Card */}
      <div className={cn(
        "relative z-10 w-full max-w-[440px] transition-all duration-1000 ease-out",
        mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
      )}>
        
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Subtle noise texture and light over the glass */}
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-white/5 rotate-12 pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center mb-9 text-center relative z-10">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-xl mb-6">
              <Image
                src="/Logo.svg"
                alt="LikeInHouse Logo"
                width={192}
                height={64}
                className="w-40 sm:w-48 h-auto object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl font-heading font-medium text-white tracking-tight mb-2">
              Panel Administrativo
            </h1>
            <p className="text-white/70 text-[15px] font-light">
              Ingresa tus credenciales para acceder a la gestión
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            
            {error && (
              <div className="flex items-center gap-3 rounded-xl bg-red-500/20 border border-red-500/30 p-4 text-sm text-white font-medium backdrop-blur-md animate-in slide-in-from-top-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-white/90 ml-1">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-focus-within:text-white transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@likeinhouse.com"
                    className="h-14 rounded-2xl bg-white/10 border-white/20 pl-12 pr-4 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all duration-300"
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="text-xs text-brand-orange ml-1 font-medium mt-1">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-white/90 ml-1">
                  Contraseña
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-focus-within:text-white transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-14 rounded-2xl bg-white/10 border-white/20 pl-12 pr-12 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all duration-300"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-brand-orange ml-1 font-medium mt-1">{errors.password.message}</p>}
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-14 rounded-full bg-brand-orange hover:bg-brand-darkRed text-white font-medium text-[15px] shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <LogIn className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
            
          </form>
          
        </div>
        
        <div className="mt-8 text-center text-white/60 text-xs font-light">
          <p>© {new Date().getFullYear()} LikeInHouse. Acceso restringido.</p>
        </div>
        
      </div>
    </div>
  );
}
