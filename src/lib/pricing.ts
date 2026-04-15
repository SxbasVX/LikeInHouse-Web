/**
 * Pricing utilities for applying discounts (promo + group + global).
 * Rules:
 * - Promo discount applies if promoStartDate <= now <= promoEndDate
 * - Group discount applies if totalPassengers >= groupMinPersons
 * - Global discount applies always when set (Black Friday, etc.)
 * - The HIGHEST discount wins (they don't stack)
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
  globalDiscountPercent?: number | null; // descuento global activo (Black Friday, etc.)
}

interface PriceResult {
  originalPriceAdult: number;
  finalPriceAdult: number;
  originalPriceChild: number;
  finalPriceChild: number;
  discountPercent: number;
  discountType: "promo" | "group" | "global" | null;
  promoLabel: { es: string | null; en: string | null };
  isPromoActive: boolean;
}

export function isPromoActive(pricing: PricingData): boolean {
  if (!pricing.promoDiscountPercent || pricing.promoDiscountPercent <= 0) return false;
  if (!pricing.promoStartDate || !pricing.promoEndDate) return false;
  const now = new Date();
  const start = new Date(pricing.promoStartDate);
  const end = new Date(pricing.promoEndDate);
  end.setUTCHours(23, 59, 59, 999);
  return now >= start && now <= end;
}

export function getFinalPrice(pricing: PricingData, totalPassengers?: number): PriceResult {
  const originalPriceAdult = pricing.basePriceUsdAdult;
  const originalPriceChild = pricing.basePriceUsdChild;

  let promoPercent = 0;
  let groupPercent = 0;
  let globalPercent = 0;
  const promoActive = isPromoActive(pricing);

  if (promoActive) promoPercent = Number(pricing.promoDiscountPercent) || 0;

  if (
    pricing.groupDiscountPercent &&
    pricing.groupMinPersons &&
    totalPassengers &&
    totalPassengers >= pricing.groupMinPersons
  ) {
    groupPercent = Number(pricing.groupDiscountPercent) || 0;
  }

  if (pricing.globalDiscountPercent && pricing.globalDiscountPercent > 0) {
    globalPercent = Number(pricing.globalDiscountPercent) || 0;
  }

  // Use the HIGHEST discount (don't stack)
  let discountPercent = 0;
  let discountType: "promo" | "group" | "global" | null = null;

  if (promoPercent >= groupPercent && promoPercent >= globalPercent && promoPercent > 0) {
    discountPercent = promoPercent;
    discountType = "promo";
  } else if (groupPercent >= globalPercent && groupPercent > 0) {
    discountPercent = groupPercent;
    discountType = "group";
  } else if (globalPercent > 0) {
    discountPercent = globalPercent;
    discountType = "global";
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
