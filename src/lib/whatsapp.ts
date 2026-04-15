// URL base oficial de WhatsApp para Like In House
const WA_PHONE = "51913406888";

export function waUrl(text?: string): string {
  const base = `https://api.whatsapp.com/send/?phone=${WA_PHONE}`;
  if (text) {
    return `${base}&text=${encodeURIComponent(text)}&type=phone_number&app_absent=0`;
  }
  return `${base}&type=phone_number&app_absent=0`;
}
