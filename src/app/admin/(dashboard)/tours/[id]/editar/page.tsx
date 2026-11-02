"use client";

import { useRouter, useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { TourForm } from "@/components/admin/tour-form";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/admin/list-states";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/admin/page-header";
import { TrpcErrorDescription } from "@/components/admin/trpc-error-description";

export default function EditarTourPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: tour, isLoading, error, refetch, isRefetching } = trpc.tour.getById.useQuery({ id });

  const saveDraftMutation = trpc.tour.saveDraft.useMutation();

  const updateMutation = trpc.tour.update.useMutation({
    onSuccess: () => {
      toast({ title: "Tour actualizado exitosamente" });
      router.push("/admin/tours");
    },
    onError: (error) => {
      toast({
        title: "No se pudo actualizar el tour",
        description: <TrpcErrorDescription error={error} />,
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

  if (error && error.data?.code !== "NOT_FOUND") {
    return (
      <div className="space-y-6">
        <PageHeader title="Editar Tour" />
        <ErrorState title="No se pudo cargar el tour" error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tour no encontrado" />
        <EmptyState title="Tour no encontrado" description="El tour que buscas no existe o fue eliminado." />
      </div>
    );
  }

  // Transform tour data to form format
  const initialData = {
    nameEs: tour.nameEs,
    nameEn: tour.nameEn,
    slug: tour.slug,
    tourType: tour.tourType,
    bookingMode: tour.bookingMode,
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
    conditions: ((tour as any).conditions || []).map((c: any) => ({
      type: c.type as "HEALTH" | "AGE" | "BEHAVIOR" | "GROUP_SIZE" | "PHYSICAL" | "GENERAL",
      textEs: c.textEs,
      textEn: c.textEn,
      isActive: c.isActive,
    })),
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
      <PageHeader title="Editar Tour" subtitle={tour.nameEs} />
      <TourForm
        initialData={initialData}
        onSubmit={(data) => updateMutation.mutate({ id, ...data })}
        onAutoSave={(data) => saveDraftMutation.mutate({ id, ...data })}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
