"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Marca su contenido como visible la primera vez que entra en pantalla,
// para que los íconos .family-draw se dibujen trazo a trazo (ver globals.css).
export function DrawOnView({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span ref={ref} data-visible={visible} className={`family-draw ${className ?? ""}`}>
      {children}
    </span>
  );
}
