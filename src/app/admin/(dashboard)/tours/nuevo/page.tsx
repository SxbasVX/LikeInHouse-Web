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
                  // Limpiar mensajes tecnicos si es posible
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
        title: "No se pudo crear el tour",
        description,
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
