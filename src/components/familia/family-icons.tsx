// Íconos propios de la web familiar: trazo a mano en el estilo de Like In House.
// Cada trazo usa pathLength={1} para poder "dibujarse" con CSS (.family-draw).
import type { SVGProps } from "react";

export type FamilyIconName = "stroller" | "kite" | "mountain" | "map" | "tea";

const COMMON: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

// Cada ícono es una lista de trazos (path "d") y círculos.
const SHAPES: Record<FamilyIconName, { paths: string[]; circles?: Array<[number, number, number]> }> = {
  // Bebés: cochecito
  stroller: {
    paths: ["M4.5 11a7 7 0 0 1 7-7v7", "M4 11h12a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z", "M16 11l1.8-5H20"],
    circles: [[8, 19, 2], [14.5, 19, 2]],
  },
  // Niños: cometa con cola
  kite: {
    paths: ["M12 2.5l5 6.5-5 8-5-8Z", "M7 9h10", "M12 2.5v14.5", "M12 17c-1.6 1.4 1.6 2.4 0 3.8", "M10.3 19.2l1.7.6 1.7-.6"],
  },
  // Adolescentes: montaña con bandera (el reto)
  mountain: {
    paths: ["M2.5 20.5 9 10l3.5 5.5 2-3 7 8Z", "M9 10V3.5", "M9 3.5h4.5l-1.2 1.6 1.2 1.6H9"],
  },
  // Papás: mapa del viaje
  map: {
    paths: ["M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z", "M9 4v13.5", "M15 6.5V20"],
  },
  // Abuelos: taza de mate de coca humeante
  tea: {
    paths: [
      "M5 10.5h11v3.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z",
      "M16 11.5h1.4a2.4 2.4 0 0 1 0 4.8H16",
      "M8.8 3.5c-1.1 1.4 1.1 2.4 0 3.9",
      "M12.3 3.5c-1.1 1.4 1.1 2.4 0 3.9",
      "M3.5 21.5h14",
    ],
  },
};

export function FamilyIcon({ name, className }: { name: FamilyIconName; className?: string }) {
  const shape = SHAPES[name];
  return (
    <svg {...COMMON} className={className}>
      {shape.paths.map((d) => (
        <path key={d} d={d} pathLength={1} />
      ))}
      {shape.circles?.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} pathLength={1} />
      ))}
    </svg>
  );
}
