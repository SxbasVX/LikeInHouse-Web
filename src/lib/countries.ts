/**
 * Catálogo de países del checkout.
 *
 * `value` es lo que se guarda en `Client.country` y lo que el servidor traduce
 * a ISO-3166 para las pasarelas (ver `src/server/lib/payer.ts`). NO cambiar
 * esos valores: hay clientes ya guardados con ellos.
 *
 * `dial` es el prefijo telefónico, que el formulario rellena automáticamente
 * al elegir el país para que nadie envíe un número sin código de país (un
 * teléfono sin prefijo es inservible para escribirle por WhatsApp).
 */

export interface CountryOption {
  /** Valor persistido en BD. Estable, no traducir. */
  value: string;
  labelEs: string;
  labelEn: string;
  /** Prefijo telefónico internacional, con "+". */
  dial: string;
}

export const COUNTRIES: CountryOption[] = [
  { value: "Peru",      labelEs: "Perú",            labelEn: "Peru",           dial: "+51"  },
  { value: "Argentina", labelEs: "Argentina",       labelEn: "Argentina",      dial: "+54"  },
  { value: "Bolivia",   labelEs: "Bolivia",         labelEn: "Bolivia",        dial: "+591" },
  { value: "Brasil",    labelEs: "Brasil",          labelEn: "Brazil",         dial: "+55"  },
  { value: "Chile",     labelEs: "Chile",           labelEn: "Chile",          dial: "+56"  },
  { value: "Colombia",  labelEs: "Colombia",        labelEn: "Colombia",       dial: "+57"  },
  { value: "Ecuador",   labelEs: "Ecuador",         labelEn: "Ecuador",        dial: "+593" },
  { value: "Mexico",    labelEs: "México",          labelEn: "Mexico",         dial: "+52"  },
  { value: "Paraguay",  labelEs: "Paraguay",        labelEn: "Paraguay",       dial: "+595" },
  { value: "Uruguay",   labelEs: "Uruguay",         labelEn: "Uruguay",        dial: "+598" },
  { value: "Venezuela", labelEs: "Venezuela",       labelEn: "Venezuela",      dial: "+58"  },
  { value: "USA",       labelEs: "Estados Unidos",  labelEn: "United States",  dial: "+1"   },
  { value: "Canada",    labelEs: "Canadá",          labelEn: "Canada",         dial: "+1"   },
  { value: "Spain",     labelEs: "España",          labelEn: "Spain",          dial: "+34"  },
  { value: "France",    labelEs: "Francia",         labelEn: "France",         dial: "+33"  },
  { value: "Germany",   labelEs: "Alemania",        labelEn: "Germany",        dial: "+49"  },
  { value: "UK",        labelEs: "Reino Unido",     labelEn: "United Kingdom", dial: "+44"  },
  { value: "Italy",     labelEs: "Italia",          labelEn: "Italy",          dial: "+39"  },
  { value: "Australia", labelEs: "Australia",       labelEn: "Australia",      dial: "+61"  },
  { value: "Japan",     labelEs: "Japón",           labelEn: "Japan",          dial: "+81"  },
  // "Other" no tiene prefijo: el viajero escribe el suyo completo.
  { value: "Other",     labelEs: "Otro",            labelEn: "Other",          dial: ""     },
];

/** Prefijo telefónico de un país del selector, o "" si no se conoce. */
export function dialCodeFor(countryValue?: string | null): string {
  if (!countryValue) return "";
  return COUNTRIES.find((c) => c.value === countryValue)?.dial ?? "";
}

/** Todos los prefijos conocidos, del más largo al más corto. */
const DIALS = COUNTRIES.map((c) => c.dial).filter(Boolean).sort((a, b) => b.length - a.length);

/**
 * ¿El teléfono está "vacío" a efectos de autocompletar?
 *
 * Lo está si no hay nada, o si sólo contiene un prefijo que pusimos nosotros
 * (el viajero aún no ha escrito su número). Así, cambiar de país actualiza el
 * prefijo, pero NUNCA se pisa un número ya tecleado.
 */
export function isPhoneJustPrefix(phone?: string | null): boolean {
  const value = (phone ?? "").trim();
  if (value === "") return true;
  return DIALS.some((d) => value === d);
}

/**
 * Teléfono resultante al elegir un país.
 * Devuelve `null` cuando no hay que tocar el campo.
 */
export function phoneForCountry(countryValue: string, currentPhone?: string | null): string | null {
  const dial = dialCodeFor(countryValue);
  if (!dial) return null;
  if (!isPhoneJustPrefix(currentPhone)) return null; // ya escribió su número
  return `${dial} `;
}
