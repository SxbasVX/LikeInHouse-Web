"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import {
    CheckCircle2,
    Clock,
    XCircle,
    Users,
    CalendarDays,
    ShieldCheck,
    Loader2,
    CreditCard,
    Check,
    X,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    PayPalScriptProvider,
    PayPalButtons,
    PayPalCardFieldsProvider,
    PayPalCardFieldsForm,
    usePayPalCardFields,
    usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { DownloadPDFButton } from "@/components/pdf/download-button";

interface PaymentLinkPageProps {
    token: string;
    locale: string;
}

export function PaymentLinkPage({ token, locale }: PaymentLinkPageProps) {
    const isEs = locale === "es";
    const { toast } = useToast();

    const { data: link, isLoading, error } = trpc.paymentLink.getByToken.useQuery({ token });

    const createPayment = trpc.paymentLink.createPayment.useMutation();
    const markPaid = trpc.paymentLink.markPaid.useMutation();
    const createPaypalOrder = trpc.paypal.createOrder.useMutation();
    const capturePaypalOrder = trpc.paypal.captureOrder.useMutation();

    const [step, setStep] = useState<"info" | "paying" | "success">("info");
    const [paymentMethod, setPaymentMethod] = useState<"paypal" | "card" | null>(null);
    const [reservationId, setReservationId] = useState<string | null>(null);
    const [referenceCode, setReferenceCode] = useState("");
    const [amountToPay, setAmountToPay] = useState(0);
    const [isStartingPayment, setIsStartingPayment] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="sr-only">{isEs ? "Cargando..." : "Loading..."}</span>
            </div>
        );
    }

    if (error || !link) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Card className="max-w-md w-full text-center p-8">
                    <XCircle className="h-12 w-12 text-brand-orange mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">
                        {isEs ? "Link no encontrado" : "Link not found"}
                    </h2>
                    <p className="text-muted-foreground">
                        {isEs
                            ? "Este link de pago no existe o ha sido eliminado."
                            : "This payment link does not exist or has been removed."}
                    </p>
                </Card>
            </div>
        );
    }

    // Expired
    if (link.status === "EXPIRED") {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <Card className="max-w-md w-full text-center p-8">
                    <Clock className="h-12 w-12 text-brand-orange mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">
                        {isEs ? "Link expirado" : "Link expired"}
                    </h2>
                    <p className="text-muted-foreground">
                        {isEs
                            ? "Este link de pago ha expirado. Contacta al vendedor para obtener uno nuevo."
                            : "This payment link has expired. Contact the seller for a new one."}
                    </p>
                </Card>
            </div>
        );
    }

    // Already paid
    if (link.status === "PAID") {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <Card className="max-w-md w-full text-center p-8">
                    <CheckCircle2 className="h-12 w-12 text-brand-teal mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">
                        {isEs ? "Pago completado" : "Payment completed"}
                    </h2>
                    <p className="text-muted-foreground">
                        {isEs
                            ? "Este link ya fue pagado. Gracias por tu compra."
                            : "This link has already been paid. Thank you for your purchase."}
                    </p>
                </Card>
            </div>
        );
    }

    // Cancelled
    if (link.status === "CANCELLED") {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <Card className="max-w-md w-full text-center p-8">
                    <XCircle className="h-12 w-12 text-brand-darkRed mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">
                        {isEs ? "Link cancelado" : "Link cancelled"}
                    </h2>
                    <p className="text-muted-foreground">
                        {isEs
                            ? "Este link de pago fue cancelado."
                            : "This payment link has been cancelled."}
                    </p>
                </Card>
            </div>
        );
    }

    const currencySymbol = link.currency === "USD" ? "$" : "S/";
    const pendingAmount = link.totalAmount - link.amountPaid;
    const depositPending = link.depositRequired && link.depositAmount
        ? Math.max(0, link.depositAmount - link.amountPaid)
        : 0;

    // Success
    if (step === "success") {
        return (
            <div className="bg-muted/30 py-10 min-h-[60vh]">
                <div className="max-w-lg mx-auto text-center space-y-6 px-4">
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
                            ? "Tu pago ha sido procesado correctamente."
                            : "Your payment has been processed successfully."}
                    </p>
                    <Card>
                        <CardContent className="p-6 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{isEs ? "Codigo" : "Code"}</span>
                                <span className="font-mono font-bold">{referenceCode}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{isEs ? "Servicio" : "Service"}</span>
                                <span className="font-medium">{isEs ? link.titleEs : (link.titleEn || link.titleEs)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{isEs ? "Monto pagado" : "Amount paid"}</span>
                                <span className="font-bold text-primary">{currencySymbol} {amountToPay.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
                        <DownloadPDFButton
                            isEs={isEs}
                            data={{
                                referenceCode,
                                serviceName: isEs ? link.titleEs : (link.titleEn || link.titleEs),
                                clientName: link.clientName,
                                clientEmail: link.clientEmail,
                                amountPaid: Number(amountToPay) + Number(link.amountPaid),
                                totalAmount: link.totalAmount,
                                currency: link.currency,
                                dateStr: link.departureDate ? format(new Date(link.departureDate), "dd MMM yyyy", { locale: isEs ? es : undefined }) : "",
                                adults: link.adults,
                                children: link.children,
                                isEs,
                                type: "PAYMENT_LINK"
                            }}
                        />
                        <Button asChild className="w-full sm:w-auto h-12">
                            <a
                                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51984123456"}?text=${encodeURIComponent(
                                    `Hola, acabo de pagar ${link.titleEs}. Mi codigo es ${referenceCode}.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                WhatsApp
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    async function handleStartPayment(payDeposit: boolean) {
        if (isStartingPayment) return; // Prevenir doble-click
        setIsStartingPayment(true);
        try {
            const result = await createPayment.mutateAsync({ token, payDeposit });
            setReservationId(result.reservationId);
            setReferenceCode(result.referenceCode);
            setAmountToPay(result.amount);
            setStep("paying");
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err.message || "Error al iniciar el pago",
            });
        } finally {
            setIsStartingPayment(false);
        }
    }

    async function handleCreateOrder(): Promise<string> {
        if (!reservationId) throw new Error("No reservation");
        const order = await createPaypalOrder.mutateAsync({ reservationId });
        return order.id;
    }

    async function handleOnApprove(data: { orderID: string }) {
        try {
            const res = await capturePaypalOrder.mutateAsync({
                orderId: data.orderID,
                reservationId: reservationId!,
            });
            if (res.success) {
                if (res.referenceCode) setReferenceCode(res.referenceCode);
                // Mark payment link as paid
                await markPaid.mutateAsync({ token, amountPaid: amountToPay });
                setStep("success");
            } else {
                toast({
                    variant: "destructive",
                    title: isEs ? "Pago no completado" : "Payment not completed",
                });
            }
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: err?.message || "Error al procesar el pago",
            });
        }
    }

    return (
        <PayPalScriptProvider
            options={{
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                currency: "USD",
                intent: "capture",
                components: "buttons,card-fields",
            }}
        >
            <div className="bg-muted/30 py-10 min-h-[60vh]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold">
                            {isEs ? "Link de Pago" : "Payment Link"}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {isEs ? `Hola ${link.clientName}` : `Hi ${link.clientName}`}
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* LEFT: Service details */}
                        <div className="lg:col-span-7 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{isEs ? link.titleEs : (link.titleEn || link.titleEs)}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Description */}
                                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                                        {isEs ? link.descriptionEs : (link.descriptionEn || link.descriptionEs)}
                                    </div>

                                    {/* Dates and passengers */}
                                    <div className="flex flex-wrap gap-4 text-sm">
                                        {link.departureDate && (
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-primary" />
                                                <span>
                                                    {format(new Date(link.departureDate), "dd MMM yyyy", { locale: isEs ? es : undefined })}
                                                    {link.returnDate && ` - ${format(new Date(link.returnDate), "dd MMM yyyy", { locale: isEs ? es : undefined })}`}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary" />
                                            <span>
                                                {link.adults} {isEs ? "adultos" : "adults"}
                                                {link.children > 0 && `, ${link.children} ${isEs ? "ninos" : "children"}`}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Includes / Excludes */}
                                    {(link.includesEs.length > 0 || link.excludesEs.length > 0) && (
                                        <>
                                            <Separator />
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                {link.includesEs.length > 0 && (
                                                    <div>
                                                        <h4 className="font-semibold text-sm mb-2">
                                                            {isEs ? "Incluye" : "Includes"}
                                                        </h4>
                                                        <ul className="space-y-1">
                                                            {(isEs ? link.includesEs : link.includesEn).map((item, i) => (
                                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                                    <Check className="h-4 w-4 text-brand-teal mt-0.5 shrink-0" />
                                                                    {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {link.excludesEs.length > 0 && (
                                                    <div>
                                                        <h4 className="font-semibold text-sm mb-2">
                                                            {isEs ? "No incluye" : "Excludes"}
                                                        </h4>
                                                        <ul className="space-y-1">
                                                            {(isEs ? link.excludesEs : link.excludesEn).map((item, i) => (
                                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                                    <X className="h-4 w-4 text-brand-orange mt-0.5 shrink-0" />
                                                                    {item}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Terms */}
                                    {link.termsEs && (
                                        <>
                                            <Separator />
                                            <div className="text-xs text-muted-foreground whitespace-pre-line">
                                                {isEs ? link.termsEs : (link.termsEn || link.termsEs)}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Payment section (step "paying") */}
                            {step === "paying" && reservationId && (
                                <Card className="border-t-4 border-t-primary">
                                    <CardHeader>
                                        <CardTitle>
                                            {isEs ? "Completa tu Pago" : "Complete your Payment"}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">
                                            {isEs ? "Monto a pagar:" : "Amount to pay:"}{" "}
                                            <span className="font-bold text-foreground">{currencySymbol} {amountToPay.toFixed(2)}</span>
                                        </p>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod("paypal")}
                                                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${paymentMethod === "paypal"
                                                    ? "border-brand-teal bg-brand-teal/10"
                                                    : "border-border hover:border-brand-teal/50"
                                                    }`}
                                            >
                                                <span className={`text-lg font-bold ${paymentMethod === "paypal" ? "text-brand-darkTeal" : ""}`}>
                                                    PayPal
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod("card")}
                                                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${paymentMethod === "card"
                                                    ? "border-brand-orange bg-brand-orange/10"
                                                    : "border-border hover:border-brand-orange/50"
                                                    }`}
                                            >
                                                <CreditCard className={`h-5 w-5 mb-1 ${paymentMethod === "card" ? "text-brand-orange" : ""}`} />
                                                <span className={`text-lg font-bold ${paymentMethod === "card" ? "text-brand-orange" : ""}`}>
                                                    {isEs ? "Tarjeta" : "Card"}
                                                </span>
                                            </button>
                                        </div>

                                        {paymentMethod === "paypal" && (
                                            <LinkPayPalButtons
                                                isEs={isEs}
                                                onCreateOrder={handleCreateOrder}
                                                onApprove={handleOnApprove}
                                                toast={toast}
                                            />
                                        )}

                                        {paymentMethod === "card" && (
                                            <LinkCardFields
                                                isEs={isEs}
                                                onCreateOrder={handleCreateOrder}
                                                onApprove={handleOnApprove}
                                                toast={toast}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* RIGHT: Summary & Pay button */}
                        <div className="lg:col-span-5 space-y-4">
                            <Card className="border-2 border-primary/20 shadow-lg sticky top-24">
                                <CardHeader className="bg-muted/40 pb-4">
                                    <CardTitle>{isEs ? "Resumen" : "Summary"}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{isEs ? "Total del servicio" : "Service total"}</span>
                                        <span className="font-bold">{currencySymbol} {link.totalAmount.toFixed(2)}</span>
                                    </div>

                                    {link.amountPaid > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{isEs ? "Ya pagado" : "Already paid"}</span>
                                            <span className="text-brand-teal font-medium">- {currencySymbol} {link.amountPaid.toFixed(2)}</span>
                                        </div>
                                    )}

                                    {link.depositRequired && link.depositAmount && link.amountPaid === 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{isEs ? "Deposito requerido" : "Deposit required"}</span>
                                            <span>{currencySymbol} {link.depositAmount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <Separator />

                                    <div className="flex justify-between text-lg font-bold">
                                        <span>{isEs ? "Pendiente" : "Pending"}</span>
                                        <span className="text-primary">{currencySymbol} {pendingAmount.toFixed(2)}</span>
                                    </div>

                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {isEs ? "Expira:" : "Expires:"}{" "}
                                        {format(new Date(link.expiresAt), "dd MMM yyyy", { locale: isEs ? es : undefined })}
                                    </div>

                                    {step === "info" && (
                                        <div className="space-y-3 pt-2">
                                            {/* Pay deposit only */}
                                            {link.depositRequired && depositPending > 0 && (
                                                <Button
                                                    className="w-full h-12 text-base"
                                                    onClick={() => handleStartPayment(true)}
                                                    disabled={isStartingPayment || createPayment.isPending}
                                                >
                                                    {createPayment.isPending ? (
                                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                    ) : (
                                                        <CreditCard className="h-5 w-5 mr-2" />
                                                    )}
                                                    {isEs ? `Pagar Deposito (${currencySymbol} ${depositPending.toFixed(2)})` : `Pay Deposit (${currencySymbol} ${depositPending.toFixed(2)})`}
                                                </Button>
                                            )}

                                            {/* Pay full */}
                                            <Button
                                                className="w-full h-12 text-base bg-brand-orange hover:bg-brand-orange/90"
                                                onClick={() => handleStartPayment(false)}
                                                disabled={isStartingPayment || createPayment.isPending}
                                                variant={link.depositRequired && depositPending > 0 ? "outline" : "default"}
                                            >
                                                {createPayment.isPending ? (
                                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                ) : (
                                                    <CreditCard className="h-5 w-5 mr-2" />
                                                )}
                                                {isEs ? `Pagar Total (${currencySymbol} ${pendingAmount.toFixed(2)})` : `Pay Full (${currencySymbol} ${pendingAmount.toFixed(2)})`}
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                        <ShieldCheck className="w-4 h-4 text-brand-teal" />
                                        <span>{isEs ? "Pago seguro via PayPal" : "Secure payment via PayPal"}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </PayPalScriptProvider>
    );
}

// PayPal Buttons for payment link
function LinkPayPalButtons({
    isEs,
    onCreateOrder,
    onApprove,
    toast,
}: {
    isEs: boolean;
    onCreateOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    toast: any;
}) {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();

    if (isPending) {
        return (
            <div className="p-6 bg-muted/30 rounded-lg flex items-center justify-center min-h-[100px]">
                <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
            </div>
        );
    }

    if (isRejected) {
        return (
            <div className="p-4 bg-brand-orange/10 rounded-lg text-center text-sm text-brand-orange">
                {isEs ? "Error cargando PayPal" : "Error loading PayPal"}
            </div>
        );
    }

    return (
        <div className="p-3 bg-muted/30 rounded-lg">
            <PayPalButtons
                style={{ layout: "vertical", shape: "pill", color: "gold", label: "pay" }}
                createOrder={onCreateOrder}
                onApprove={async (data) => {
                    await onApprove({ orderID: data.orderID });
                }}
                onError={(err: any) => {
                    console.error("[PayPal Link] Error:", err);
                    toast({ variant: "destructive", title: "PayPal Error" });
                }}
                onCancel={() => {
                    toast({ title: isEs ? "Pago cancelado" : "Payment cancelled" });
                }}
            />
        </div>
    );
}

// Card Fields for payment link
function LinkCardFields({
    isEs,
    onCreateOrder,
    onApprove,
    toast,
}: {
    isEs: boolean;
    onCreateOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    toast: any;
}) {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();

    if (isPending) {
        return (
            <div className="p-6 bg-muted/30 rounded-lg flex items-center justify-center min-h-[100px]">
                <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
            </div>
        );
    }

    if (isRejected) {
        return (
            <div className="p-4 bg-brand-orange/10 rounded-lg text-center text-sm text-brand-orange">
                {isEs ? "Error cargando formulario" : "Error loading form"}
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
                console.error("[PayPal Card Link] Error:", err);
                toast({ variant: "destructive", title: "Error" });
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
            <div className="space-y-4 p-3 bg-muted/30 rounded-lg">
                <PayPalCardFieldsForm />
                <LinkCardSubmit isEs={isEs} />
            </div>
        </PayPalCardFieldsProvider>
    );
}

function LinkCardSubmit({ isEs }: { isEs: boolean }) {
    const { cardFieldsForm } = usePayPalCardFields();
    const [paying, setPaying] = useState(false);

    const handleClick = async () => {
        if (!cardFieldsForm) return;
        setPaying(true);
        try {
            await cardFieldsForm.submit();
        } catch (err) {
            console.error("[PayPal Card Link] Submit error:", err);
        } finally {
            setPaying(false);
        }
    };

    return (
        <Button onClick={handleClick} disabled={paying} className="w-full h-12 bg-brand-teal hover:bg-brand-darkTeal">
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
