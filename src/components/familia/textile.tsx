// Motivos de la web familiar inspirados en la manta andina: cada hilo de color es
// una generación de la familia, y la franja las reúne en una sola pieza.

// Rombo de la manta, repetido a tamaño real (no se estira en pantallas anchas).
const ROMBOS = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="10"><rect width="12" height="10" fill="#F2B33D"/><path d="M6 0 12 5 6 10 0 5Z" fill="#FC451F"/><path d="M6 3 8.4 5 6 7 3.6 5Z" fill="#441514"/></svg>'
)}")`;

/** Franja tejida: hilos de cada generación y una fila de rombos. Es decorativa. */
export function TextileBand({ className = "", thin = false }: { className?: string; thin?: boolean }) {
  const hilos = (
    <>
      <span className="block h-[3px] bg-fam-tinta" />
      <span className="block h-[2px] bg-fam-turquesa" />
      <span className="block h-[2px] bg-fam-granate" />
    </>
  );
  return (
    <div aria-hidden="true" className={`w-full ${className}`}>
      {thin ? (
        hilos
      ) : (
        <>
          {hilos}
          <span className="block h-[10px]" style={{ backgroundImage: ROMBOS, backgroundSize: "12px 10px" }} />
          <span className="block h-[2px] bg-fam-granate" />
          <span className="block h-[2px] bg-fam-turquesa" />
          <span className="block h-[3px] bg-fam-tinta" />
        </>
      )}
    </div>
  );
}

/** Hilo fino de un color: marca a qué generación pertenece un bloque. */
export function Thread({ color, className = "" }: { color: string; className?: string }) {
  return <span aria-hidden="true" className={`block h-1 w-12 rounded-full ${className}`} style={{ backgroundColor: color }} />;
}

/** Foto con forma de arco de portada colonial (Cusco). */
export function ArchPhoto({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className={`relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-3xl bg-fam-niebla ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" fetchPriority="high" />
      ) : (
        <div className="flex h-full w-full items-end bg-[linear-gradient(180deg,#15A58E_0%,#0E6650_100%)]">
          <TextileBand />
        </div>
      )}
    </div>
  );
}
