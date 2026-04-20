"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Script from "next/script";
import {
    CreditCard, ShieldCheck, CheckCircle2, ArrowLeft, Loader2,
    DollarSign, Minus, Plus, CalendarDays, Users,
} from "lucide-react";

import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { getTrafficData } from "@/hooks/use-traffic-tracking";
import { Link } from "@/i18n/routing";
import { DownloadPDFButton } from "@/components/pdf/download-button";
import { waUrl } from "@/lib/whatsapp";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Currency = "USD" | "PEN";
const RATE_FALLBACK = 3.75;

interface PricingTier {
    id: string;
    labelEs: string;
    labelEn: string;
    ageMin: number | null;
    ageMax: number | null;
    priceUsd: number;
    isDefault: boolean;
}
interface TourData {
    id: string;
    nameEs: string;
    nameEn: string;
    slug: string;
    bookingMode: "CALENDAR" | "DEPARTURES" | "BOTH";
    pricing: {
        basePriceUsdAdult: number;
        basePriceUsdChild: number;
        tiers?: PricingTier[];
    } | null;
    departures: { id: string; departureDate: string; maxCapacity: number; bookedCount: number }[];
    image: string;
}

const checkoutSchema = z.object({
    firstName: z.string().min(2, "Nombre requerido"),
    lastName:  z.string().min(2, "Apellido requerido"),
    email:     z.string().email("Correo inválido"),
    phone:     z.string().min(6, "Teléfono requerido"),
    country:   z.string().min(2, "País requerido"),
});
type CheckoutFormData = z.infer<typeof checkoutSchema>;
type CheckoutStep = "details" | "payment" | "success";

