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

  const saveDraftMutation = trpc.tour.saveDraft.useMutation();

  const updateMutation = trpc.tour.update.useMutation({
    onSuccess: () => {
      toast({ title: "Tour actualizado exitosamente" });
      router.push("/admin/tours");
    },
    onError: (error) => {
      let description: any = error.message;

      try {
        const parsed = JSON.parse(error.message);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          description = (
            <div className="mt-2 max-h-[290px] overflow-y-auto pr-2">
              <p className="text-sm font-semibold mb-2">Corrige los siguientes errores:</p>
              <ul className="list-disc pl-4 space-y-2">
                {parsed.map((e: any, i: number) => {
                  const fieldPath = e.path ? e.path.join(" > ") : "";
                  const msg = e.message.includes("NaN") ? "Falta completar un número válido" : e.message;
                  return (
                    <li key={i} className="text-xs">
                      {fieldPath && <span className="font-semibold block opacity-70 mb-0.5">{fieldPath}</span>}
                      {msg}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }
      } catch (e) {
        // Ignorar si no es JSON
      }

      toast({
        title: "No se pudo actualizar el tour",
        description,
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
    tourType: tour.tourType,
    category: tour.category,
    difficulty: tour.difficulty,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    durationHours: tour.durationHours ?? null,
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
        tiers: (tour.pricing as any).tiers?.map((tier: any) => ({
          labelEs: tier.labelEs,
          labelEn: tier.labelEn,
          ageMin: tier.ageMin,
          ageMax: tier.ageMax,
          priceUsd: Number(tier.priceUsd),
          isDefault: tier.isDefault,
        })) || [
          { labelEs: "Adulto", labelEn: "Adult", priceUsd: Number(tour.pricing.basePriceUsdAdult), isDefault: true },
          ...(Number(tour.pricing.basePriceUsdChild) > 0 ? [{ labelEs: "Niño", labelEn: "Child", priceUsd: Number(tour.pricing.basePriceUsdChild), isDefault: false }] : []),
        ],
        groupDiscountPercent: tour.pricing.groupDiscountPercent
          ? Number(tour.pricing.groupDiscountPercent)
          : undefined,
        groupMinPersons: tour.pricing.groupMinPersons || undefined,
      }
      : {
        tiers: [
          { labelEs: "Adulto", labelEn: "Adult", priceUsd: 0, isDefault: true },
        ],
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
        onAutoSave={(data) => saveDraftMutation.mutate({ id, ...data })}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
