"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import type { TourCreateInput } from "@/lib/validators/tour";

interface TourFormProps {
  initialData?: Partial<TourFormData>;
  onSubmit: (data: TourCreateInput) => void;
  isLoading?: boolean;
}

// Internal form data type (maps to TourCreateInput on submit)
interface TourFormData {
  nameEs: string;
  nameEn: string;
  slug: string;
  category: string;
  difficulty: "EASY" | "MODERATE" | "CHALLENGING";
  durationDays: number;
  durationNights: number;
  destination: string;
  shortDescEs: string;
  shortDescEn: string;
  longDescEs: string;
  longDescEn: string;
  metaTitleEs: string;
  metaDescEs: string;
  metaTitleEn: string;
  metaDescEn: string;
  isFeatured: boolean;
  itinerary: {
    dayNumber: number;
    titleEs: string;
    titleEn: string;
    descriptionEs: string;
    descriptionEn: string;
  }[];
  pricing: {
    basePricePenAdult: number;
    basePriceUsdAdult: number;
    basePricePenChild: number;
    basePriceUsdChild: number;
    groupDiscountPercent?: number;
    groupMinPersons?: number;
  };
  includes: { textEs: string; textEn: string }[];
  excludes: { textEs: string; textEn: string }[];
  images: {
    cloudinaryId: string;
    url: string;
    altEs?: string;
    altEn?: string;
    isPrimary: boolean;
  }[];
  departures: { departureDate: string; maxCapacity: number }[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function TourForm({ initialData, onSubmit, isLoading }: TourFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TourFormData>({
    defaultValues: {
      nameEs: "",
      nameEn: "",
      slug: "",
      category: "",
      difficulty: "EASY",
      durationDays: 1,
      durationNights: 0,
      destination: "",
      shortDescEs: "",
      shortDescEn: "",
      longDescEs: "",
      longDescEn: "",
      metaTitleEs: "",
      metaDescEs: "",
      metaTitleEn: "",
      metaDescEn: "",
      isFeatured: false,
      itinerary: [{ dayNumber: 1, titleEs: "", titleEn: "", descriptionEs: "", descriptionEn: "" }],
      pricing: {
        basePricePenAdult: 0,
        basePriceUsdAdult: 0,
        basePricePenChild: 0,
        basePriceUsdChild: 0,
      },
      includes: [{ textEs: "", textEn: "" }],
      excludes: [{ textEs: "", textEn: "" }],
      images: [],
      departures: [],
      ...initialData,
    },
  });

  const itinerary = useFieldArray({ control, name: "itinerary" });
  const includes = useFieldArray({ control, name: "includes" });
  const excludes = useFieldArray({ control, name: "excludes" });
  const images = useFieldArray({ control, name: "images" });
  const departures = useFieldArray({ control, name: "departures" });

  const nameEs = watch("nameEs");

  const handleAutoSlug = () => {
    if (nameEs) {
      setValue("slug", slugify(nameEs));
    }
  };

  const onFormSubmit = (data: TourFormData) => {
    onSubmit(data as TourCreateInput);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="desc">Descripcion</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerario</TabsTrigger>
          <TabsTrigger value="pricing">Precios</TabsTrigger>
          <TabsTrigger value="includes">Incluye</TabsTrigger>
          <TabsTrigger value="images">Imagenes</TabsTrigger>
          <TabsTrigger value="departures">Salidas</TabsTrigger>
        </TabsList>

        {/* Tab: Info Basica */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Informacion Basica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre (ES) *</Label>
                  <Input
                    {...register("nameEs", { required: "Requerido" })}
                    onBlur={handleAutoSlug}
                    placeholder="Cusco Magico 4D/3N"
                  />
                  {errors.nameEs && <p className="text-xs text-destructive">{errors.nameEs.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Nombre (EN) *</Label>
                  <Input {...register("nameEn", { required: "Required" })} placeholder="Magical Cusco 4D/3N" />
                  {errors.nameEn && <p className="text-xs text-destructive">{errors.nameEn.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Slug *</Label>
                <div className="flex gap-2">
                  <Input {...register("slug", { required: "Requerido" })} placeholder="cusco-magico-4d-3n" />
                  <Button type="button" variant="outline" onClick={handleAutoSlug}>
                    Auto
                  </Button>
                </div>
                {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Input {...register("category", { required: "Requerido" })} placeholder="Cultural" />
                </div>
                <div className="space-y-2">
                  <Label>Dificultad</Label>
                  <Select
                    defaultValue={initialData?.difficulty || "EASY"}
                    onValueChange={(v) => setValue("difficulty", v as TourFormData["difficulty"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Facil</SelectItem>
                      <SelectItem value="MODERATE">Moderado</SelectItem>
                      <SelectItem value="CHALLENGING">Desafiante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Destino *</Label>
                  <Input {...register("destination", { required: "Requerido" })} placeholder="Cusco" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dias *</Label>
                  <Input type="number" min={1} {...register("durationDays", { valueAsNumber: true, required: true, min: 1 })} />
                </div>
                <div className="space-y-2">
                  <Label>Noches *</Label>
                  <Input type="number" min={0} {...register("durationNights", { valueAsNumber: true, required: true, min: 0 })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Descripcion */}
        <TabsContent value="desc">
          <Card>
            <CardHeader>
              <CardTitle>Descripciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Descripcion Corta (ES) *</Label>
                  <Textarea rows={3} {...register("shortDescEs", { required: "Requerido" })} />
                </div>
                <div className="space-y-2">
                  <Label>Descripcion Corta (EN) *</Label>
                  <Textarea rows={3} {...register("shortDescEn", { required: "Required" })} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Descripcion Larga (ES) *</Label>
                  <Textarea rows={8} {...register("longDescEs", { required: "Requerido" })} />
                </div>
                <div className="space-y-2">
                  <Label>Descripcion Larga (EN) *</Label>
                  <Textarea rows={8} {...register("longDescEn", { required: "Required" })} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta Title (ES)</Label>
                  <Input {...register("metaTitleEs")} />
                </div>
                <div className="space-y-2">
                  <Label>Meta Title (EN)</Label>
                  <Input {...register("metaTitleEn")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta Description (ES)</Label>
                  <Textarea rows={2} {...register("metaDescEs")} />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description (EN)</Label>
                  <Textarea rows={2} {...register("metaDescEn")} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Itinerario */}
        <TabsContent value="itinerary">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Itinerario</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  itinerary.append({
                    dayNumber: itinerary.fields.length + 1,
                    titleEs: "",
                    titleEn: "",
                    descriptionEs: "",
                    descriptionEn: "",
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Dia
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {itinerary.fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Dia {index + 1}</h4>
                    {itinerary.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => itinerary.remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <input type="hidden" {...register(`itinerary.${index}.dayNumber`)} value={index + 1} />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Titulo (ES)</Label>
                      <Input {...register(`itinerary.${index}.titleEs`, { required: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Titulo (EN)</Label>
                      <Input {...register(`itinerary.${index}.titleEn`, { required: true })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Descripcion (ES)</Label>
                      <Textarea rows={3} {...register(`itinerary.${index}.descriptionEs`, { required: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripcion (EN)</Label>
                      <Textarea rows={3} {...register(`itinerary.${index}.descriptionEn`, { required: true })} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Precios */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Precios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Adulto PEN (S/) *</Label>
                  <Input type="number" step="0.01" min={0} {...register("pricing.basePricePenAdult", { valueAsNumber: true, required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Adulto USD ($) *</Label>
                  <Input type="number" step="0.01" min={0} {...register("pricing.basePriceUsdAdult", { valueAsNumber: true, required: true })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nino PEN (S/) *</Label>
                  <Input type="number" step="0.01" min={0} {...register("pricing.basePricePenChild", { valueAsNumber: true, required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Nino USD ($) *</Label>
                  <Input type="number" step="0.01" min={0} {...register("pricing.basePriceUsdChild", { valueAsNumber: true, required: true })} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Descuento Grupal (%)</Label>
                  <Input type="number" step="0.01" min={0} max={100} {...register("pricing.groupDiscountPercent", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Minimo de Personas</Label>
                  <Input type="number" min={1} {...register("pricing.groupMinPersons", { valueAsNumber: true })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Incluye / Excluye */}
        <TabsContent value="includes">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-green-700">Incluye</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => includes.append({ textEs: "", textEn: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {includes.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Espanol" {...register(`includes.${index}.textEs`)} />
                      <Input placeholder="English" {...register(`includes.${index}.textEn`)} />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 mt-1"
                      onClick={() => includes.remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-red-700">No Incluye</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => excludes.append({ textEs: "", textEn: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {excludes.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Espanol" {...register(`excludes.${index}.textEs`)} />
                      <Input placeholder="English" {...register(`excludes.${index}.textEn`)} />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 mt-1"
                      onClick={() => excludes.remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Imagenes */}
        <TabsContent value="images">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Imagenes</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  images.append({ cloudinaryId: "", url: "", altEs: "", altEn: "", isPrimary: images.fields.length === 0 })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Imagen
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {images.fields.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No hay imagenes. Agrega URLs de Cloudinary manualmente.
                </p>
              )}
              {images.fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Imagen {index + 1}</Label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          {...register(`images.${index}.isPrimary`)}
                        />
                        Principal
                      </label>
                      <Button type="button" variant="ghost" size="icon" onClick={() => images.remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input {...register(`images.${index}.url`)} placeholder="https://res.cloudinary.com/..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Cloudinary ID</Label>
                      <Input {...register(`images.${index}.cloudinaryId`)} placeholder="tours/mi-imagen" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Alt Text (ES)</Label>
                      <Input {...register(`images.${index}.altEs`)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Alt Text (EN)</Label>
                      <Input {...register(`images.${index}.altEn`)} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Fechas de Salida */}
        <TabsContent value="departures">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Fechas de Salida</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => departures.append({ departureDate: "", maxCapacity: 16 })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Fecha
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {departures.fields.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No hay fechas de salida programadas
                </p>
              )}
              {departures.fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Fecha de Salida</Label>
                    <Input type="date" {...register(`departures.${index}.departureDate`, { required: true })} />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Capacidad</Label>
                    <Input type="number" min={1} {...register(`departures.${index}.maxCapacity`, { valueAsNumber: true, required: true })} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => departures.remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : initialData ? "Actualizar Tour" : "Crear Tour"}
        </Button>
      </div>
    </form>
  );
}
