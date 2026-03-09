import { PaymentLinkPage } from "@/components/public/payment-link-page";

interface Props {
    params: Promise<{
        locale: string;
        token: string;
    }>;
}

export default async function PagarPage({ params }: Props) {
    const { locale, token } = await params;
    return <PaymentLinkPage token={token} locale={locale} />;
}
