import { notFound } from "next/navigation";
import { db } from "@/server/lib/db";
import { CheckoutForm } from "@/components/public/checkout-form";

interface CheckoutPageProps {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
    const { slug, locale } = await params;

    // Retrieve tour data necessary for checkout
    const tour = await db.tour.findUnique({
        where: { slug },
        include: {
            pricing: true,
            departures: {
                where: {
                    departureDate: { gte: new Date() },
                    status: "AVAILABLE",
                },
                orderBy: { departureDate: "asc" },
            },
            images: {
                where: { isPrimary: true },
                take: 1,
            },
        },
    });

    if (!tour || tour.tourType === "INFORMATIONAL" || tour.status !== "PUBLISHED") {
        notFound();
    }

    // Pass necessary initial data to the client component form
    const tourData = {
        id: tour.id,
        nameEs: tour.nameEs,
        nameEn: tour.nameEn,
        slug: tour.slug,
        pricing: tour.pricing ? {
            basePriceUsdAdult: Number(tour.pricing.basePriceUsdAdult),
            basePricePenAdult: Number(tour.pricing.basePricePenAdult),
            basePriceUsdChild: Number(tour.pricing.basePriceUsdChild),
            basePricePenChild: Number(tour.pricing.basePricePenChild),
        } : null,
        departures: tour.departures.map((d: any) => ({
            id: d.id,
            departureDate: d.departureDate.toISOString(),
            maxCapacity: d.maxCapacity,
            bookedCount: d.bookedCount,
        })),
        image: tour.images[0]?.url || "",
    };

    return (
        <div className="bg-muted/30 py-10 min-h-[70vh]">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">
                        {locale === "es" ? "Reserva Segura" : "Secure Booking"}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {locale === "es"
                            ? `Estás a un paso de confirmar tu aventura en ${tour.nameEs}`
                            : `You are one step away from confirming your adventure to ${tour.nameEn}`}
                    </p>
                </div>

                <CheckoutForm tour={tourData} locale={locale} />
            </div>
        </div>
    );
}
