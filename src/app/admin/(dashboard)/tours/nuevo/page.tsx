"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { TourForm } from "@/components/admin/tour-form";
import { useToast } from "@/hooks/use-toast";

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
        title: "Error al crear tour",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Nuevo Tour</h2>
        <p className="text-muted-foreground">
          Completa la informacion para crear un nuevo tour
        </p>
      </div>
      <TourForm
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
