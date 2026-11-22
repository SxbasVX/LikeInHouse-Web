// Encabezado de sección con el estilo de la web principal (eyebrow turquesa, Montserrat
// liviana y remate en Playfair cursiva) más un trazo a mano alzada bajo la palabra destacada.
export function SectionHeading({
  id,
  eyebrow,
  title,
  accent,
  text,
  as: Tag = "h2",
  align = "center",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  accent?: string;
  /** Uno o varios párrafos. */
  text?: string | string[];
  as?: "h1" | "h2";
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow && <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-brand-teal">{eyebrow}</p>}
      <Tag id={id} className="font-heading text-4xl font-light tracking-tight text-brand-darkRed sm:text-5xl">
        {title}
        {accent && (
          <>
            {" "}
            <span className="relative inline-block font-serif font-normal italic text-brand-orange">
              {accent}
              {/* Trazo a mano alzada bajo la palabra destacada */}
              <svg
                aria-hidden="true"
                viewBox="0 0 200 14"
                preserveAspectRatio="none"
                className="family-squiggle absolute -bottom-2 left-0 h-3 w-full text-[#F2B33D] sm:-bottom-3"
              >
                <path d="M3 9 C 40 2, 70 13, 105 7 S 170 3, 197 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </>
        )}
      </Tag>
      {text &&
        (Array.isArray(text) ? text : [text]).map((para, i) => (
          <p key={i} className={`mt-4 text-lg font-light leading-relaxed text-gray-500 ${centered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
            {para}
          </p>
        ))}
    </div>
  );
}
