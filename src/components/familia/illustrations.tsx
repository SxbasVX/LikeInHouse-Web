// Ilustraciones SVG de la web familiar. Decorativas salvo que se pase `title`.
import { cn } from "@/lib/utils";

const INK = "#441514";
const TEAL = "#15A58E";
const DARK_TEAL = "#0E6650";
const ORANGE = "#FC451F";
const CREAM = "#FBEDBE";

interface SvgProps {
  className?: string;
  /** Texto accesible. Sin título la ilustración queda oculta a lectores de pantalla. */
  title?: string;
}

function a11y(title?: string) {
  return title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true as const };
}

/** Sol sonriente. */
export function SmilingSun({ className, title }: SvgProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} {...a11y(title)}>
      <g stroke={INK} strokeWidth="4" strokeLinecap="round">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          const x1 = 60 + Math.cos(a) * 40;
          const y1 = 60 + Math.sin(a) * 40;
          const x2 = 60 + Math.cos(a) * 54;
          const y2 = 60 + Math.sin(a) * 54;
          return <line key={i} x1={x1.toFixed(2)} y1={y1.toFixed(2)} x2={x2.toFixed(2)} y2={y2.toFixed(2)} />;
        })}
      </g>
      <circle cx="60" cy="60" r="32" fill="#FFC93C" stroke={INK} strokeWidth="4" />
      <circle cx="49" cy="55" r="4" fill={INK} />
      <circle cx="71" cy="55" r="4" fill={INK} />
      <path d="M46 67 Q60 80 74 67" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <circle cx="42" cy="66" r="4" fill={ORANGE} opacity="0.5" />
      <circle cx="78" cy="66" r="4" fill={ORANGE} opacity="0.5" />
    </svg>
  );
}

/** Racimo de tres globos. */
export function Balloons({ className, title }: SvgProps) {
  return (
    <svg viewBox="0 0 120 170" className={className} {...a11y(title)}>
      <g fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round">
        <path d="M34 78 Q44 110 60 165" />
        <path d="M86 70 Q74 112 60 165" />
        <path d="M60 92 Q56 130 60 165" />
      </g>
      <ellipse cx="34" cy="48" rx="26" ry="31" fill={ORANGE} stroke={INK} strokeWidth="3" />
      <ellipse cx="86" cy="42" rx="26" ry="31" fill={TEAL} stroke={INK} strokeWidth="3" />
      <ellipse cx="60" cy="62" rx="24" ry="29" fill="#FFC93C" stroke={INK} strokeWidth="3" />
      <path d="M30 81 l4 -4 l4 4 z M82 75 l4 -4 l4 4 z M56 93 l4 -4 l4 4 z" fill={INK} />
      <path d="M22 36 q4 -10 12 -12 M74 30 q4 -10 12 -12 M50 50 q4 -10 12 -12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/** Banda de olas para separar secciones. `color` es el relleno de la ola. */
export function Waves({ className, color = TEAL }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className={cn("block w-full", className)} aria-hidden="true">
      <path
        d="M0 30 Q75 0 150 30 T300 30 T450 30 T600 30 T750 30 T900 30 T1050 30 T1200 30 V60 H0 Z"
        fill={color}
      />
    </svg>
  );
}

/** Ventana de navegador con trazo grueso; envuelve cualquier contenido. */
export function BrowserFrame({
  children,
  className,
  barClassName,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  barClassName?: string;
  /** Texto pequeño en la barra (como una URL). */
  label?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-3xl border-2 border-brand-darkRed bg-white shadow-[6px_6px_0_0_#441514]", className)}>
      <div className={cn("flex items-center gap-1.5 border-b-2 border-brand-darkRed bg-brand-beige px-4 py-2.5", barClassName)}>
        <span className="h-3 w-3 rounded-full border-2 border-brand-darkRed bg-brand-orange" />
        <span className="h-3 w-3 rounded-full border-2 border-brand-darkRed bg-[#FFC93C]" />
        <span className="h-3 w-3 rounded-full border-2 border-brand-darkRed bg-brand-teal" />
        {label && (
          <span className="ml-3 truncate rounded-full border-2 border-brand-darkRed/20 bg-white px-3 py-0.5 text-[11px] font-semibold text-brand-darkRed/70">
            {label}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/** Escena del hero: montañas andinas, sol, globos y un río. */
export function AndesScene({ className, title }: SvgProps) {
  return (
    <svg viewBox="0 0 400 300" className={className} {...a11y(title)}>
      <rect width="400" height="300" fill={CREAM} />
      {/* Nubes */}
      <g fill="#fff" stroke={INK} strokeWidth="3">
        <path d="M40 70 q0 -18 18 -18 q6 -14 22 -10 q16 -6 22 10 q14 2 12 18 z" />
        <path d="M250 46 q0 -14 14 -14 q6 -12 18 -8 q14 -4 18 8 q12 2 10 14 z" />
      </g>
      {/* Sol */}
      <g transform="translate(300 40) scale(0.75)">
        <circle cx="60" cy="60" r="32" fill="#FFC93C" stroke={INK} strokeWidth="5" />
        <circle cx="49" cy="55" r="4.5" fill={INK} />
        <circle cx="71" cy="55" r="4.5" fill={INK} />
        <path d="M46 67 Q60 80 74 67" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      </g>
      {/* Montañas */}
      <path d="M-10 250 L90 110 L150 190 L210 95 L300 220 L350 160 L420 250 Z" fill={TEAL} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M90 110 L72 136 L84 132 L92 142 L104 128 Z M210 95 L190 124 L204 118 L214 130 L226 116 Z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M-10 270 L60 200 L130 250 L200 180 L290 260 L360 210 L420 270 Z" fill={DARK_TEAL} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      {/* Terrazas */}
      <g fill="none" stroke={CREAM} strokeWidth="3" strokeLinecap="round" opacity="0.6">
        <path d="M170 220 q30 -8 60 0" />
        <path d="M160 236 q40 -8 80 0" />
      </g>
      {/* Río */}
      <path d="M0 300 V270 Q50 255 100 270 T200 270 T300 270 T400 270 V300 Z" fill="#7FD3C3" stroke={INK} strokeWidth="4" />
      {/* Globos */}
      <g transform="translate(36 96) scale(0.55)">
        <path d="M34 78 Q44 110 60 165 M86 70 Q74 112 60 165" fill="none" stroke={INK} strokeWidth="4" />
        <ellipse cx="34" cy="48" rx="26" ry="31" fill={ORANGE} stroke={INK} strokeWidth="5" />
        <ellipse cx="86" cy="42" rx="26" ry="31" fill="#FFC93C" stroke={INK} strokeWidth="5" />
      </g>
    </svg>
  );
}
