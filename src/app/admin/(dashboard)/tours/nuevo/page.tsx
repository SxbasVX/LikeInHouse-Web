"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { TourForm } from "@/components/admin/tour-form";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/admin/page-header";
import { TrpcErrorDescription } from "@/components/admin/trpc-error-description";

export default function NuevoTourPage() {
  const router = useRouter();
  const { toast } = useToast();

  const createMutation = trpc.tour.create.useMutation({
    onSuccess: () => {
      toast({ title: "Tour creado exitosamente" });
      router.push("/admin/tours");
    },
    onError: (error) => {
      toast({
        title: "No se pudo crear el tour",
        description: <TrpcErrorDescription error={error} />,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo Tour"
        subtitle="Completa la información para crear un nuevo tour"
      />
      <TourForm
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
