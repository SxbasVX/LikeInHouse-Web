// Familia de línea que camina sobre la ola del hero: abuelo con bastón, mamá, papá y niño
// de la mano, cada uno con su color de generación en versión clara para leerse sobre la foto. Animación en CSS (globals.css: .family-walk).

type Walker = {
  x: number; // centro horizontal
  top: number; // alto de la cabeza (menor = más alto)
  hip: number; // altura de la cadera
  stroke: number; // grosor del cuerpo
  color: string;
  delay: string; // desfase del paso para que no caminen sincronizados
};

const GROUND = 66;

const WALKERS: Walker[] = [
  { x: 14, top: 13, hip: 44, stroke: 5.5, color: "#F6E3C8", delay: "0s" }, // abuelo
  { x: 40, top: 10, hip: 42, stroke: 6, color: "#3FD0B4", delay: "-0.3s" }, // mamá
  { x: 64, top: 7, hip: 42, stroke: 6.5, color: "#FF7A57", delay: "-0.15s" }, // papá
  { x: 86, top: 31, hip: 52, stroke: 5, color: "#F2B33D", delay: "-0.45s" }, // niño
];

export function WalkingFamily({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 70" className={`family-walk overflow-visible ${className}`} aria-hidden="true" focusable={false}>
      {/* Bastón del abuelo */}
      <path d="M20.5 36 L23 66" stroke="#F6E3C8" strokeWidth={2.2} strokeLinecap="round" fill="none" />
      {/* Manos tomadas: mamá–papá y papá–niño */}
      <path d="M44 30 Q52 36 60 30" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={2} strokeLinecap="round" fill="none" />
      <path d="M68 30 Q76 40 82.5 41" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={2} strokeLinecap="round" fill="none" />

      {WALKERS.map((w) => {
        const r = w.stroke * 0.95;
        const neck = w.top + r * 2 + 1.5;
        return (
          <g key={w.x} className="walker" style={{ animationDelay: w.delay }}>
            {/* Piernas: cada una oscila desde la cadera, en contrafase */}
            <line className="leg" x1={w.x} y1={w.hip} x2={w.x - 2.5} y2={GROUND} stroke={w.color} strokeWidth={w.stroke * 0.7} strokeLinecap="round" style={{ animationDelay: w.delay }} />
            <line className="leg leg-back" x1={w.x} y1={w.hip} x2={w.x + 2.5} y2={GROUND} stroke={w.color} strokeWidth={w.stroke * 0.7} strokeLinecap="round" style={{ animationDelay: w.delay }} />
            {/* Cuerpo y cabeza */}
            <line x1={w.x} y1={neck} x2={w.x} y2={w.hip} stroke={w.color} strokeWidth={w.stroke} strokeLinecap="round" />
            <circle cx={w.x} cy={w.top + r} r={r} fill={w.color} />
          </g>
        );
      })}
    </svg>
  );
}
