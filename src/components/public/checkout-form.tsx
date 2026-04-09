"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Script from "next/script";
import { CreditCard, ShieldCheck, CheckCircle2, ArrowLeft, Loader2, DollarSign } from "lucide-react";
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

// ─── Tipo de moneda ────────────────────────────────────────────────────────────
type Currency = "USD" | "PEN";
const RATE_FALLBACK = 3.75;

// ─── Formulario ────────────────────────────────────────────────────────────────
const checkoutSchema = z.object({
    firstName: z.string().min(2, "Nombre requerido"),
    lastName: z.string().min(2, "Apellido requerido"),
    email: z.string().email("Correo inválido"),
    phone: z.string().min(6, "Teléfono requerido"),
    country: z.string().min(2, "País requerido"),
    adults: z.number().min(1, "Al menos 1 adulto"),
    children: z.number().min(0),
    departureId: z.string().optional(),
});
type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ─── Props del tour ────────────────────────────────────────────────────────────
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
    pricing: {
        basePriceUsdAdult: number;
        basePriceUsdChild: number;
        tiers?: PricingTier[];
    } | null;
    departures: { id: string; departureDate: string; maxCapacity: number; bookedCount: number }[];
    image: string;
}

type CheckoutStep = "details" | "payment" | "success";

// ─── Declaración global de Culqi ───────────────────────────────────────────────
declare global {
    interface Window {
        Culqi?: {
            publicKey: string;
            settings: (opts: { title: string; currency: string; amount: number; order: string }) => void;
            open: () => void;
            close: () => void;
            token?: { id: string; email: string };
            order?: { id: string };
            error?: { user_message: string };
        };
        culqiAction?: () => void;
    }
}

