"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, CheckCircle2, Mail, MessageCircle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface QuoteRequestFormProps {
  /** Si viene de la ficha de un tour, el destino se toma del tour. */
  tour?: { slug: string; name: string; destination: string };
  defaultDate?: string;
}

const TRAVEL_WINDOWS = ["this_month", "1_3_months", "3_6_months", "undecided", "exact"] as const;
type TravelWindow = (typeof TRAVEL_WINDOWS)[number];

// Opción de selección única (radio): tocar otra reemplaza la anterior
function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-1",
        selected
          ? "border-brand-teal bg-brand-teal text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-600 hover:border-brand-teal/50 hover:text-brand-darkTeal"
      )}
    >
      {selected && <Check className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const t = useTranslations("quote");
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-2.5">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`${t("decrease")} ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-brand-teal disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
        <button
          type="button"
          aria-label={`${t("increase")} ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors hover:border-brand-teal disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function Section({ step, title, hint, children }: { step: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 flex items-center gap-2.5 text-sm font-semibold text-gray-900">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-teal/15 text-xs font-bold text-brand-darkTeal">
          {step}
        </span>
        {title}
        {hint && <span className="font-normal text-gray-400">· {hint}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function ContactOption({
  selected,
  onClick,
  icon,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal",
        selected
          ? "border-brand-teal bg-brand-teal/10 text-brand-darkTeal"
          : "border-gray-200 text-gray-500 hover:border-gray-300"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function QuoteRequestForm({ tour, defaultDate }: QuoteRequestFormProps) {
  const t = useTranslations("quote");
  const locale = useLocale();
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);

  const [submitted, setSubmitted] = useState(false);
  const [destination, setDestination] = useState(""); // "" = aún no lo sabe
  const [travelWindow, setTravelWindow] = useState<TravelWindow | undefined>(defaultDate ? "exact" : undefined);
  const [departureDate, setDepartureDate] = useState(defaultDate ?? "");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [contactVia, setContactVia] = useState<"whatsapp" | "email">("whatsapp");
  const [showMessage, setShowMessage] = useState(false);

  const { data: destinationOptions } = trpc.public.destinations.useQuery(undefined, {
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
    const exact = travelWindow === "exact";
    requestQuote.mutate({
      tourSlug: tour?.slug,
      destinations: !tour && destination ? [destination] : [],
      travelWindow,
      name: text("name"),
      phone: contactVia === "whatsapp" ? text("contact") : "",
      email: contactVia === "email" ? text("contact") : "",
      departureDate: exact ? departureDate : "",
      returnDate: exact ? returnDate : "",
      adults,
      children,
      infants,
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
    <form onSubmit={handleSubmit} className="space-y-7">
      {tour ? (
        <div className="rounded-xl bg-[#faf8f5] px-4 py-3 text-sm">
          <span className="text-gray-400">{t("tour")}: </span>
          <span className="font-semibold text-gray-800">{tour.name}</span>
          <span className="text-gray-400"> · {tour.destination}</span>
        </div>
      ) : (
        <Section step={1} title={t("destinations")} hint={t("choose_one")}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("destinations")}>
            {destinationOptions?.map((d) => (
              <Chip key={d} selected={destination === d} onClick={() => setDestination(d)}>
                {d}
              </Chip>
            ))}
            <Chip selected={destination === ""} onClick={() => setDestination("")}>
              {t("destination_any")}
            </Chip>
          </div>
        </Section>
      )}

      <Section step={tour ? 1 : 2} title={t("when")}>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("when")}>
          {TRAVEL_WINDOWS.map((w) => (
            <Chip key={w} selected={travelWindow === w} onClick={() => setTravelWindow(w)}>
              {t(`when_${w}`)}
            </Chip>
          ))}
        </div>
        {travelWindow === "exact" && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="quote-departure" className="text-xs text-gray-500">{t("departure_date")}</Label>
              <Input
                id="quote-departure"
                type="date"
                min={today}
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quote-return" className="text-xs text-gray-500">{t("return_date")}</Label>
              <Input
                id="quote-return"
                type="date"
                min={departureDate || today}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </Section>

      <Section step={tour ? 2 : 3} title={t("travelers")}>
        <div className="grid gap-2 sm:grid-cols-3">
          <Stepper label={t("adults")} value={adults} min={1} max={50} onChange={setAdults} />
          <Stepper label={t("children")} hint={t("children_hint")} value={children} min={0} max={50} onChange={setChildren} />
          <Stepper label={t("infants")} hint={t("infants_hint")} value={infants} min={0} max={20} onChange={setInfants} />
        </div>
      </Section>

      <Section step={tour ? 3 : 4} title={t("contact")}>
        <div className="flex gap-3" role="radiogroup" aria-label={t("contact")}>
          <ContactOption
            selected={contactVia === "whatsapp"}
            onClick={() => setContactVia("whatsapp")}
            icon={<MessageCircle className="h-4 w-4" />}
          >
            {t("via_whatsapp")}
          </ContactOption>
          <ContactOption
            selected={contactVia === "email"}
            onClick={() => setContactVia("email")}
            icon={<Mail className="h-4 w-4" />}
          >
            {t("via_email")}
          </ContactOption>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="quote-name" className="text-xs text-gray-500">{t("name")}</Label>
            <Input id="quote-name" name="name" required minLength={2} maxLength={100} autoComplete="given-name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quote-contact" className="text-xs text-gray-500">
              {contactVia === "whatsapp" ? t("phone") : t("email")}
            </Label>
            {contactVia === "whatsapp" ? (
              <Input
                key="phone"
                id="quote-contact"
                name="contact"
                type="tel"
                required
                pattern="\+?[\d\s\-().]{6,20}"
                title={t("phone_invalid")}
                autoComplete="tel"
                placeholder="+51 987 654 321"
                className="placeholder:text-gray-400"
              />
            ) : (
              <Input key="email" id="quote-contact" name="contact" type="email" required autoComplete="email" />
            )}
          </div>
        </div>
      </Section>

      {showMessage ? (
        <div className="space-y-1.5">
          <Label htmlFor="quote-message" className="text-xs text-gray-500">{t("message")}</Label>
          <Textarea id="quote-message" name="message" rows={3} maxLength={2000} placeholder={t("message_placeholder")} autoFocus />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowMessage(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-darkTeal hover:underline"
        >
          <Plus className="h-4 w-4" />
          {t("add_message")}
        </button>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-400">{t("privacy")}</p>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={requestQuote.isPending}>
          {requestQuote.isPending ? t("sending") : t("send")}
        </Button>
      </div>
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
