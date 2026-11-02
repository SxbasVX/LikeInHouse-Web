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
  /** ISO 3166-1 alpha-2, el que reciben las pasarelas. */
  iso: string;
}

// Perú primero (mercado principal), el resto por nombre en español y "Otro" al final.
const ALL_COUNTRIES: CountryOption[] = [
  { value: "Germany",            labelEs: "Alemania",               labelEn: "Germany",              dial: "+49",  iso: "DE" },
  { value: "Saudi Arabia",       labelEs: "Arabia Saudita",         labelEn: "Saudi Arabia",         dial: "+966", iso: "SA" },
  { value: "Argentina",          labelEs: "Argentina",              labelEn: "Argentina",            dial: "+54",  iso: "AR" },
  { value: "Australia",          labelEs: "Australia",              labelEn: "Australia",            dial: "+61",  iso: "AU" },
  { value: "Austria",            labelEs: "Austria",                labelEn: "Austria",              dial: "+43",  iso: "AT" },
  { value: "Belgium",            labelEs: "Bélgica",                labelEn: "Belgium",              dial: "+32",  iso: "BE" },
  { value: "Bolivia",            labelEs: "Bolivia",                labelEn: "Bolivia",              dial: "+591", iso: "BO" },
  { value: "Brasil",             labelEs: "Brasil",                 labelEn: "Brazil",               dial: "+55",  iso: "BR" },
  { value: "Canada",             labelEs: "Canadá",                 labelEn: "Canada",               dial: "+1",   iso: "CA" },
  { value: "Czech Republic",     labelEs: "Chequia",                labelEn: "Czech Republic",       dial: "+420", iso: "CZ" },
  { value: "Chile",              labelEs: "Chile",                  labelEn: "Chile",                dial: "+56",  iso: "CL" },
  { value: "China",              labelEs: "China",                  labelEn: "China",                dial: "+86",  iso: "CN" },
  { value: "Colombia",           labelEs: "Colombia",               labelEn: "Colombia",             dial: "+57",  iso: "CO" },
  { value: "South Korea",        labelEs: "Corea del Sur",          labelEn: "South Korea",          dial: "+82",  iso: "KR" },
  { value: "Costa Rica",         labelEs: "Costa Rica",             labelEn: "Costa Rica",           dial: "+506", iso: "CR" },
  { value: "Croatia",            labelEs: "Croacia",                labelEn: "Croatia",              dial: "+385", iso: "HR" },
  { value: "Cuba",               labelEs: "Cuba",                   labelEn: "Cuba",                 dial: "+53",  iso: "CU" },
  { value: "Denmark",            labelEs: "Dinamarca",              labelEn: "Denmark",              dial: "+45",  iso: "DK" },
  { value: "Ecuador",            labelEs: "Ecuador",                labelEn: "Ecuador",              dial: "+593", iso: "EC" },
  { value: "Egypt",              labelEs: "Egipto",                 labelEn: "Egypt",                dial: "+20",  iso: "EG" },
  { value: "El Salvador",        labelEs: "El Salvador",            labelEn: "El Salvador",          dial: "+503", iso: "SV" },
  { value: "United Arab Emirates", labelEs: "Emiratos Árabes Unidos", labelEn: "United Arab Emirates", dial: "+971", iso: "AE" },
  { value: "Spain",              labelEs: "España",                 labelEn: "Spain",                dial: "+34",  iso: "ES" },
  { value: "USA",                labelEs: "Estados Unidos",         labelEn: "United States",        dial: "+1",   iso: "US" },
  { value: "Philippines",        labelEs: "Filipinas",              labelEn: "Philippines",          dial: "+63",  iso: "PH" },
  { value: "Finland",            labelEs: "Finlandia",              labelEn: "Finland",              dial: "+358", iso: "FI" },
  { value: "France",             labelEs: "Francia",                labelEn: "France",               dial: "+33",  iso: "FR" },
  { value: "Greece",             labelEs: "Grecia",                 labelEn: "Greece",               dial: "+30",  iso: "GR" },
  { value: "Guatemala",          labelEs: "Guatemala",              labelEn: "Guatemala",            dial: "+502", iso: "GT" },
  { value: "Honduras",           labelEs: "Honduras",               labelEn: "Honduras",             dial: "+504", iso: "HN" },
  { value: "Hong Kong",          labelEs: "Hong Kong",              labelEn: "Hong Kong",            dial: "+852", iso: "HK" },
  { value: "Hungary",            labelEs: "Hungría",                labelEn: "Hungary",              dial: "+36",  iso: "HU" },
  { value: "India",              labelEs: "India",                  labelEn: "India",                dial: "+91",  iso: "IN" },
  { value: "Indonesia",          labelEs: "Indonesia",              labelEn: "Indonesia",            dial: "+62",  iso: "ID" },
  { value: "Ireland",            labelEs: "Irlanda",                labelEn: "Ireland",              dial: "+353", iso: "IE" },
  { value: "Iceland",            labelEs: "Islandia",               labelEn: "Iceland",              dial: "+354", iso: "IS" },
  { value: "Israel",             labelEs: "Israel",                 labelEn: "Israel",               dial: "+972", iso: "IL" },
  { value: "Italy",              labelEs: "Italia",                 labelEn: "Italy",                dial: "+39",  iso: "IT" },
  { value: "Japan",              labelEs: "Japón",                  labelEn: "Japan",                dial: "+81",  iso: "JP" },
  { value: "Kenya",              labelEs: "Kenia",                  labelEn: "Kenya",                dial: "+254", iso: "KE" },
  { value: "Luxembourg",         labelEs: "Luxemburgo",             labelEn: "Luxembourg",           dial: "+352", iso: "LU" },
  { value: "Malaysia",           labelEs: "Malasia",                labelEn: "Malaysia",             dial: "+60",  iso: "MY" },
  { value: "Morocco",            labelEs: "Marruecos",              labelEn: "Morocco",              dial: "+212", iso: "MA" },
  { value: "Mexico",             labelEs: "México",                 labelEn: "Mexico",               dial: "+52",  iso: "MX" },
  { value: "Nicaragua",          labelEs: "Nicaragua",              labelEn: "Nicaragua",            dial: "+505", iso: "NI" },
  { value: "Nigeria",            labelEs: "Nigeria",                labelEn: "Nigeria",              dial: "+234", iso: "NG" },
  { value: "Norway",             labelEs: "Noruega",                labelEn: "Norway",               dial: "+47",  iso: "NO" },
  { value: "New Zealand",        labelEs: "Nueva Zelanda",          labelEn: "New Zealand",          dial: "+64",  iso: "NZ" },
  { value: "Netherlands",        labelEs: "Países Bajos",           labelEn: "Netherlands",          dial: "+31",  iso: "NL" },
  { value: "Panama",             labelEs: "Panamá",                 labelEn: "Panama",               dial: "+507", iso: "PA" },
  { value: "Paraguay",           labelEs: "Paraguay",               labelEn: "Paraguay",             dial: "+595", iso: "PY" },
  { value: "Poland",             labelEs: "Polonia",                labelEn: "Poland",               dial: "+48",  iso: "PL" },
  { value: "Portugal",           labelEs: "Portugal",               labelEn: "Portugal",             dial: "+351", iso: "PT" },
  { value: "Puerto Rico",        labelEs: "Puerto Rico",            labelEn: "Puerto Rico",          dial: "+1",   iso: "PR" },
  { value: "UK",                 labelEs: "Reino Unido",            labelEn: "United Kingdom",       dial: "+44",  iso: "GB" },
  { value: "Dominican Republic", labelEs: "República Dominicana",   labelEn: "Dominican Republic",   dial: "+1",   iso: "DO" },
  { value: "Romania",            labelEs: "Rumania",                labelEn: "Romania",              dial: "+40",  iso: "RO" },
  { value: "Russia",             labelEs: "Rusia",                  labelEn: "Russia",               dial: "+7",   iso: "RU" },
  { value: "Singapore",          labelEs: "Singapur",               labelEn: "Singapore",            dial: "+65",  iso: "SG" },
  { value: "South Africa",       labelEs: "Sudáfrica",              labelEn: "South Africa",         dial: "+27",  iso: "ZA" },
  { value: "Sweden",             labelEs: "Suecia",                 labelEn: "Sweden",               dial: "+46",  iso: "SE" },
  { value: "Switzerland",        labelEs: "Suiza",                  labelEn: "Switzerland",          dial: "+41",  iso: "CH" },
  { value: "Thailand",           labelEs: "Tailandia",              labelEn: "Thailand",             dial: "+66",  iso: "TH" },
  { value: "Taiwan",             labelEs: "Taiwán",                 labelEn: "Taiwan",               dial: "+886", iso: "TW" },
  { value: "Turkey",             labelEs: "Turquía",                labelEn: "Turkey",               dial: "+90",  iso: "TR" },
  { value: "Ukraine",            labelEs: "Ucrania",                labelEn: "Ukraine",              dial: "+380", iso: "UA" },
  { value: "Uruguay",            labelEs: "Uruguay",                labelEn: "Uruguay",              dial: "+598", iso: "UY" },
  { value: "Venezuela",          labelEs: "Venezuela",              labelEn: "Venezuela",            dial: "+58",  iso: "VE" },
  { value: "Vietnam",            labelEs: "Vietnam",                labelEn: "Vietnam",              dial: "+84",  iso: "VN" },
];

export const COUNTRIES: CountryOption[] = [
  { value: "Peru", labelEs: "Perú", labelEn: "Peru", dial: "+51", iso: "PE" },
  ...ALL_COUNTRIES,
  // "Other" no tiene prefijo: el viajero escribe el suyo completo.
  { value: "Other", labelEs: "Otro", labelEn: "Other", dial: "", iso: "" },
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
