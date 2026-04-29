import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/server/lib/db";
import { CheckoutForm } from "@/components/public/checkout-form";

interface CheckoutPageProps {
    params: Promise<{ locale: string; slug: string }>;
    searchParams: Promise<{ date?: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
    const { slug, locale } = await params;
    const tour = await db.tour.findUnique({
        where: { slug },
        select: { nameEs: true, nameEn: true },
    });

    const name = tour ? (locale === "es" ? tour.nameEs : tour.nameEn) : "";
    const title = locale === "es" ? `Reservar ${name}` : `Book ${name}`;

    return {
        title,
        robots: { index: false, follow: false },
    };
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
    const { slug, locale } = await params;
    const { date: initialDate } = await searchParams;

    // Retrieve tour data necessary for checkout
    const tour = await db.tour.findUnique({
        where: { slug },
        include: {
            pricing: {
                include: { tiers: { orderBy: { sortOrder: "asc" } } },
            },
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
            includes: { orderBy: { sortOrder: "asc" } },
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
        shortDescEs: tour.shortDescEs,
        shortDescEn: tour.shortDescEn,
        destination: tour.destination,
        durationDays: tour.durationDays,
        durationNights: tour.durationNights,
        durationHours: tour.durationHours,
        slug: tour.slug,
        bookingMode: tour.bookingMode as "CALENDAR" | "DEPARTURES" | "BOTH",
        pricing: tour.pricing ? {
            basePriceUsdAdult: Number(tour.pricing.basePriceUsdAdult),
            basePriceUsdChild: Number(tour.pricing.basePriceUsdChild),
            tiers: (tour.pricing as any).tiers?.map((t: any) => ({
                id: t.id,
                labelEs: t.labelEs,
                labelEn: t.labelEn,
                ageMin: t.ageMin,
                ageMax: t.ageMax,
                priceUsd: Number(t.priceUsd),
                isDefault: t.isDefault,
            })) || [],
        } : null,
        departures: tour.departures.map((d: any) => ({
            id: d.id,
            departureDate: d.departureDate.toISOString(),
            maxCapacity: d.maxCapacity,
            bookedCount: d.bookedCount,
        })),
        image: tour.images[0]?.url || "",
        includes: tour.includes
            .filter((i) => i.type === "INCLUDE")
            .map((i) => ({ textEs: i.textEs, textEn: i.textEn })),
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

                <CheckoutForm tour={tourData} locale={locale} initialDate={initialDate} />
            </div>
        </div>
    );
}
