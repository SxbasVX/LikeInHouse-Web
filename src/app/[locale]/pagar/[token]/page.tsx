import type { Metadata } from "next";
import { PaymentLinkPage } from "@/components/public/payment-link-page";

interface Props {
    params: Promise<{
        locale: string;
        token: string;
    }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    return {
        title: locale === "es" ? "Procesar Pago" : "Process Payment",
        robots: { index: false, follow: false },
    };
}

export default async function PagarPage({ params }: Props) {
    const { locale, token } = await params;
    return <PaymentLinkPage token={token} locale={locale} />;
}
