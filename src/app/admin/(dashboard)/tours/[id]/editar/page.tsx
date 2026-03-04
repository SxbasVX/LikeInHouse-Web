"use client";

import { useRouter, useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { TourForm } from "@/components/admin/tour-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function EditarTourPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: tour, isLoading } = trpc.tour.getById.useQuery({ id });

  const updateMutation = trpc.tour.update.useMutation({
    onSuccess: () => {
      toast({ title: "Tour actualizado exitosamente" });
      router.push("/admin/tours");
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar tour",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold">Tour no encontrado</h2>
        <p className="text-muted-foreground mt-2">
          El tour que buscas no existe o fue eliminado.
        </p>
      </div>
    );
  }

  // Transform tour data to form format
  const initialData = {
    nameEs: tour.nameEs,
    nameEn: tour.nameEn,
    slug: tour.slug,
    category: tour.category,
    difficulty: tour.difficulty,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    destination: tour.destination,
    shortDescEs: tour.shortDescEs,
    shortDescEn: tour.shortDescEn,
    longDescEs: tour.longDescEs,
    longDescEn: tour.longDescEn,
    metaTitleEs: tour.metaTitleEs || "",
    metaDescEs: tour.metaDescEs || "",
    metaTitleEn: tour.metaTitleEn || "",
    metaDescEn: tour.metaDescEn || "",
    isFeatured: tour.isFeatured,
    itinerary: tour.itinerary.map((day) => ({
      dayNumber: day.dayNumber,
      titleEs: day.titleEs,
      titleEn: day.titleEn,
      descriptionEs: day.descriptionEs,
      descriptionEn: day.descriptionEn,
    })),
    pricing: tour.pricing
      ? {
          basePricePenAdult: Number(tour.pricing.basePricePenAdult),
          basePriceUsdAdult: Number(tour.pricing.basePriceUsdAdult),
          basePricePenChild: Number(tour.pricing.basePricePenChild),
          basePriceUsdChild: Number(tour.pricing.basePriceUsdChild),
          groupDiscountPercent: tour.pricing.groupDiscountPercent
            ? Number(tour.pricing.groupDiscountPercent)
            : undefined,
          groupMinPersons: tour.pricing.groupMinPersons || undefined,
        }
      : {
          basePricePenAdult: 0,
          basePriceUsdAdult: 0,
          basePricePenChild: 0,
          basePriceUsdChild: 0,
        },
    includes: tour.includes
      .filter((inc) => inc.type === "INCLUDE")
      .map((inc) => ({ textEs: inc.textEs, textEn: inc.textEn })),
    excludes: tour.includes
      .filter((inc) => inc.type === "EXCLUDE")
      .map((inc) => ({ textEs: inc.textEs, textEn: inc.textEn })),
    images: tour.images.map((img) => ({
      cloudinaryId: img.cloudinaryId,
      url: img.url,
      altEs: img.altEs || "",
      altEn: img.altEn || "",
      isPrimary: img.isPrimary,
    })),
    departures: tour.departures.map((dep) => ({
      departureDate: new Date(dep.departureDate).toISOString().split("T")[0],
      maxCapacity: dep.maxCapacity,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Editar Tour</h2>
        <p className="text-muted-foreground">{tour.nameEs}</p>
      </div>
      <TourForm
        initialData={initialData}
        onSubmit={(data) => updateMutation.mutate({ id, ...data })}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
