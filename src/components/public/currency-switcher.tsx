"use client";

import { useLocale } from "next-intl";
import { Check, Coins } from "lucide-react";
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

  const triggerClass =
    variant === "dark"
      ? "h-10 w-auto px-3 gap-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/10 focus-visible:ring-0"
      : "h-10 w-auto px-3 gap-1.5 rounded-full text-gray-600 hover:text-brand-darkRed hover:bg-gray-100 focus-visible:ring-0";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={triggerClass}
          aria-label={isEs ? "Cambiar moneda" : "Change currency"}
        >
          <Coins className="h-4 w-4" />
          <span className="text-[13px] font-semibold">{currency}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="rounded-xl w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground leading-snug">
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
                className={cn("rounded-lg cursor-pointer gap-2", active && "font-semibold")}
              >
                <span className="w-10 shrink-0 text-muted-foreground">{def.symbol}</span>
                <span className="flex-1 truncate">{isEs ? def.nameEs : def.nameEn}</span>
                <span className="text-xs text-muted-foreground">{code}</span>
                {active && <Check className="h-3.5 w-3.5 text-brand-darkRed" />}
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
          {isEs
            ? `Los precios en otras monedas son una conversión aproximada. El cobro se realiza siempre en ${BASE_CURRENCY}.`
            : `Prices in other currencies are an approximate conversion. You are always charged in ${BASE_CURRENCY}.`}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
