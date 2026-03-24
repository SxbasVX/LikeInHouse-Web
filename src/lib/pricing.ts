/**
 * Pricing utilities for applying discounts (promo + group).
 * Uses fields that already exist in TourPricing schema.
 *
 * Rules:
 * - Promo discount applies if promoStartDate <= now <= promoEndDate
 * - Group discount applies if totalPassengers >= groupMinPersons
 * - If BOTH apply, the HIGHER discount is used (they don't stack)
 * - Returns original and final price so UI can show both
 */

interface PricingData {
  basePriceUsdAdult: number;
  basePriceUsdChild: number;
  promoDiscountPercent?: number | null;
  promoStartDate?: string | Date | null;
  promoEndDate?: string | Date | null;
  promoLabelEs?: string | null;
  promoLabelEn?: string | null;
  groupDiscountPercent?: number | null;
  groupMinPersons?: number | null;
}

interface PriceResult {
  originalPriceAdult: number;
  finalPriceAdult: number;
  originalPriceChild: number;
  finalPriceChild: number;
  discountPercent: number;
  discountType: "promo" | "group" | null;
  promoLabel: { es: string | null; en: string | null };
  isPromoActive: boolean;
}

/**
 * Check if a promo is currently active based on date range.
 */
export function isPromoActive(pricing: PricingData): boolean {
  if (!pricing.promoDiscountPercent || pricing.promoDiscountPercent <= 0) return false;
  if (!pricing.promoStartDate || !pricing.promoEndDate) return false;

  const now = new Date();
  const start = new Date(pricing.promoStartDate);
  const end = new Date(pricing.promoEndDate);

  // Set end to end of day (UTC to be timezone-independent)
  end.setUTCHours(23, 59, 59, 999);

  return now >= start && now <= end;
}

/**
 * Calculate the final price per person (adult) considering discounts.
 * @param pricing - TourPricing data
 * @param totalPassengers - Total passengers for group discount evaluation (optional)
 */
export function getFinalPrice(pricing: PricingData, totalPassengers?: number): PriceResult {
  const originalPriceAdult = pricing.basePriceUsdAdult;
  const originalPriceChild = pricing.basePriceUsdChild;

  let promoPercent = 0;
  let groupPercent = 0;
  const promoActive = isPromoActive(pricing);

  // Check promo discount
  if (promoActive) {
    promoPercent = Number(pricing.promoDiscountPercent) || 0;
  }

  // Check group discount
  if (
    pricing.groupDiscountPercent &&
    pricing.groupMinPersons &&
    totalPassengers &&
    totalPassengers >= pricing.groupMinPersons
  ) {
    groupPercent = Number(pricing.groupDiscountPercent) || 0;
  }

  // Use the HIGHER discount (don't stack)
  let discountPercent = 0;
  let discountType: "promo" | "group" | null = null;

  if (promoPercent >= groupPercent && promoPercent > 0) {
    discountPercent = promoPercent;
    discountType = "promo";
  } else if (groupPercent > 0) {
    discountPercent = groupPercent;
    discountType = "group";
  }

  const multiplier = 1 - discountPercent / 100;
  const finalPriceAdult = Math.round(originalPriceAdult * multiplier * 100) / 100;
  const finalPriceChild = Math.round(originalPriceChild * multiplier * 100) / 100;

  return {
    originalPriceAdult,
    finalPriceAdult,
    originalPriceChild,
    finalPriceChild,
    discountPercent,
    discountType,
    promoLabel: {
      es: pricing.promoLabelEs || null,
      en: pricing.promoLabelEn || null,
    },
    isPromoActive: promoActive,
  };
}

/**
 * Calculate total amount with discounts applied.
 * Used by server-side validation in reservation mutations.
 */
export function calculateTotalWithDiscount(
  pricing: PricingData,
  adults: number,
  children: number
): { total: number; discountPercent: number } {
  const totalPassengers = adults + children;
  const result = getFinalPrice(pricing, totalPassengers);

  const total = result.finalPriceAdult * adults + result.finalPriceChild * children;

  return {
    total: Math.round(total * 100) / 100,
    discountPercent: result.discountPercent,
  };
}
