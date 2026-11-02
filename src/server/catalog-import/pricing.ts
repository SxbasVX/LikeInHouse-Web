import { z } from "zod";

// Published prices are always USD: soles are converted at the SUNAT selling rate, then every price gets the markup.
// Set by the server at extraction; the model only copies the PDF's original amount and currency.
export const priceAdjustmentSchema = z.object({
  penPerUsd: z.number().positive(),
  rateDate: z.string(),
  rateSource: z.enum(["SUNAT", "fallback"]),
  markupPercent: z.number().min(0).max(100),
});
export type PriceAdjustment = z.infer<typeof priceAdjustmentSchema>;

export const CONVERTIBLE_CURRENCIES = ["USD", "PEN"] as const;

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** USD at the exchange rate (step 1) and the published price with the markup (step 2); null if it can't be computed. */
export function publishedPrice(price: { amount: number | null; currency: string | null }, adjustment: PriceAdjustment | undefined) {
  if (price.amount === null || !adjustment) return null;
  const usdAtRate = price.currency === "USD" ? round2(price.amount)
    : price.currency === "PEN" ? round2(price.amount / adjustment.penPerUsd)
    : null;
  if (usdAtRate === null) return null;
  return { usdAtRate, final: round2(usdAtRate * (1 + adjustment.markupPercent / 100)) };
}