// Culqi global
declare global {
    interface Window {
        Culqi?: {
            publicKey: string;
            settings: (o: { title: string; currency: string; amount: number; description?: string; order?: string }) => void;
            options?: (o: Record<string, unknown>) => void;
            open: () => void;
            token?: { id: string };
            error?: { user_message: string };
        };
        culqiAction?: () => void;
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ageLabel(tier: PricingTier, isEs: boolean): string {
    if (tier.ageMin == null && tier.ageMax == null) return "";
    if (tier.ageMin != null && tier.ageMax != null)
        return isEs ? `${tier.ageMin}–${tier.ageMax} años` : `${tier.ageMin}–${tier.ageMax} yrs`;
    if (tier.ageMin != null)
        return isEs ? `+${tier.ageMin} años` : `${tier.ageMin}+ yrs`;
    return isEs ? `hasta ${tier.ageMax} años` : `up to ${tier.ageMax} yrs`;
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ value, onChange, min = 0, max = 20 }: {
    value: number; onChange: (n: number) => void; min?: number; max?: number;
}) {
    return (
        <div className="flex items-center gap-1">
            <button
                type="button"
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={value <= min}
                className="flex h-8 w-8 items-center justify-center rounded-full border text-muted-foreground hover:border-brand-orange hover:text-brand-orange disabled:opacity-30 transition-colors"
            >
                <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center font-semibold tabular-nums">{value}</span>
            <button
                type="button"
                onClick={() => onChange(Math.min(max, value + 1))}
                disabled={value >= max}
                className="flex h-8 w-8 items-center justify-center rounded-full border text-muted-foreground hover:border-brand-orange hover:text-brand-orange disabled:opacity-30 transition-colors"
            >
                <Plus className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

// ─── Componente principal ──────────────────────────────────────────────────────
export function CheckoutForm({
    tour,
    locale,
    initialDate,
}: {
    tour: TourData;
    locale: string;
    initialDate?: string;
}) {
    const isEs = locale === "es";
    const { toast } = useToast();

    const [step, setStep] = useState<CheckoutStep>("details");
    const [reservationId, setReservationId] = useState<string | null>(null);
    const [referenceCode, setReferenceCode] = useState<string>("");
    const [currency, setCurrency] = useState<Currency>("USD");
    const [culqiReady, setCulqiReady] = useState(false);
    const [paypalReady, setPaypalReady] = useState(false);
    const [paypalRendered, setPaypalRendered] = useState(false);
    // ── Settings públicos (pasarelas activas) ────────────────────────────────
    const { data: publicSettings } = trpc.public.settings.useQuery(undefined, { staleTime: 60 * 1000 });
    const culqiEnabled = (() => {
        const v = (publicSettings as Record<string, unknown> | undefined)?.culqiEnabled;
        return v === "true" || v === true || v === "1" || v === 1;
    })();

    const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">(culqiEnabled ? "card" : "paypal");
    const [isProcessing, setIsProcessing] = useState(false);
    const paypalContainerRef = useRef<HTMLDivElement>(null);

    // ── Fecha ────────────────────────────────────────────────────────────────
    // hasDepartures = true solo si el modo lo permite Y hay salidas en DB
    const showDepartures =
        (tour.bookingMode === "DEPARTURES" || tour.bookingMode === "BOTH") &&
        tour.departures.length > 0;
    const showOpenCalendar =
        tour.bookingMode === "CALENDAR" || tour.bookingMode === "BOTH";
    // Alias para compatibilidad con resto del código
    const hasDepartures = showDepartures;
    const [selectedDeparture, setSelectedDeparture] = useState<string>("");
    // Si hay calendario abierto usamos date picker (pre-llenado desde ?date=)
    const [openDate, setOpenDate] = useState<string>(initialDate || "");
    const todayStr = new Date().toISOString().split("T")[0];

    // ── Participantes por tier ────────────────────────────────────────────────
    const tiers = tour.pricing?.tiers ?? [];
    const hasTiers = tiers.length > 0;

    // Quantities por tierId. Default tier empieza en 1, el resto en 0.
    const [quantities, setQuantities] = useState<Record<string, number>>(() => {
        const init: Record<string, number> = {};
        tiers.forEach((t, i) => { init[t.id] = i === 0 ? 1 : 0; });
        return init;
    });

    // Fallback si no hay tiers: adultos/niños clásico
    const [adultsFallback, setAdultsFallback] = useState(1);
    const [childrenFallback, setChildrenFallback] = useState(0);

    // ── Tipo de cambio oficial SUNAT ─────────────────────────────────────────
    const { data: rateData } = trpc.culqiCharge.getExchangeRate.useQuery(undefined, {
        staleTime: 4 * 60 * 60 * 1000,
    });
    const exchangeRate = rateData?.rate ?? RATE_FALLBACK;

    // ── Cálculo de totales ────────────────────────────────────────────────────
    const rate = currency === "PEN" ? exchangeRate : 1;

    const tierLines = hasTiers
        ? tiers.map((t) => ({
              tier: t,
              qty: quantities[t.id] ?? 0,
              unitPrice: t.priceUsd * rate,
              subtotal: (quantities[t.id] ?? 0) * t.priceUsd * rate,
          })).filter((l) => l.qty > 0)
        : [];

    const grandTotal = hasTiers
        ? tiers.reduce((acc, t) => acc + (quantities[t.id] ?? 0) * t.priceUsd * rate, 0)
        : (adultsFallback * (tour.pricing?.basePriceUsdAdult ?? 0) +
           childrenFallback * (tour.pricing?.basePriceUsdChild ?? 0)) * rate;

    const grandTotalUsd = hasTiers
        ? tiers.reduce((acc, t) => acc + (quantities[t.id] ?? 0) * t.priceUsd, 0)
        : adultsFallback * (tour.pricing?.basePriceUsdAdult ?? 0) +
          childrenFallback * (tour.pricing?.basePriceUsdChild ?? 0);

    const totalParticipants = hasTiers
        ? tiers.reduce((acc, t) => acc + (quantities[t.id] ?? 0), 0)
        : adultsFallback + childrenFallback;

    // adultos y niños para el backend
    const adultsForBackend = hasTiers
        ? (quantities[tiers.find((t) => t.isDefault)?.id ?? ""] ?? 0) || tiers.reduce((a, t) => a + (quantities[t.id] ?? 0), 0)
        : adultsFallback;
    const childrenForBackend = hasTiers
        ? tiers.filter((t) => !t.isDefault).reduce((a, t) => a + (quantities[t.id] ?? 0), 0)
        : childrenFallback;

    // ── Form ─────────────────────────────────────────────────────────────────
    const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
    });

    // ── Refs para Culqi ──────────────────────────────────────────────────────
    const emailRef  = useRef("");
    const amountRef = useRef(0);

    // ── tRPC mutations ────────────────────────────────────────────────────────
    const createReservation = trpc.reservation.createGuestReservation.useMutation({
        onSuccess: (data: any) => {
            setReservationId(data.id);
            setReferenceCode(data.referenceCode);
            setStep("payment");
        },
        onError: (e: any) => {
            toast({ variant: "destructive", title: "Error", description: e.message });
        },
    });

    const createCharge = trpc.culqiCharge.createCharge.useMutation({
        onSuccess: () => { setIsProcessing(false); setStep("success"); },
        onError: (e: any) => {
            setIsProcessing(false);
            toast({ variant: "destructive", title: isEs ? "Pago rechazado" : "Payment declined", description: e.message });
        },
    });

    const createPaypalOrder = trpc.paypal.createOrder.useMutation();
    const capturePaypalOrder = trpc.paypal.captureOrder.useMutation({
        onSuccess: () => { setIsProcessing(false); setStep("success"); },
        onError: (e: any) => {
            setIsProcessing(false);
            toast({ variant: "destructive", title: isEs ? "Pago PayPal fallido" : "PayPal payment failed", description: e.message });
        },
    });

    // ── PayPal buttons (renderiza cuando el SDK carga y método=paypal) ────────
    useEffect(() => {
        if (
            step !== "payment" ||
            paymentMethod !== "paypal" ||
            !paypalReady ||
            !reservationId ||
            !referenceCode ||
            paypalRendered
        ) return;
        if (!window.paypal || !paypalContainerRef.current) return;

        setPaypalRendered(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).paypal.Buttons({
            style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
            createOrder: async () => {
                const order = await createPaypalOrder.mutateAsync({ reservationId: reservationId!, referenceCode });
                return order.id;
            },
            onApprove: async (data: { orderID: string }) => {
                setIsProcessing(true);
                capturePaypalOrder.mutate({ orderId: data.orderID, reservationId: reservationId!, referenceCode });
            },
            onError: (err: any) => {
                console.error("PayPal error", err);
                toast({ variant: "destructive", title: "PayPal Error", description: isEs ? "Ocurrió un error con PayPal. Intenta de nuevo." : "PayPal encountered an error. Please try again." });
            },
        }).render(paypalContainerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, paymentMethod, paypalReady, reservationId, referenceCode, paypalRendered]);

    // Resetea paypalRendered cuando cambia el método de pago
    useEffect(() => {
        if (paymentMethod !== "paypal") setPaypalRendered(false);
    }, [paymentMethod]);

    // Si Culqi esta desactivado, forza PayPal (admin podria haberlo apagado)
    useEffect(() => {
        if (!culqiEnabled && paymentMethod === "card") {
            setPaymentMethod("paypal");
            if (currency !== "USD") setCurrency("USD");
        }
    }, [culqiEnabled, paymentMethod, currency]);

    // ── Culqi callback ────────────────────────────────────────────────────────
    useEffect(() => {
        window.culqiAction = function () {
            const c = window.Culqi;
            if (!c) return;
            if (c.token) {
                setIsProcessing(true);
                createCharge.mutate({
                    reservationId: reservationId!,
                    token: c.token.id,
                    currency,
                    amount: amountRef.current,
                    email: emailRef.current,
                });
            } else if (c.error) {
                toast({ variant: "destructive", title: isEs ? "Error de pago" : "Payment error", description: c.error.user_message });
            }
        };
        return () => { window.culqiAction = undefined; };
    }, [reservationId, currency, createCharge, isEs, toast]);

    // ── Abrir Culqi ──────────────────────────────────────────────────────────
    function openCulqi() {
        if (!window.Culqi) {
            toast({ variant: "destructive", title: "Error", description: "Pasarela no cargada aún" });
            return;
        }
        amountRef.current = Math.round(grandTotal * 100);
        emailRef.current  = watch("email");
        window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY || "";
        window.Culqi.settings({
            title: "Like In House",
            currency,
            amount: amountRef.current,
            description: `Reserva ${referenceCode}`,
        });
        if (typeof window.Culqi.options === "function") {
            window.Culqi.options({
                lang: isEs ? "es" : "en",
                installments: false,
                paymentMethods: {
                    tarjeta: true,
                    yape: currency === "PEN",
                    bancaMovil: false,
                    agente: false,
                    billetera: false,
                    cuotealo: false,
                },
                style: { logo: `${window.location.origin}/Logo.svg` },
            });
        }
        window.Culqi.open();
    }

    // ── Submit paso 1 ────────────────────────────────────────────────────────
    const onSubmit = (data: CheckoutFormData) => {
        if (showDepartures && !showOpenCalendar && !selectedDeparture) {
            toast({ variant: "destructive", title: isEs ? "Fecha requerida" : "Date required", description: isEs ? "Selecciona una fecha de salida" : "Please select a departure date" });
            return;
        }
        if (showOpenCalendar && !showDepartures && !openDate) {
            toast({ variant: "destructive", title: isEs ? "Fecha requerida" : "Date required", description: isEs ? "Indica la fecha en que deseas el tour" : "Please indicate your desired tour date" });
            return;
        }
        if (tour.bookingMode === "BOTH" && !selectedDeparture && !openDate) {
            toast({ variant: "destructive", title: isEs ? "Fecha requerida" : "Date required", description: isEs ? "Selecciona una fecha de salida o indica tu fecha preferida" : "Select a departure date or indicate your preferred date" });
            return;
        }
        if (totalParticipants === 0) {
            toast({ variant: "destructive", title: isEs ? "Sin participantes" : "No participants", description: isEs ? "Agrega al menos 1 persona" : "Add at least 1 person" });
            return;
        }

        const trafficData = getTrafficData();
        const tierNote = hasTiers
            ? tiers.filter((t) => (quantities[t.id] ?? 0) > 0)
                   .map((t) => `${isEs ? t.labelEs : t.labelEn}: ${quantities[t.id]}`)
                   .join(" | ")
            : undefined;

        createReservation.mutate({
            tourId:      tour.id,
            departureId: hasDepartures ? (selectedDeparture || undefined) : undefined,
            firstName:   data.firstName,
            lastName:    data.lastName,
            email:       data.email,
            phone:       data.phone,
            country:     data.country,
            adults:         adultsForBackend,
            children:       childrenForBackend,
            currency,
            totalAmount:    grandTotal,
            totalAmountUsd: grandTotalUsd,
            tierQuantities: hasTiers
                ? tiers.filter((t) => (quantities[t.id] ?? 0) > 0)
                       .map((t) => ({ tierId: t.id, quantity: quantities[t.id] ?? 0 }))
                : undefined,
            internalNotes: [
                openDate && !selectedDeparture ? `Fecha solicitada: ${openDate}` : null,
                tierNote,
            ].filter(Boolean).join(" | ") || undefined,
            trafficSource: {
                firstSource:  trafficData.firstSource,
                lastSource:   trafficData.lastSource,
                utmSource:    trafficData.utmSource    || undefined,
                utmCampaign:  trafficData.utmCampaign  || undefined,
                utmMedium:    trafficData.utmMedium    || undefined,
                utmContent:   trafficData.utmContent   || undefined,
            },
        });
    };

    const currencySymbol = currency === "USD" ? "$" : "S/";

    // ── Pantalla de éxito ─────────────────────────────────────────────────────
    if (step === "success") {
        return (
            <div className="max-w-lg mx-auto text-center space-y-6 py-12">
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-brand-teal/15 flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-brand-teal" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold">{isEs ? "¡Reserva Confirmada!" : "Booking Confirmed!"}</h2>
                <p className="text-muted-foreground">
                    {isEs ? "Recibirás un correo con todos los detalles de tu aventura." : "You'll receive an email with all your adventure details."}
                </p>
                <Card>
                    <CardContent className="p-6 space-y-3 text-left">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{isEs ? "Código" : "Code"}</span>
                            <span className="font-mono font-bold text-lg">{referenceCode}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Tour</span>
                            <span className="font-medium">{isEs ? tour.nameEs : tour.nameEn}</span>
                        </div>
                        {tierLines.map((l) => (
                            <div key={l.tier.id} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    {l.qty}× {isEs ? l.tier.labelEs : l.tier.labelEn}
                                </span>
                                <span>{currencySymbol} {l.subtotal.toFixed(2)}</span>
                            </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between font-bold">
                            <span>Total pagado</span>
                            <span className="text-primary text-xl">{currencySymbol} {grandTotal.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <DownloadPDFButton
                        isEs={isEs}
                        data={{
                            referenceCode,
                            serviceName:  isEs ? tour.nameEs : tour.nameEn,
                            clientName:   `${watch("firstName")} ${watch("lastName")}`,
                            clientEmail:  watch("email"),
                            amountPaid:   grandTotal,
                            totalAmount:  grandTotal,
                            currency,
                            dateStr:      showDepartures && selectedDeparture
                                ? format(new Date(tour.departures.find((d) => d.id === selectedDeparture)?.departureDate || new Date()), "dd MMM yyyy", { locale: isEs ? es : undefined })
                                : openDate || "",
                            adults:    adultsForBackend,
                            children:  childrenForBackend,
                            isEs,
                            type: "RESERVATION",
                        }}
                    />
                    <Button asChild className="h-12">
                        <a
                            href={waUrl(`Hola, confirmé mi reserva del tour ${tour.nameEs}. Código: ${referenceCode}`)}
                            target="_blank" rel="noopener noreferrer"
                        >WhatsApp</a>
                    </Button>
                    <Button variant="outline" asChild className="h-12 hidden sm:flex">
                        <Link href="/tours"><ArrowLeft className="h-4 w-4 mr-2" />{isEs ? "Ver más tours" : "Browse tours"}</Link>
                    </Button>
                </div>
            </div>
        );
    }

    // ── Layout principal ──────────────────────────────────────────────────────
    return (
        <>
            {culqiEnabled && (
                <Script src="https://checkout.culqi.com/js/v4" strategy="lazyOnload" onLoad={() => setCulqiReady(true)} />
            )}
            <Script
                src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb"}&currency=USD&intent=capture`}
                strategy="lazyOnload"
                onLoad={() => setPaypalReady(true)}
            />

            <div className="grid lg:grid-cols-12 gap-8 items-start">

                {/* Indicador de pasos */}
                <div className="lg:col-span-12 flex items-center justify-center gap-2 mb-2">
                    {[
                        { key: "details", label: isEs ? "1. Datos" : "1. Details" },
                        { key: "payment", label: isEs ? "2. Pago" : "2. Payment" },
                        { key: "success", label: isEs ? "3. Confirmación" : "3. Confirmation" },
                    ].map((s, i) => (
                        <div key={s.key} className="flex items-center gap-2">
                            {i > 0 && <div className={`h-px w-8 ${["payment","success"].indexOf(step) >= i ? "bg-primary" : "bg-border"}`} />}
                            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                                step === s.key ? "bg-primary text-primary-foreground"
                                : ["payment","success"].indexOf(step) > ["details","payment","success"].indexOf(s.key) ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* ─── Columna izquierda ──────────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-5">

                    {/* PASO 1 */}
                    {step === "details" && (
                        <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                            {/* Datos personales */}
                            <Card className="border-t-4 border-t-primary">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg">{isEs ? "Datos del viajero" : "Traveler details"}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label>{isEs ? "Nombres" : "First Name"}</Label>
                                            <Input {...register("firstName")} placeholder="María" />
                                            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>{isEs ? "Apellidos" : "Last Name"}</Label>
                                            <Input {...register("lastName")} placeholder="García" />
                                            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label>{isEs ? "Correo" : "Email"}</Label>
                                            <Input type="email" {...register("email")} placeholder="viajero@email.com" />
                                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>{isEs ? "WhatsApp / Teléfono" : "Phone"}</Label>
                                            <Input type="tel" {...register("phone")} placeholder="+51 999 888 777" />
                                            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>{isEs ? "País de residencia" : "Country"}</Label>
                                        <select {...register("country")} defaultValue=""
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                            <option value="" disabled>{isEs ? "Selecciona tu país" : "Select your country"}</option>
                                            <option value="Peru">Perú</option>
                                            <option value="Argentina">Argentina</option>
                                            <option value="Bolivia">Bolivia</option>
                                            <option value="Brasil">Brasil</option>
                                            <option value="Chile">Chile</option>
                                            <option value="Colombia">Colombia</option>
                                            <option value="Ecuador">Ecuador</option>
                                            <option value="Mexico">México</option>
                                            <option value="Paraguay">Paraguay</option>
                                            <option value="Uruguay">Uruguay</option>
                                            <option value="Venezuela">Venezuela</option>
                                            <option value="USA">Estados Unidos / USA</option>
                                            <option value="Canada">Canadá</option>
                                            <option value="Spain">España</option>
                                            <option value="France">Francia / France</option>
                                            <option value="Germany">Alemania / Germany</option>
                                            <option value="UK">Reino Unido / UK</option>
                                            <option value="Italy">Italia / Italy</option>
                                            <option value="Australia">Australia</option>
                                            <option value="Japan">Japón / Japan</option>
                                            <option value="Other">{isEs ? "Otro" : "Other"}</option>
                                        </select>
                                        {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Fecha */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="h-5 w-5 text-brand-orange" />
                                        <CardTitle className="text-lg">{isEs ? "¿Cuándo quieres ir?" : "When do you want to go?"}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {showDepartures && (
                                            /* Fechas fijas de salida */
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {tour.departures.map((dep) => {
                                                    const available = dep.maxCapacity - dep.bookedCount;
                                                    const isSel = selectedDeparture === dep.id;
                                                    return (
                                                        <button key={dep.id} type="button"
                                                            onClick={() => setSelectedDeparture(dep.id)}
                                                            className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all ${
                                                                isSel ? "border-brand-orange bg-brand-orange/8 ring-1 ring-brand-orange" : "border-border hover:border-brand-orange/50"
                                                            }`}>
                                                            <span className={`font-semibold text-sm ${isSel ? "text-brand-orange" : ""}`}>
                                                                {format(new Date(dep.departureDate), "dd MMM yyyy", { locale: isEs ? es : undefined })}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground mt-1">
                                                                {available} {isEs ? "cupos" : "spots"}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {showOpenCalendar && (
                                            /* Calendario abierto */
                                            <div className="space-y-2">
                                                {tour.bookingMode === "BOTH" && (
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                        {isEs ? "O elige otra fecha:" : "Or pick another date:"}
                                                    </p>
                                                )}
                                                {tour.bookingMode === "CALENDAR" && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {isEs
                                                            ? "Este tour se realiza a pedido. Elige tu fecha preferida y nos coordinaremos contigo."
                                                            : "This tour runs on request. Pick your preferred date and we'll coordinate with you."}
                                                    </p>
                                                )}
                                                <Input
                                                    type="date"
                                                    value={openDate}
                                                    min={todayStr}
                                                    onChange={(e) => setOpenDate(e.target.value)}
                                                    className="max-w-xs"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Participantes */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-brand-orange" />
                                        <CardTitle className="text-lg">
                                            {isEs ? "¿Cuántos viajan?" : "How many are traveling?"}
                                        </CardTitle>
                                    </div>
                                    {hasTiers && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {isEs ? "Precios por persona en" : "Prices per person in"}{" "}
                                            <span className="font-medium">{currency}</span>
                                            {currency === "PEN" && ` (TC: S/ ${exchangeRate.toFixed(3)})`}
                                        </p>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {hasTiers ? (
                                        <div className="space-y-3">
                                            {tiers.map((tier) => {
                                                const price = tier.priceUsd * rate;
                                                const qty   = quantities[tier.id] ?? 0;
                                                const label = isEs ? tier.labelEs : tier.labelEn;
                                                const age   = ageLabel(tier, isEs);
                                                return (
                                                    <div key={tier.id}
                                                        className="flex items-center justify-between rounded-xl border p-3.5 hover:border-brand-orange/30 transition-colors">
                                                        <div>
                                                            <p className="font-medium text-sm">{label}</p>
                                                            {age && <p className="text-xs text-muted-foreground">{age}</p>}
                                                            <p className="text-sm font-semibold text-brand-orange mt-0.5">
                                                                {currencySymbol} {price.toFixed(2)}
                                                                <span className="text-xs font-normal text-muted-foreground ml-1">
                                                                    {isEs ? "/ persona" : "/ person"}
                                                                </span>
                                                            </p>
                                                        </div>
                                                        <Stepper
                                                            value={qty}
                                                            min={tier.isDefault ? 0 : 0}
                                                            onChange={(n) => setQuantities((prev) => ({ ...prev, [tier.id]: n }))}
                                                        />
                                                    </div>
                                                );
                                            })}
                                            {totalParticipants === 0 && (
                                                <p className="text-xs text-destructive text-center pt-1">
                                                    {isEs ? "Agrega al menos 1 participante" : "Add at least 1 participant"}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        /* Fallback sin tiers */
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between rounded-xl border p-3.5">
                                                <div>
                                                    <p className="font-medium text-sm">{isEs ? "Adultos" : "Adults"}</p>
                                                    <p className="text-sm font-semibold text-brand-orange">
                                                        {currencySymbol} {((tour.pricing?.basePriceUsdAdult ?? 0) * rate).toFixed(2)}
                                                    </p>
                                                </div>
                                                <Stepper value={adultsFallback} min={1} onChange={setAdultsFallback} />
                                            </div>
                                            <div className="flex items-center justify-between rounded-xl border p-3.5">
                                                <div>
                                                    <p className="font-medium text-sm">{isEs ? "Niños" : "Children"}</p>
                                                    <p className="text-sm font-semibold text-brand-orange">
                                                        {currencySymbol} {((tour.pricing?.basePriceUsdChild ?? 0) * rate).toFixed(2)}
                                                    </p>
                                                </div>
                                                <Stepper value={childrenFallback} min={0} onChange={setChildrenFallback} />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </form>
                    )}

                    {/* PASO 2: Pago */}
                    {step === "payment" && (
                        <div className="space-y-5">
                            <Card className="border-t-4 border-t-primary">
                                <CardHeader>
                                    <CardTitle>{isEs ? "Pago seguro con tarjeta" : "Secure card payment"}</CardTitle>
                                    <CardDescription>
                                        {isEs ? `Reserva ${referenceCode}` : `Booking ${referenceCode}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {/* Resumen de lo que se paga */}
                                    <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-sm">
                                        {hasTiers ? (
                                            tierLines.length > 0 ? tierLines.map((l) => (
                                                <div key={l.tier.id} className="flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        {l.qty}× {isEs ? l.tier.labelEs : l.tier.labelEn}
                                                    </span>
                                                    <span>{currencySymbol} {l.subtotal.toFixed(2)}</span>
                                                </div>
                                            )) : (
                                                <p className="text-muted-foreground text-center">—</p>
                                            )
                                        ) : (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">{adultsForBackend}× {isEs ? "Adultos" : "Adults"}</span>
                                                    <span>{currencySymbol} {(adultsForBackend * (tour.pricing?.basePriceUsdAdult ?? 0) * rate).toFixed(2)}</span>
                                                </div>
                                                {childrenForBackend > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">{childrenForBackend}× {isEs ? "Niños" : "Children"}</span>
                                                        <span>{currencySymbol} {(childrenForBackend * (tour.pricing?.basePriceUsdChild ?? 0) * rate).toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <Separator />
                                        <div className="flex justify-between font-bold text-base">
                                            <span>Total</span>
                                            <span className="text-primary">{currencySymbol} {grandTotal.toFixed(2)}</span>
                                        </div>
                                        {currency === "PEN" && (
                                            <p className="text-xs text-muted-foreground text-right">≈ $ {grandTotalUsd.toFixed(2)} USD</p>
                                        )}
                                    </div>

                                    {/* Selector de método de pago */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            {isEs ? "Método de pago" : "Payment method"}
                                        </p>
                                        <div className={culqiEnabled ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}>
                                            {culqiEnabled && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMethod("card")}
                                                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                                                        paymentMethod === "card"
                                                            ? "border-brand-orange bg-brand-orange/5 text-brand-orange"
                                                            : "border-border hover:border-brand-orange/40"
                                                    }`}
                                                >
                                                    <CreditCard className="h-4 w-4" />
                                                    {isEs ? "Tarjeta / Yape" : "Card / Yape"}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => { setPaymentMethod("paypal"); if (currency !== "USD") setCurrency("USD"); }}
                                                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                                                    paymentMethod === "paypal"
                                                        ? "border-[#003087] bg-[#003087]/5 text-[#003087]"
                                                        : "border-border hover:border-[#003087]/40"
                                                }`}
                                            >
                                                <span className="font-bold text-[#003087]">Pay</span>
                                                <span className="font-bold text-[#009cde]">Pal</span>
                                            </button>
                                        </div>
                                        {paymentMethod === "paypal" && currency === "USD" && (
                                            <p className="text-xs text-muted-foreground text-center">
                                                {isEs ? "PayPal solo acepta pagos en USD" : "PayPal only accepts USD payments"}
                                            </p>
                                        )}
                                    </div>

                                    {/* Pago con tarjeta (Culqi) */}
                                    {paymentMethod === "card" && (
                                        <div className="space-y-3">
                                            <Button
                                                onClick={openCulqi}
                                                disabled={!culqiReady || isProcessing}
                                                size="lg"
                                                className="w-full h-14 text-base bg-brand-orange hover:bg-brand-darkRed gap-2"
                                            >
                                                {isProcessing ? (
                                                    <><Loader2 className="h-5 w-5 animate-spin" />{isEs ? "Procesando..." : "Processing..."}</>
                                                ) : !culqiReady ? (
                                                    <><Loader2 className="h-5 w-5 animate-spin" />{isEs ? "Cargando pasarela..." : "Loading..."}</>
                                                ) : (
                                                    <><CreditCard className="h-5 w-5" />{isEs ? "Pagar con Tarjeta" : "Pay with Card"} — {currencySymbol} {grandTotal.toFixed(2)}</>
                                                )}
                                            </Button>
                                            <div className="text-center space-y-1">
                                                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                                    <ShieldCheck className="h-4 w-4 text-brand-teal" />
                                                    {isEs ? "Pago seguro por Culqi" : "Secure payment by Culqi"}
                                                </div>
                                                <p className="text-xs text-muted-foreground">Visa · Mastercard · Amex · Diners · Yape</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Pago con PayPal */}
                                    {paymentMethod === "paypal" && (
                                        <div className="space-y-3">
                                            {isProcessing ? (
                                                <div className="flex items-center justify-center h-14">
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                    <span className="text-sm">{isEs ? "Procesando pago..." : "Processing payment..."}</span>
                                                </div>
                                            ) : !paypalReady ? (
                                                <div className="flex items-center justify-center h-14">
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                    <span className="text-sm text-muted-foreground">{isEs ? "Cargando PayPal..." : "Loading PayPal..."}</span>
                                                </div>
                                            ) : (
                                                <div ref={paypalContainerRef} className="min-h-[50px]" />
                                            )}
                                            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                                <ShieldCheck className="h-4 w-4 text-brand-teal" />
                                                {isEs ? "Pago seguro por PayPal" : "Secure payment by PayPal"}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Button variant="ghost" onClick={() => setStep("details")} className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                {isEs ? "Volver a datos" : "Back to details"}
                            </Button>
                        </div>
                    )}
                </div>

                {/* ─── Sidebar resumen ─────────────────────────────────────── */}
                <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
                    <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
                        <CardHeader className="bg-muted/40 pb-4">
                            <CardTitle className="text-base">{isEs ? "Resumen" : "Summary"}</CardTitle>
                        </CardHeader>

                        {tour.image && (
                            <div className="aspect-video w-full relative overflow-hidden">
                                <img src={tour.image} alt={tour.nameEs} className="object-cover w-full h-full" />
                            </div>
                        )}

                        <CardContent className="p-4 space-y-4">
                            <p className="font-bold text-base leading-snug">{isEs ? tour.nameEs : tour.nameEn}</p>

                            {/* Moneda */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {isEs ? "Moneda de pago" : "Payment currency"}
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["USD","PEN"] as Currency[]).map((c) => (
                                        <button key={c} type="button"
                                            onClick={() => setCurrency(c)}
                                            disabled={step === "payment"}
                                            className={`flex items-center justify-center gap-1.5 rounded-lg border-2 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                                currency === c
                                                    ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                                                    : "border-border hover:border-brand-orange/40 text-muted-foreground"
                                            }`}>
                                            <DollarSign className="h-3.5 w-3.5" />
                                            {c === "USD" ? "USD ($)" : "PEN (S/)"}
                                        </button>
                                    ))}
                                </div>
                                {currency === "PEN" && rateData && (
                                    <p className="text-xs text-center text-muted-foreground">
                                        {isEs ? "TC oficial SUNAT:" : "Official SUNAT rate:"}{" "}
                                        <span className="font-semibold text-foreground">S/ {exchangeRate.toFixed(3)}</span>
                                    </p>
                                )}
                            </div>

                            <Separator />

                            {/* Desglose de precios */}
                            <div className="space-y-2 text-sm">
                                {hasTiers ? (
                                    tiers.map((t) => {
                                        const qty = quantities[t.id] ?? 0;
                                        if (qty === 0 && step !== "details") return null;
                                        const price = t.priceUsd * rate;
                                        return (
                                            <div key={t.id} className={`flex justify-between ${qty === 0 ? "text-muted-foreground/40" : ""}`}>
                                                <span>{qty}× {isEs ? t.labelEs : t.labelEn}</span>
                                                <span>{qty > 0 ? `${currencySymbol} ${(qty * price).toFixed(2)}` : "—"}</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <>
                                        <div className="flex justify-between">
                                            <span>{adultsFallback}× {isEs ? "Adultos" : "Adults"}</span>
                                            <span>{currencySymbol} {(adultsFallback * (tour.pricing?.basePriceUsdAdult ?? 0) * rate).toFixed(2)}</span>
                                        </div>
                                        {childrenFallback > 0 && (
                                            <div className="flex justify-between">
                                                <span>{childrenFallback}× {isEs ? "Niños" : "Children"}</span>
                                                <span>{currencySymbol} {(childrenFallback * (tour.pricing?.basePriceUsdChild ?? 0) * rate).toFixed(2)}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center font-bold">
                                <span>Total</span>
                                <span className="text-primary text-2xl">{currencySymbol} {grandTotal.toFixed(2)}</span>
                            </div>

                            {referenceCode && (
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>{isEs ? "Código" : "Code"}</span>
                                    <span className="font-mono font-semibold text-foreground">{referenceCode}</span>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="bg-muted/40 p-4 flex-col gap-3">
                            {step === "details" && (
                                <Button
                                    type="submit" form="checkout-form" size="lg"
                                    className="w-full h-13 text-base bg-brand-orange hover:bg-brand-orange/90"
                                    disabled={createReservation.isPending || totalParticipants === 0}
                                >
                                    {createReservation.isPending ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{isEs ? "Procesando..." : "Processing..."}</>
                                    ) : (
                                        <><CreditCard className="w-5 h-5 mr-2" />{isEs ? "Continuar al Pago" : "Continue to Payment"}</>
                                    )}
                                </Button>
                            )}
                            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                <ShieldCheck className="w-4 h-4 text-brand-teal" />
                                {isEs ? "Pago seguro · SSL" : "Secure payment · SSL"}
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    );
}
