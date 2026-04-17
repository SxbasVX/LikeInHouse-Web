"use client";

import { useEffect, useState } from "react";

export function PageIntro() {
  const [phase, setPhase] = useState<"visible" | "sliding" | "done">("visible");

  useEffect(() => {
    // Solo una vez por sesión
    if (sessionStorage.getItem("intro_seen")) {
      setPhase("done");
      return;
    }
    sessionStorage.setItem("intro_seen", "1");

    // Fase 1: mostrar intro 1.2s → luego deslizar hacia arriba
    const t1 = setTimeout(() => setPhase("sliding"), 1200);
    // Fase 2: animación dura 0.7s → ocultar completamente
    const t2 = setTimeout(() => setPhase("done"), 1900);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-brand-darkRed"
      style={{
        transition: phase === "sliding" ? "transform 0.7s cubic-bezier(0.76, 0, 0.24, 1)" : "none",
        transform: phase === "sliding" ? "translateY(-100%)" : "translateY(0)",
      }}
    >
      {/* Logo animado */}
      <div
        style={{
          animation: "introLogo 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
      >
        {/* Logo tipográfico */}
        <div className="text-center">
          <p
            className="font-heading font-bold text-white tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", letterSpacing: "-0.02em" }}
          >
            Like<span className="text-brand-orange">In</span>House
          </p>
          <p
            className="text-white/50 uppercase tracking-[0.35em] text-sm mt-2"
            style={{ animation: "introSub 1s 0.3s both" }}
          >
            Travel Agency
          </p>
        </div>
      </div>

      {/* Línea de carga */}
      <div className="mt-10 w-32 h-px bg-white/15 overflow-hidden rounded-full">
        <div
          className="h-full bg-brand-orange rounded-full"
          style={{ animation: "introBar 1.1s ease-out forwards" }}
        />
      </div>

      <style>{`
        @keyframes introLogo {
          from { opacity: 0; transform: scale(0.85) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes introSub {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes introBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
