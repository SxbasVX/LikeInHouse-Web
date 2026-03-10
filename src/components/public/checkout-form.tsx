"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CreditCard, ShieldCheck, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
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
import {
    PayPalScriptProvider,
    PayPalButtons,
    PayPalCardFieldsProvider,
    PayPalCardFieldsForm,
    usePayPalCardFields,
    usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { Link } from "@/i18n/routing";
import { DownloadPDFButton } from "@/components/pdf/download-button";

const checkoutSchema = z.object({
    firstName: z.string().min(2, "Nombre requerido"),
    lastName: z.string().min(2, "Apellido requerido"),
    email: z.string().email("Correo invalido"),
    phone: z.string().min(6, "Telefono requerido"),
    country: z.string().min(2, "Pais requerido"),
    adults: z.number().min(1, "Debe haber al menos 1 adulto"),
    children: z.number().min(0),
    departureId: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface TourData {
    id: string;
    nameEs: string;
    nameEn: string;
    slug: string;
    pricing: {
        basePriceUsdAdult: number;
        basePriceUsdChild: number;
    } | null;
    departures: {
        id: string;
        departureDate: string;
        maxCapacity: number;
        bookedCount: number;
    }[];
    image: string;
}

type CheckoutStep = "details" | "payment" | "success";

export function CheckoutForm({ tour, locale }: { tour: TourData; locale: string }) {
    const isEs = locale === "es";
    const { toast } = useToast();

    const [step, setStep] = useState<CheckoutStep>("details");
    const [selectedDeparture, setSelectedDeparture] = useState<string>("");
    const [reservationId, setReservationId] = useState<string | null>(null);
    const [referenceCode, setReferenceCode] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<"paypal" | "card" | null>(null);

    const currency = "USD" as const;
    const currencySymbol = "$";

    const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: { adults: 1, children: 0 },
    });

    const adults = watch("adults") || 1;
    const children = watch("children") || 0;

    const adultPrice = tour.pricing?.basePriceUsdAdult || 0;
    const childPrice = tour.pricing?.basePriceUsdChild || 0;
    const totalAdults = adultPrice * adults;
    const totalChildren = childPrice * children;
    const grandTotal = totalAdults + totalChildren;

    // tRPC Mutations
    const createReservation = trpc.reservation.createGuestReservation.useMutation({
        onSuccess: (data: any) => {
            setReservationId(data.id);
            setReferenceCode(data.referenceCode);
            setStep("payment");
            toast({
                title: isEs ? "Datos confirmados" : "Details confirmed",
                description: isEs ? "Ahora completa el pago seguro." : "Now complete the secure payment.",
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || (isEs ? "Error al crear la reserva" : "Failed to create reservation"),
            });
        },
    });

    const createPaypalOrder = trpc.paypal.createOrder.useMutation();
    const capturePaypalOrder = trpc.paypal.captureOrder.useMutation();

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
            currency: currency,
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

    // Shared createOrder function for both PayPal buttons and card fields
    async function handleCreateOrder(): Promise<string> {
        if (!reservationId) throw new Error("No reservation ID");
        const order = await createPaypalOrder.mutateAsync({ reservationId });
        return order.id;
    }

    // Shared onApprove function for both PayPal buttons and card fields
    async function handleOnApprove(data: { orderID: string }) {
        try {
            const res = await capturePaypalOrder.mutateAsync({
                orderId: data.orderID,
                reservationId: reservationId!,
            });
            if (res.success) {
                if (res.referenceCode) {
                    setReferenceCode(res.referenceCode);
                }
                setStep("success");
            } else {
                toast({
                    variant: "destructive",
                    title: isEs ? "Pago no completado" : "Payment not completed",
                    description: isEs
                        ? "El pago no se completo. Intenta de nuevo."
                        : "Payment was not completed. Please try again.",
                });
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err?.message || (isEs ? "Error al procesar el pago" : "Payment processing error"),
            });
        }
    }

    // Success state
    if (step === "success") {
        return (
            <div className="max-w-lg mx-auto text-center space-y-6 py-12">
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-brand-teal/15 flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-brand-teal" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold">
                    {isEs ? "Pago Exitoso" : "Payment Successful"}
                </h2>
                <p className="text-muted-foreground">
                    {isEs
                        ? "Tu reserva ha sido confirmada. Recibiras un correo con los detalles."
                        : "Your booking has been confirmed. You will receive an email with the details."}
                </p>
                <Card>
                    <CardContent className="p-6 space-y-3">
                        <div className="flex justify-between items-center text-left">
                            <span className="text-muted-foreground">{isEs ? "Codigo de reserva" : "Booking code"}</span>
                            <span className="font-mono font-bold text-lg">{referenceCode}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center text-left">
                            <span className="text-muted-foreground">Tour</span>
                            <span className="font-medium">{isEs ? tour.nameEs : tour.nameEn}</span>
                        </div>
                        <div className="flex justify-between items-center text-left">
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
                            currency: "USD",
                            dateStr: selectedDeparture
                                ? format(new Date(tour.departures.find(d => d.id === selectedDeparture)?.departureDate || new Date()), "dd MMM yyyy", { locale: isEs ? es : undefined })
                                : "",
                            adults: adults,
                            children: children,
                            isEs,
                            type: "RESERVATION"
                        }}
                    />
                    <Button asChild className="w-full sm:w-auto h-12">
                        <a
                            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51984123456"}?text=${encodeURIComponent(
                                `Hola, acabo de reservar el tour ${tour.nameEs}. Mi codigo es ${referenceCode}.`
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
                            {isEs ? "Ver mas tours" : "Browse more tours"}
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Step Indicator (M5) */}
            <div className="lg:col-span-12 flex items-center justify-center gap-2 mb-2">
                {[
                    { key: "details", label: isEs ? "1. Datos" : "1. Details" },
                    { key: "payment", label: isEs ? "2. Pago" : "2. Payment" },
                    { key: "success", label: isEs ? "3. Confirmación" : "3. Confirmation" },
                ].map((s, i) => (
                    <div key={s.key} className="flex items-center gap-2">
                        {i > 0 && <div className={`h-px w-8 ${["payment", "success"].indexOf(step) >= i ? "bg-primary" : "bg-border"}`} />}
                        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${step === s.key ? "bg-primary text-primary-foreground" : ["payment", "success"].indexOf(step) > ["details", "payment", "success"].indexOf(s.key) ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {s.label}
                        </div>
                    </div>
                ))}
            </div>
            {/* LEFT: Form / Payment */}
            <div className="lg:col-span-8 space-y-6">
                {step === "details" && (
                    <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Card className="border-t-4 border-t-primary">
                            <CardHeader>
                                <CardTitle>{isEs ? "Tus Datos" : "Your Details"}</CardTitle>
                                <CardDescription>
                                    {isEs ? "Ingresa tu informacion para confirmar la reserva." : "Enter your info to confirm the booking."}
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
                                        <Label htmlFor="email">{isEs ? "Correo Electronico" : "Email"}</Label>
                                        <Input id="email" type="email" placeholder="viajero@email.com" {...register("email")} />
                                        {errors.email && <span className="text-sm text-destructive">{errors.email.message}</span>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">{isEs ? "Telefono / WhatsApp" : "Phone"}</Label>
                                        <Input id="phone" type="tel" placeholder="+51 999 888 777" {...register("phone")} />
                                        {errors.phone && <span className="text-sm text-destructive">{errors.phone.message}</span>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="country">{isEs ? "Pais de Residencia" : "Country"}</Label>
                                    <Input id="country" placeholder="Peru, USA, Espana..." {...register("country")} />
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
                                                const dateObj = new Date(dep.departureDate);
                                                const isSelected = selectedDeparture === dep.id;

                                                return (
                                                    <button
                                                        key={dep.id}
                                                        type="button"
                                                        onClick={() => setSelectedDeparture(dep.id)}
                                                        className={`flex flex-col text-left p-3 rounded-md border transition-all ${isSelected
                                                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                                                            : "hover:border-primary/50"
                                                            }`}
                                                    >
                                                        <span className="font-semibold text-sm">
                                                            {format(dateObj, "dd MMM yyyy", { locale: isEs ? es : undefined })}
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
                                        <Label>{isEs ? "Ninos" : "Children"}</Label>
                                        <Input type="number" min="0" {...register("children", { valueAsNumber: true })} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                )}

                {step === "payment" && (
                    <div className="space-y-6">
                        <Card className="border-t-4 border-t-primary">
                            <CardHeader>
                                <CardTitle>{isEs ? "Metodo de Pago" : "Payment Method"}</CardTitle>
                                <CardDescription>
                                    {isEs
                                        ? `Reserva ${referenceCode} - Selecciona como deseas pagar`
                                        : `Booking ${referenceCode} - Select how you'd like to pay`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Payment method selector */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("paypal")}
                                        className={`flex flex-col items-center justify-center p-5 rounded-lg border-2 transition-all ${paymentMethod === "paypal"
                                            ? "border-brand-teal bg-brand-teal/10"
                                            : "border-border hover:border-brand-teal/50"
                                            }`}
                                    >
                                        <span className={`text-lg font-bold ${paymentMethod === "paypal" ? "text-brand-darkTeal" : ""}`}>
                                            PayPal
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-1 text-center">
                                            {isEs ? "Cuenta PayPal" : "PayPal Account"}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("card")}
                                        className={`flex flex-col items-center justify-center p-5 rounded-lg border-2 transition-all ${paymentMethod === "card"
                                            ? "border-brand-orange bg-brand-orange/10"
                                            : "border-border hover:border-brand-orange/50"
                                            }`}
                                    >
                                        <CreditCard className={`h-6 w-6 mb-1 ${paymentMethod === "card" ? "text-brand-orange" : ""}`} />
                                        <span className={`text-lg font-bold ${paymentMethod === "card" ? "text-brand-orange" : ""}`}>
                                            {isEs ? "Tarjeta" : "Card"}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-1 text-center">
                                            Visa, Mastercard, Amex
                                        </span>
                                    </button>
                                </div>

                                {/* PayPal Buttons */}
                                {paymentMethod === "paypal" && reservationId && (
                                    <PayPalScriptProvider
                                        options={{
                                            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "missing-paypal-client-id",
                                            currency: "USD",
                                            intent: "capture",
                                            components: "buttons,card-fields",
                                        }}
                                    >
                                        <PayPalButtonsWrapper
                                            reservationId={reservationId}
                                            isEs={isEs}
                                            onCreateOrder={handleCreateOrder}
                                            onApprove={handleOnApprove}
                                            toast={toast}
                                        />
                                    </PayPalScriptProvider>
                                )}

                                {/* Card Fields (Advanced Checkout) */}
                                {paymentMethod === "card" && reservationId && (
                                    <PayPalScriptProvider
                                        options={{
                                            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "missing-paypal-client-id",
                                            currency: "USD",
                                            intent: "capture",
                                            components: "buttons,card-fields",
                                        }}
                                    >
                                        <CardFieldsWrapper
                                            reservationId={reservationId}
                                            isEs={isEs}
                                            onCreateOrder={handleCreateOrder}
                                            onApprove={handleOnApprove}
                                            toast={toast}
                                        />
                                    </PayPalScriptProvider>
                                )}

                                {!paymentMethod && (
                                    <p className="text-center text-sm text-muted-foreground">
                                        {isEs
                                            ? "Selecciona un metodo de pago para continuar"
                                            : "Select a payment method to continue"}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Button
                            variant="ghost"
                            onClick={() => { setStep("details"); setPaymentMethod(null); }}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {isEs ? "Volver a datos" : "Back to details"}
                        </Button>
                    </div>
                )}
            </div>

            {/* RIGHT: Order Summary */}
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

                        <div className="rounded-md bg-brand-teal/10 px-3 py-2 text-center">
                            <span className="text-xs text-brand-darkTeal font-medium">
                                {isEs
                                    ? "Pagos procesados en USD via PayPal"
                                    : "Payments processed in USD via PayPal"}
                            </span>
                        </div>

                        <Separator />

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{adults}x {isEs ? "Adultos" : "Adults"}</span>
                                <span>{currencySymbol} {totalAdults.toFixed(2)}</span>
                            </div>
                            {children > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{children}x {isEs ? "Ninos" : "Children"}</span>
                                    <span>{currencySymbol} {totalChildren.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total</span>
                            <span className="text-primary text-2xl">{currencySymbol} {grandTotal.toFixed(2)}</span>
                        </div>

                        {referenceCode && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{isEs ? "Codigo" : "Code"}</span>
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
                                        {isEs ? "Confirmar y Pagar" : "Confirm & Pay"}
                                    </>
                                )}
                            </Button>
                        )}

                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <ShieldCheck className="w-4 h-4 text-brand-teal" />
                            <span>{isEs ? "Pago seguro via PayPal" : "Secure payment via PayPal"}</span>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

// ========================================
// PayPal Buttons Wrapper (PayPal wallet)
// ========================================
function PayPalButtonsWrapper({
    reservationId,
    isEs,
    onCreateOrder,
    onApprove,
    toast,
}: {
    reservationId: string;
    isEs: boolean;
    onCreateOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    toast: any;
}) {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();

    if (isPending) {
        return (
            <div className="p-6 bg-muted/30 rounded-lg flex flex-col items-center justify-center min-h-[120px] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
                <p className="text-sm text-muted-foreground">
                    {isEs ? "Cargando PayPal..." : "Loading PayPal..."}
                </p>
            </div>
        );
    }

    if (isRejected) {
        return (
            <div className="p-6 bg-brand-orange/10 rounded-lg text-center min-h-[120px] flex flex-col items-center justify-center gap-2">
                <p className="text-sm text-brand-orange font-medium">
                    {isEs
                        ? "No se pudo cargar PayPal. Verifica tu conexion e intenta de nuevo."
                        : "Could not load PayPal. Check your connection and try again."}
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { if (typeof window !== "undefined") window.location.reload(); }}
                    className="mt-2"
                >
                    {isEs ? "Recargar pagina" : "Reload page"}
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 bg-muted/30 rounded-lg min-h-[120px]">
            <PayPalButtons
                style={{ layout: "vertical", shape: "pill", color: "gold", label: "pay" }}
                createOrder={onCreateOrder}
                onApprove={async (data) => {
                    await onApprove({ orderID: data.orderID });
                }}
                onError={(err: any) => {
                    console.error("[PayPal] Button error:", err);
                    toast({
                        variant: "destructive",
                        title: "PayPal Error",
                        description: isEs
                            ? "Ocurrio un error con PayPal. Intenta de nuevo."
                            : "A PayPal error occurred. Please try again.",
                    });
                }}
                onCancel={() => {
                    toast({
                        title: isEs ? "Pago cancelado" : "Payment cancelled",
                        description: isEs
                            ? "Puedes intentar de nuevo cuando quieras."
                            : "You can try again whenever you want.",
                    });
                }}
            />
        </div>
    );
}

// ========================================
// Card Fields Wrapper (Advanced Checkout)
// ========================================
function CardFieldsWrapper({
    reservationId,
    isEs,
    onCreateOrder,
    onApprove,
    toast,
}: {
    reservationId: string;
    isEs: boolean;
    onCreateOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    toast: any;
}) {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();

    if (isPending) {
        return (
            <div className="p-6 bg-muted/30 rounded-lg flex flex-col items-center justify-center min-h-[120px] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
                <p className="text-sm text-muted-foreground">
                    {isEs ? "Cargando formulario de pago..." : "Loading payment form..."}
                </p>
            </div>
        );
    }

    if (isRejected) {
        return (
            <div className="p-6 bg-brand-orange/10 rounded-lg text-center min-h-[120px] flex flex-col items-center justify-center gap-2">
                <p className="text-sm text-brand-orange font-medium">
                    {isEs
                        ? "No se pudo cargar el formulario de pago."
                        : "Could not load payment form."}
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { if (typeof window !== "undefined") window.location.reload(); }}
                    className="mt-2"
                >
                    {isEs ? "Recargar pagina" : "Reload page"}
                </Button>
            </div>
        );
    }

    return (
        <PayPalCardFieldsProvider
            createOrder={onCreateOrder}
            onApprove={async (data) => {
                await onApprove({ orderID: data.orderID });
            }}
            onError={(err) => {
                console.error("[PayPal Card] Error:", err);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: isEs
                        ? "Error al procesar la tarjeta. Intenta de nuevo."
                        : "Card processing error. Please try again.",
                });
            }}
            style={{
                "input": {
                    "font-size": "16px",
                    "font-family": "system-ui, -apple-system, sans-serif",
                    "color": "#333",
                    "padding": "12px",
                },
                ".invalid": {
                    "color": "#dc2626",
                },
            }}
        >
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <PayPalCardFieldsForm />
                <SubmitCardPayment isEs={isEs} />
            </div>
        </PayPalCardFieldsProvider>
    );
}

// Submit button for card fields - must be inside PayPalCardFieldsProvider
function SubmitCardPayment({ isEs }: { isEs: boolean }) {
    const { cardFieldsForm } = usePayPalCardFields();
    const [paying, setPaying] = useState(false);

    const handleClick = async () => {
        if (!cardFieldsForm) return;

        setPaying(true);
        try {
            await cardFieldsForm.submit();
        } catch (err) {
            console.error("[PayPal Card] Submit error:", err);
        } finally {
            setPaying(false);
        }
    };

    return (
        <Button
            onClick={handleClick}
            disabled={paying}
            className="w-full h-12 text-base bg-brand-teal hover:bg-brand-darkTeal"
        >
            {paying ? (
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {isEs ? "Procesando..." : "Processing..."}
                </>
            ) : (
                <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    {isEs ? "Pagar con Tarjeta" : "Pay with Card"}
                </>
            )}
        </Button>
    );
}
