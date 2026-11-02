"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

interface QuoteRequestFormProps {
  /** Si viene de la ficha de un tour, el destino se toma del tour. */
  tour?: { slug: string; name: string; destination: string };
  defaultDate?: string;
}

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function QuoteRequestForm({ tour, defaultDate }: QuoteRequestFormProps) {
  const t = useTranslations("quote");
  const locale = useLocale();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [departureDate, setDepartureDate] = useState(defaultDate ?? "");

  const { data: destinations } = trpc.public.destinations.useQuery(undefined, {
    enabled: !tour,
    staleTime: 10 * 60 * 1000,
  });

  const requestQuote = trpc.public.requestQuote.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const text = (key: string) => ((form.get(key) as string | null) ?? "").trim();
    requestQuote.mutate({
      tourSlug: tour?.slug,
      destination: tour ? undefined : text("destination") || undefined,
      name: text("name"),
      phone: text("phone"),
      email: text("email"),
      originCity: text("originCity") || undefined,
      departureDate: text("departureDate"),
      returnDate: text("returnDate"),
      adults: Number(text("adults") || 1),
      children: Number(text("children") || 0),
      infants: Number(text("infants") || 0),
      message: text("message") || undefined,
      locale: locale === "en" ? "en" : "es",
    });
  };

  if (submitted) {
    return (
      <div className="animate-scale-in py-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-teal/15">
          <CheckCircle2 className="h-8 w-8 text-brand-teal" />
        </div>
        <h3 className="text-lg font-semibold">{t("success_title")}</h3>
        <p className="mt-1 text-sm text-gray-500">{t("success")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {tour ? (
        <div className="rounded-xl bg-[#faf8f5] px-4 py-3 text-sm">
          <span className="text-gray-400">{t("tour")}: </span>
          <span className="font-semibold text-gray-800">{tour.name}</span>
          <span className="text-gray-400"> · {tour.destination}</span>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="quote-destination">{t("destination")}</Label>
          <select id="quote-destination" name="destination" className={selectClass} defaultValue="">
            <option value="">{t("destination_any")}</option>
            {destinations?.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quote-name">{t("name")}</Label>
          <Input id="quote-name" name="name" required minLength={2} maxLength={100} autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quote-phone">{t("phone")}</Label>
          <Input
            id="quote-phone"
            name="phone"
            type="tel"
            required
            pattern="\+?[\d\s\-().]{6,20}"
            title={t("phone_invalid")}
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quote-email">{t("email")}</Label>
          <Input id="quote-email" name="email" type="email" autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quote-origin">{t("origin_city")}</Label>
          <Input id="quote-origin" name="originCity" maxLength={100} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quote-departure">{t("departure_date")}</Label>
          <Input
            id="quote-departure"
            name="departureDate"
            type="date"
            min={today}
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quote-return">{t("return_date")}</Label>
          <Input id="quote-return" name="returnDate" type="date" min={departureDate || today} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quote-adults">{t("adults")}</Label>
          <Input id="quote-adults" name="adults" type="number" min={1} max={50} defaultValue={2} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quote-children">{t("children")}</Label>
          <Input id="quote-children" name="children" type="number" min={0} max={50} defaultValue={0} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quote-infants">{t("infants")}</Label>
          <Input id="quote-infants" name="infants" type="number" min={0} max={20} defaultValue={0} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quote-message">{t("message")}</Label>
        <Textarea id="quote-message" name="message" rows={4} maxLength={2000} placeholder={t("message_placeholder")} />
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={requestQuote.isPending}>
        {requestQuote.isPending ? t("sending") : t("send")}
      </Button>
    </form>
  );
}

export function QuoteRequestDialog({
  open,
  onOpenChange,
  ...props
}: QuoteRequestFormProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("quote");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>
        {/* Se monta sólo al abrir, así cada apertura empieza con el formulario limpio */}
        {open && <QuoteRequestForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}
