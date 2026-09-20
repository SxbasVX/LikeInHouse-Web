"use client";

import { useLocale } from "next-intl";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/hooks/use-currency";
import { CURRENCIES, CURRENCY_CODES, BASE_CURRENCY } from "@/lib/currency";
import { cn } from "@/lib/utils";

/**
 * Selector de moneda de VISUALIZACIÓN.
 *
 * Deja claro en el propio menú que el cobro se hace en USD: es la promesa que
 * el checkout tiene que cumplir después, y es mejor anunciarla desde el
 * primer momento que sorprender al pasajero al pagar.
 */
export function CurrencySwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const locale = useLocale();
  const isEs = locale === "es";
  const { currency, setCurrency } = useCurrency();

  // Mismo lenguaje visual que los demás desplegables del navbar ("Tours ⌄",
  // "Airbnb ⌄"): código de moneda + chevron. Un icono de monedas a 16px se
  // leía como un borrón y no dejaba claro que fuera pulsable.
  const triggerClass =
    variant === "dark"
      ? "h-10 gap-1.5 rounded-full px-3 text-[14px] font-semibold text-white/90 hover:text-white hover:bg-white/10 focus-visible:ring-0"
      : "h-10 gap-1.5 rounded-full px-3 text-[14px] font-semibold text-gray-600 hover:text-brand-darkRed hover:bg-gray-100 focus-visible:ring-0";

  const isDark = variant === "dark";
  const contentClass = isDark
    ? "rounded-xl w-64 border-white/10 bg-black/80 backdrop-blur-xl text-white"
    : "rounded-xl w-64";
  const itemClass = isDark ? "focus:bg-white/20" : "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={triggerClass}
          aria-label={isEs ? `Moneda: ${currency}. Cambiar moneda` : `Currency: ${currency}. Change currency`}
        >
          {currency}
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className={contentClass}>
        <DropdownMenuLabel className={cn("text-xs font-normal leading-snug", isDark ? "text-white/60" : "text-muted-foreground")}>
          {isEs
            ? "Elige cómo quieres ver los precios."
            : "Choose how you want to see prices."}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-72 overflow-y-auto">
          {CURRENCY_CODES.map((code) => {
            const def = CURRENCIES[code];
            const active = code === currency;
            return (
              <DropdownMenuItem
                key={code}
                onClick={() => setCurrency(code)}
                className={cn("rounded-lg cursor-pointer gap-2", itemClass, active && "font-semibold")}
              >
                <span className={cn("w-10 shrink-0", isDark ? "text-white/60" : "text-muted-foreground")}>{def.symbol}</span>
                <span className="flex-1 truncate">{isEs ? def.nameEs : def.nameEn}</span>
                <span className={cn("text-xs", isDark ? "text-white/60" : "text-muted-foreground")}>{code}</span>
                {active && <Check className={cn("h-3.5 w-3.5", isDark ? "text-white" : "text-brand-darkRed")} />}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />
        <p className={cn("px-2 py-1.5 text-[11px] leading-snug", isDark ? "text-white/60" : "text-muted-foreground")}>
          {isEs
            ? `Los precios en otras monedas son una conversión aproximada. El cobro se realiza siempre en ${BASE_CURRENCY}.`
            : `Prices in other currencies are an approximate conversion. You are always charged in ${BASE_CURRENCY}.`}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