// ─── Componente principal ──────────────────────────────────────────────────────
export function CheckoutForm({ tour, locale }: { tour: TourData; locale: string }) {
    const isEs = locale === "es";
    const { toast } = useToast();

    const [step, setStep] = useState<CheckoutStep>("details");
    const [selectedDeparture, setSelectedDeparture] = useState<string>("");
    const [reservationId, setReservationId] = useState<string | null>(null);
    const [referenceCode, setReferenceCode] = useState<string>("");
    const [currency, setCurrency] = useState<Currency>("USD");
    const [culqiReady, setCulqiReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Tipo de cambio oficial BCRP (fuente SUNAT)
    const { data: rateData } = trpc.culqiCharge.getExchangeRate.useQuery(undefined, {
        staleTime: 4 * 60 * 60 * 1000, // 4 horas
    });
    const exchangeRate = rateData?.rate ?? RATE_FALLBACK;

    const emailRef = useRef<string>("");
    const amountRef = useRef<number>(0); // en centavos

    const currencySymbol = currency === "USD" ? "$" : "S/";

    const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: { adults: 1, children: 0 },
    });

    const adults = watch("adults") || 1;
    const children = watch("children") || 0;

    // ─── Cálculo de precios ──────────────────────────────────────────────────
    const defaultTier = tour.pricing?.tiers?.find((t) => t.isDefault) ?? tour.pricing?.tiers?.[0];
    const childTier = tour.pricing?.tiers?.find(
        (t) => !t.isDefault && (t.ageMax != null || t.labelEs.toLowerCase().includes("niño"))
    );
    const adultPriceUsd = defaultTier?.priceUsd ?? (tour.pricing?.basePriceUsdAdult ?? 0);
    const childPriceUsd = childTier?.priceUsd ?? (tour.pricing?.basePriceUsdChild ?? 0);

    const rate = currency === "PEN" ? exchangeRate : 1;
    const adultPrice = adultPriceUsd * rate;
    const childPrice = childPriceUsd * rate;
    const totalAdults = adultPrice * adults;
    const totalChildren = childPrice * children;
    const grandTotal = totalAdults + totalChildren;
    const grandTotalUsd = adultPriceUsd * adults + childPriceUsd * children;

    // ─── tRPC Mutations ──────────────────────────────────────────────────────
    const createReservation = trpc.reservation.createGuestReservation.useMutation({
        onSuccess: (data: any) => {
            setReservationId(data.id);
            setReferenceCode(data.referenceCode);
            setStep("payment");
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Error al crear la reserva",
            });
        },
    });

    const createCharge = trpc.culqiCharge.createCharge.useMutation({
        onSuccess: () => {
            setIsProcessing(false);
            setStep("success");
        },
        onError: (error: any) => {
            setIsProcessing(false);
            toast({
                variant: "destructive",
                title: isEs ? "Pago rechazado" : "Payment declined",
                description: error.message || "Error al procesar el pago",
            });
        },
    });

    // ─── Culqi callback global ───────────────────────────────────────────────
    useEffect(() => {
        window.culqiAction = function () {
            const culqi = window.Culqi;
            if (!culqi) return;

            if (culqi.token) {
                setIsProcessing(true);
                createCharge.mutate({
                    reservationId: reservationId!,
                    token: culqi.token.id,
                    currency,
                    amount: amountRef.current,
                    email: emailRef.current,
                });
            } else if (culqi.error) {
                toast({
                    variant: "destructive",
                    title: isEs ? "Error de pago" : "Payment error",
                    description: culqi.error.user_message,
                });
            }
        };
        return () => { window.culqiAction = undefined; };
    }, [reservationId, currency, createCharge, isEs, toast]);

    // ─── Abrir modal Culqi ───────────────────────────────────────────────────
    function openCulqi() {
        if (!window.Culqi) {
            toast({ variant: "destructive", title: "Error", description: "Culqi no está cargado aún" });
            return;
        }
        const amountCentavos = Math.round(grandTotal * 100);
        amountRef.current = amountCentavos;
        emailRef.current = watch("email");

        window.Culqi.publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY || "";
        window.Culqi.settings({
            title: "Like In House",
            currency,
            amount: amountCentavos,
            order: referenceCode,
        });
        window.Culqi.open();
    }

    // ─── Submit paso 1 ───────────────────────────────────────────────────────
    const onSubmit = (data: CheckoutFormData) => {
        if (tour.departures.length > 0 && !selectedDeparture) {
            toast({
                variant: "destructive",
                title: isEs ? "Fecha requerida" : "Date required",
                description: isEs ? "Selecciona una fecha de salida" : "Please select a departure date",
            });
            return;
        }
        const trafficData = getTrafficData();
        createReservation.mutate({
            tourId: tour.id,
            departureId: selectedDeparture || undefined,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            country: data.country,
            adults: Number(data.adults),
            children: Number(data.children),
            currency,
            totalAmount: grandTotal,
            trafficSource: {
                firstSource: trafficData.firstSource,
                lastSource: trafficData.lastSource,
                utmSource: trafficData.utmSource || undefined,
                utmCampaign: trafficData.utmCampaign || undefined,
                utmMedium: trafficData.utmMedium || undefined,
                utmContent: trafficData.utmContent || undefined,
            },
        });
    };

    // ─── Pantalla de éxito ────────────────────────────────────────────────────
    if (step === "success") {
        return (
            <div className="max-w-lg mx-auto text-center space-y-6 py-12">
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-brand-teal/15 flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-brand-teal" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold">{isEs ? "¡Pago Exitoso!" : "Payment Successful!"}</h2>
                <p className="text-muted-foreground">
                    {isEs
                        ? "Tu reserva está confirmada. Recibirás un correo con los detalles."
                        : "Your booking is confirmed. You'll receive an email with the details."}
                </p>
                <Card>
                    <CardContent className="p-6 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">{isEs ? "Código de reserva" : "Booking code"}</span>
                            <span className="font-mono font-bold text-lg">{referenceCode}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Tour</span>
                            <span className="font-medium">{isEs ? tour.nameEs : tour.nameEn}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-bold text-primary">{currencySymbol} {grandTotal.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
                    <DownloadPDFButton
                        isEs={isEs}
                        data={{
                            referenceCode,
                            serviceName: isEs ? tour.nameEs : tour.nameEn,
                            clientName: `${watch("firstName")} ${watch("lastName")}`,
                            clientEmail: watch("email"),
                            amountPaid: grandTotal,
                            totalAmount: grandTotal,
                            currency,
                            dateStr: selectedDeparture
                                ? format(
                                      new Date(tour.departures.find((d) => d.id === selectedDeparture)?.departureDate || new Date()),
                                      "dd MMM yyyy",
                                      { locale: isEs ? es : undefined }
                                  )
                                : "",
                            adults,
                            children,
                            isEs,
                            type: "RESERVATION",
                        }}
                    />
                    <Button asChild className="w-full sm:w-auto h-12">
                        <a
                            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51984123456"}?text=${encodeURIComponent(
                                `Hola, acabo de reservar el tour ${tour.nameEs}. Mi código es ${referenceCode}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            WhatsApp
                        </a>
                    </Button>
                    <Button variant="outline" asChild className="w-full sm:w-auto h-12 hidden sm:flex">
                        <Link href="/tours">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {isEs ? "Ver más tours" : "Browse more tours"}
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    // ─── Layout principal ─────────────────────────────────────────────────────
    return (
        <>
            {/* Culqi.js — se carga una sola vez */}
            <Script
                src="https://checkout.culqi.com/js/v4"
                strategy="lazyOnload"
                onLoad={() => setCulqiReady(true)}
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
                            {i > 0 && (
                                <div
                                    className={`h-px w-8 ${
                                        ["payment", "success"].indexOf(step) >= i ? "bg-primary" : "bg-border"
                                    }`}
                                />
                            )}
                            <div
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                                    step === s.key
                                        ? "bg-primary text-primary-foreground"
                                        : ["payment", "success"].indexOf(step) >
                                          ["details", "payment", "success"].indexOf(s.key)
                                        ? "bg-primary/20 text-primary"
                                        : "bg-muted text-muted-foreground"
                                }`}
                            >
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ─── Columna izquierda ────────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-6">

                    {/* PASO 1: Datos del viajero */}
                    {step === "details" && (
                        <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <Card className="border-t-4 border-t-primary">
                                <CardHeader>
                                    <CardTitle>{isEs ? "Tus Datos" : "Your Details"}</CardTitle>
                                    <CardDescription>
                                        {isEs
                                            ? "Ingresa tu información para confirmar la reserva."
                                            : "Enter your info to confirm the booking."}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">{isEs ? "Nombres" : "First Name"}</Label>
                                            <Input id="firstName" {...register("firstName")} />
                                            {errors.firstName && <span className="text-sm text-destructive">{errors.firstName.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">{isEs ? "Apellidos" : "Last Name"}</Label>
                                            <Input id="lastName" {...register("lastName")} />
                                            {errors.lastName && <span className="text-sm text-destructive">{errors.lastName.message}</span>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">{isEs ? "Correo Electrónico" : "Email"}</Label>
                                            <Input id="email" type="email" placeholder="viajero@email.com" {...register("email")} />
                                            {errors.email && <span className="text-sm text-destructive">{errors.email.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">{isEs ? "Teléfono / WhatsApp" : "Phone"}</Label>
                                            <Input id="phone" type="tel" placeholder="+51 999 888 777" {...register("phone")} />
                                            {errors.phone && <span className="text-sm text-destructive">{errors.phone.message}</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country">{isEs ? "País de Residencia" : "Country"}</Label>
                                        <select
                                            id="country"
                                            {...register("country")}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            defaultValue=""
                                        >
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
                                        {errors.country && <span className="text-sm text-destructive">{errors.country.message}</span>}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{isEs ? "Detalles del Tour" : "Tour Details"}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {tour.departures.length > 0 && (
                                        <div className="space-y-3">
                                            <Label>{isEs ? "Selecciona una Fecha" : "Select a Date"}</Label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {tour.departures.map((dep) => {
                                                    const available = dep.maxCapacity - dep.bookedCount;
                                                    const isSelected = selectedDeparture === dep.id;
                                                    return (
                                                        <button
                                                            key={dep.id}
                                                            type="button"
                                                            onClick={() => setSelectedDeparture(dep.id)}
                                                            className={`flex flex-col text-left p-3 rounded-md border transition-all ${
                                                                isSelected
                                                                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                                                                    : "hover:border-primary/50"
                                                            }`}
                                                        >
                                                            <span className="font-semibold text-sm">
                                                                {format(new Date(dep.departureDate), "dd MMM yyyy", {
                                                                    locale: isEs ? es : undefined,
                                                                })}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground mt-1">
                                                                {available} {isEs ? "cupos disponibles" : "spots left"}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>{isEs ? "Adultos" : "Adults"}</Label>
                                            <Input type="number" min="1" {...register("adults", { valueAsNumber: true })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{isEs ? "Niños" : "Children"}</Label>
                                            <Input type="number" min="0" {...register("children", { valueAsNumber: true })} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    )}

                    {/* PASO 2: Pago */}
                    {step === "payment" && (
                        <div className="space-y-6">
                            <Card className="border-t-4 border-t-primary">
                                <CardHeader>
                                    <CardTitle>{isEs ? "Método de Pago" : "Payment Method"}</CardTitle>
                                    <CardDescription>
                                        {isEs
                                            ? `Reserva ${referenceCode} — Pago seguro con tarjeta`
                                            : `Booking ${referenceCode} — Secure card payment`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Resumen de pago */}
                                    <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                {adults}× {isEs ? "Adultos" : "Adults"}
                                            </span>
                                            <span>{currencySymbol} {totalAdults.toFixed(2)}</span>
                                        </div>
                                        {children > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">
                                                    {children}× {isEs ? "Niños" : "Children"}
                                                </span>
                                                <span>{currencySymbol} {totalChildren.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <Separator />
                                        <div className="flex justify-between font-bold text-base">
                                            <span>Total a pagar</span>
                                            <span className="text-primary">
                                                {currencySymbol} {grandTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        {currency === "PEN" && (
                                            <p className="text-xs text-muted-foreground text-right">
                                                ≈ $ {grandTotalUsd.toFixed(2)} USD (tipo de cambio {exchangeRate})
                                            </p>
                                        )}
                                    </div>

                                    {/* Botón pagar con Culqi */}
                                    <Button
                                        onClick={openCulqi}
                                        disabled={!culqiReady || isProcessing}
                                        size="lg"
                                        className="w-full h-14 text-base bg-brand-orange hover:bg-brand-darkRed gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                {isEs ? "Procesando pago..." : "Processing payment..."}
                                            </>
                                        ) : !culqiReady ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                {isEs ? "Cargando pasarela..." : "Loading gateway..."}
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="h-5 w-5" />
                                                {isEs ? "Pagar con Tarjeta" : "Pay with Card"}{" "}
                                                <span className="font-normal opacity-80">
                                                    {currencySymbol} {grandTotal.toFixed(2)}
                                                </span>
                                            </>
                                        )}
                                    </Button>

                                    {/* Seguridad */}
                                    <div className="flex flex-col items-center gap-1.5 text-center">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <ShieldCheck className="h-4 w-4 text-brand-teal" />
                                            {isEs
                                                ? "Pago 100% seguro procesado por Culqi"
                                                : "100% secure payment processed by Culqi"}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Visa · Mastercard · Amex · Diners · Yape
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Button
                                variant="ghost"
                                onClick={() => setStep("details")}
                                className="gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {isEs ? "Volver a datos" : "Back to details"}
                            </Button>
                        </div>
                    )}
                </div>

                {/* ─── Columna derecha: resumen ─────────────────────────────── */}
                <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
                    <Card className="border-2 border-primary/20 shadow-lg">
                        <CardHeader className="bg-muted/40 pb-4">
                            <CardTitle>{isEs ? "Resumen de Compra" : "Order Summary"}</CardTitle>
                        </CardHeader>
                        {tour.image && (
                            <div className="aspect-[21/9] w-full relative overflow-hidden">
                                <img src={tour.image} alt={tour.nameEs} className="object-cover w-full h-full" />
                            </div>
                        )}
                        <CardContent className="p-5 space-y-4">
                            <h3 className="font-bold text-lg leading-tight">
                                {isEs ? tour.nameEs : tour.nameEn}
                            </h3>

                            {/* Selector de moneda */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {isEs ? "Moneda de pago" : "Payment currency"}
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["USD", "PEN"] as Currency[]).map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setCurrency(c)}
                                            disabled={step === "payment"}
                                            className={`flex items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                                currency === c
                                                    ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                                                    : "border-border hover:border-brand-orange/50 text-muted-foreground"
                                            }`}
                                        >
                                            <DollarSign className="h-3.5 w-3.5" />
                                            {c === "USD" ? "USD ($)" : "PEN (S/)"}
                                        </button>
                                    ))}
                                </div>
                                {currency === "PEN" && (
                                    <p className="text-xs text-muted-foreground text-center">
                                        {isEs
                                            ? `Tipo de cambio: 1 USD = S/ ${exchangeRate}`
                                            : `Exchange rate: 1 USD = S/ ${exchangeRate}`}
                                    </p>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        {adults}× {isEs ? "Adultos" : "Adults"}
                                    </span>
                                    <span>
                                        {currencySymbol} {totalAdults.toFixed(2)}
                                    </span>
                                </div>
                                {children > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            {children}× {isEs ? "Niños" : "Children"}
                                        </span>
                                        <span>
                                            {currencySymbol} {totalChildren.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Total</span>
                                <span className="text-primary text-2xl">
                                    {currencySymbol} {grandTotal.toFixed(2)}
                                </span>
                            </div>

                            {referenceCode && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{isEs ? "Código" : "Code"}</span>
                                    <span className="font-mono font-semibold">{referenceCode}</span>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="bg-muted/40 p-5 flex-col gap-3">
                            {step === "details" && (
                                <Button
                                    type="submit"
                                    form="checkout-form"
                                    size="lg"
                                    className="w-full text-base h-14 bg-brand-orange hover:bg-brand-orange/90"
                                    disabled={createReservation.isPending}
                                >
                                    {createReservation.isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            {isEs ? "Procesando..." : "Processing..."}
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-5 h-5 mr-2" />
                                            {isEs ? "Continuar al Pago" : "Continue to Payment"}
                                        </>
                                    )}
                                </Button>
                            )}

                            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                <ShieldCheck className="w-4 h-4 text-brand-teal" />
                                <span>{isEs ? "Pago seguro · Cifrado SSL" : "Secure payment · SSL encrypted"}</span>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    );
}
