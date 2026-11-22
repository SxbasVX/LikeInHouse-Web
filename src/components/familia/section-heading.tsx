// Encabezado de sección con el estilo de la web principal:
// línea superior turquesa, título en Montserrat liviana y remate en Playfair cursiva naranja.
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
  text?: string;
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
            <span className="font-serif font-normal italic text-brand-orange">{accent}</span>
          </>
        )}
      </Tag>
      {text && (
        <p className={`mt-4 text-lg font-light text-gray-500 ${centered ? "mx-auto max-w-xl" : "max-w-xl"}`}>{text}</p>
      )}
    </div>
  );
}
