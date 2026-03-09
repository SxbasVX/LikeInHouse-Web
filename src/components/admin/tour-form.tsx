"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useEffect, useCallback, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { tourCreateSchema } from "@/lib/validators/tour";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronDown, Eye, Save, Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import type { TourCreateInput } from "@/lib/validators/tour";

interface TourFormProps {
  initialData?: Partial<TourFormData>;
  onSubmit: (data: TourCreateInput) => void;
  onAutoSave?: (data: Partial<TourFormData>) => void;
  isLoading?: boolean;
}

interface TourFormData {
  nameEs: string;
  nameEn: string;
  slug: string;
  tourType: "BOOKABLE" | "INFORMATIONAL";
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

export function TourForm({ initialData, onSubmit, onAutoSave, isLoading }: TourFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<TourFormData>({
    resolver: zodResolver(tourCreateSchema) as any,
    defaultValues: {
      nameEs: "",
      nameEn: "",
      slug: "",
      tourType: "BOOKABLE",
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
      itinerary: [],
      pricing: {
        basePricePenAdult: 0,
        basePriceUsdAdult: 0,
        basePricePenChild: 0,
        basePriceUsdChild: 0,
      },
      includes: [],
      excludes: [],
      images: [],
      departures: [],
      ...initialData,
    },
  });

  const [activeTab, setActiveTab] = useState("general");

  const itinerary = useFieldArray({ control, name: "itinerary" });
  const includes = useFieldArray({ control, name: "includes" });
  const excludes = useFieldArray({ control, name: "excludes" });
  const images = useFieldArray({ control, name: "images" });
  const departures = useFieldArray({ control, name: "departures" });

  const nameEs = watch("nameEs");
  const tourType = watch("tourType");
  const isBookable = tourType === "BOOKABLE";

  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>("");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Auto-slug
  const handleAutoSlug = () => {
    if (nameEs) setValue("slug", slugify(nameEs));
  };

  // Auto-save cada 30s cuando hay cambios
  const watchAll = watch();
  useEffect(() => {
    if (!onAutoSave || !isDirty || !initialData?.slug) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      onAutoSave(getValues());
      setAutoSaveStatus("Borrador guardado");
      setTimeout(() => setAutoSaveStatus(""), 3000);
    }, 30000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [JSON.stringify(watchAll)]);

  const onFormSubmit = (data: any) => {
    const submitData: any = { ...data };
    if (data.tourType === "INFORMATIONAL") {
      delete submitData.pricing;
      submitData.departures = [];
    }
    onSubmit(submitData as TourCreateInput);
  };

  const onFormError = (formErrors: any) => {
    // Determine which tab contains the first error to switch to it
    const errKeys = Object.keys(formErrors);
    let targetTab = "general";

    if (errKeys.includes("images")) targetTab = "multimedia";
    else if (errKeys.includes("pricing") || errKeys.includes("departures")) targetTab = "precios";
    else if (errKeys.includes("itinerary") || errKeys.includes("includes") || errKeys.includes("excludes") || errKeys.includes("metaTitleEs") || errKeys.includes("metaTitleEn") || errKeys.includes("metaDescEs") || errKeys.includes("metaDescEn")) targetTab = "avanzado";

    setActiveTab(targetTab);

    toast({
      title: "Revisa el formulario",
      description: "Hemos encontrado errores o falta de información importante en rojo. Te hemos llevado a la pestaña con los errores.",
      variant: "destructive",
      duration: 5000,
    });
  };

  const handleManualSave = () => {
    if (onAutoSave && initialData?.slug) {
      onAutoSave(getValues());
      toast({ title: "Borrador guardado" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit as any, onFormError)} className="space-y-6 max-w-5xl pb-24">
      {/* Barra superior con estado - STICKY para facil acceso */}
      <div className="sticky top-0 z-40 flex items-center justify-between rounded-lg border bg-background/95 backdrop-blur shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Badge variant={isBookable ? "default" : "secondary"}>
            {isBookable ? "Comprable" : "Informativo"}
          </Badge>
          {autoSaveStatus && (
            <span className="text-xs text-muted-foreground">{autoSaveStatus}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          {initialData?.slug && onAutoSave && (
            <Button type="button" variant="outline" size="sm" onClick={handleManualSave}>
              <Save className="mr-2 h-4 w-4" /> Borrador
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : initialData ? (
              "Actualizar Tour"
            ) : (
              "Crear Tour"
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="general" className={Object.keys(errors).some(k => ["nameEs", "nameEn", "slug", "tourType", "category", "difficulty", "durationDays", "durationNights", "destination", "shortDescEs", "shortDescEn", "longDescEs", "longDescEn"].includes(k)) ? "text-red-500" : ""}>Información General</TabsTrigger>
          <TabsTrigger value="multimedia" className={errors.images ? "text-red-500" : ""}>Imágenes</TabsTrigger>
          <TabsTrigger value="precios" disabled={!isBookable} className={(errors.pricing || errors.departures) ? "text-red-500" : ""}>Precios y Fechas</TabsTrigger>
          <TabsTrigger value="avanzado" className={Object.keys(errors).some(k => ["itinerary", "includes", "excludes", "metaTitleEs", "metaTitleEn", "metaDescEs", "metaDescEn"].includes(k)) ? "text-red-500" : ""}>Itinerario y Otros</TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* TSTA 1: GENERAL */}
        {/* ========================================================= */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Tour */}
                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div>
                    <Label className="text-base font-medium">Tipo de Tour</Label>
                    <div className="text-sm text-muted-foreground mt-1 text-balance">
                      Si está marcado como <b>Comprable</b>, los usuarios verán botones de reserva y precios.
                      Si es <b>Informativo</b>, actuará como un artículo en el catálogo de destinos sin carrito.
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Info</span>
                    <Switch
                      checked={isBookable}
                      onCheckedChange={(checked) =>
                        setValue("tourType", checked ? "BOOKABLE" : "INFORMATIONAL")
                      }
                    />
                    <span className="text-sm font-medium">Comprable</span>
                  </div>
                </div>

                {/* Destacado */}
                <div className="flex items-center justify-between rounded-lg border p-4 bg-yellow-500/10 border-yellow-500/20">
                  <div>
                    <Label className="text-base font-medium text-yellow-700 dark:text-yellow-600 flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      Tour Destacado
                    </Label>
                    <div className="text-sm text-yellow-700/80 dark:text-yellow-600/80 mt-1 text-balance">
                      Marca esta opción si quieres que este tour resalte en la página principal (Home).
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground mr-1">Normal</span>
                    <Switch
                      checked={watch("isFeatured")}
                      onCheckedChange={(checked) => setValue("isFeatured", checked)}
                    />
                    <span className="text-sm font-medium">Destacado</span>
                  </div>
                </div>
              </div>

              {/* Nombre e ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={errors.nameEs ? "text-destructive" : ""}>Nombre (Español) *</Label>
                  <Input
                    {...register("nameEs")}
                    onBlur={handleAutoSlug}
                    placeholder="Ej. Cusco Mágico 4D/3N"
                    className={errors.nameEs ? "border-destructive" : ""}
                  />
                  {errors.nameEs && <p className="text-[11px] font-medium text-destructive mt-1">{errors.nameEs.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className={errors.nameEn ? "text-destructive" : ""}>Nombre (Inglés) *</Label>
                  <Input {...register("nameEn")} placeholder="Ej. Magical Cusco 4D/3N" className={errors.nameEn ? "border-destructive" : ""} />
                  {errors.nameEn && <p className="text-[11px] font-medium text-destructive mt-1">{errors.nameEn.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={errors.slug ? "text-destructive" : ""}>Slug (Ruta Web) *</Label>
                  <div className="flex gap-2">
                    <Input {...register("slug")} placeholder="cusco-magico-4d-3n" className={errors.slug ? "border-destructive" : ""} />
                    <Button type="button" variant="outline" size="sm" onClick={handleAutoSlug}>
                      Auto
                    </Button>
                  </div>
                  {errors.slug ? (
                    <div className="text-[11px] font-medium text-destructive">{errors.slug.message}</div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground">Identificador único para la URL (sin espacios).</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={errors.destination ? "text-destructive" : ""}>Destino Relacionado *</Label>
                  <Input {...register("destination")} placeholder="Ej. Cusco, Lima..." className={errors.destination ? "border-destructive" : ""} />
                  {errors.destination && <p className="text-[11px] font-medium text-destructive">{errors.destination.message}</p>}
                </div>
              </div>

              {/* Categoría y Duración */}
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className={errors.category ? "text-destructive" : ""}>Categoría *</Label>
                  <Input {...register("category")} placeholder="Ej. Aventura, Cultural" className={errors.category ? "border-destructive" : ""} />
                  {errors.category && <p className="text-[11px] font-medium text-destructive">{errors.category.message}</p>}
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
                      <SelectItem value="EASY">Fácil</SelectItem>
                      <SelectItem value="MODERATE">Moderada</SelectItem>
                      <SelectItem value="CHALLENGING">Desafiante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={errors.durationDays ? "text-destructive" : ""}>Días *</Label>
                  <Input type="number" min={1} {...register("durationDays", { valueAsNumber: true })} className={errors.durationDays ? "border-destructive" : ""} />
                  {errors.durationDays && <p className="text-[11px] font-medium text-destructive">{errors.durationDays.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className={errors.durationNights ? "text-destructive" : ""}>Noches</Label>
                  <Input type="number" min={0} {...register("durationNights", { valueAsNumber: true })} className={errors.durationNights ? "border-destructive" : ""} />
                  {errors.durationNights && <p className="text-[11px] font-medium text-destructive">{errors.durationNights.message}</p>}
                </div>
              </div>

              {/* Descripciones Cortas */}
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={errors.shortDescEs ? "text-destructive" : ""}>Descripción Corta (ES) *</Label>
                  <Textarea rows={3} {...register("shortDescEs")} placeholder="Máx 160 caracteres. Se muestra en el vistazo general del tour." className={errors.shortDescEs ? "border-destructive" : ""} />
                  {errors.shortDescEs && <p className="text-[11px] font-medium text-destructive">{errors.shortDescEs.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className={errors.shortDescEn ? "text-destructive" : ""}>Descripción Corta (EN) *</Label>
                  <Textarea rows={3} {...register("shortDescEn")} className={errors.shortDescEn ? "border-destructive" : ""} />
                  {errors.shortDescEn && <p className="text-[11px] font-medium text-destructive">{errors.shortDescEn.message}</p>}
                </div>
              </div>

              {/* Descripciones Largas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={errors.longDescEs ? "text-destructive" : ""}>Descripción Completa (ES) *</Label>
                  <Textarea rows={6} {...register("longDescEs")} placeholder="Detalles atractivos sobre lo que tratará la experiencia para convencer al cliente..." className={errors.longDescEs ? "border-destructive" : ""} />
                  {errors.longDescEs && <p className="text-[11px] font-medium text-destructive">{errors.longDescEs.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className={errors.longDescEn ? "text-destructive" : ""}>Descripción Completa (EN) *</Label>
                  <Textarea rows={6} {...register("longDescEn")} className={errors.longDescEn ? "border-destructive" : ""} />
                  {errors.longDescEn && <p className="text-[11px] font-medium text-destructive">{errors.longDescEn.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================= */}
        {/* TSTA 2: MULTIMEDIA */}
        {/* ========================================================= */}
        <TabsContent value="multimedia">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Galería de Imágenes</CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  Agrega fotografías que muestren lo mejor del tour. La primera en la lista será la portada del tour.
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  images.append({ cloudinaryId: "", url: "", altEs: "", altEn: "", isPrimary: images.fields.length === 0 })
                }
                disabled={images.fields.length >= 10}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar ({images.fields.length}/10)
              </Button>
            </CardHeader>
            <CardContent>
              {images.fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-muted-foreground bg-muted/10">
                  <div className="mb-4">Aún no hay imágenes. Este tour se verá incompleto frente a los usuarios.</div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => images.append({ cloudinaryId: "", url: "", altEs: "", altEn: "", isPrimary: true })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Subir primera imagen
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.fields.map((field, index) => (
                    <div key={field.id} className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 space-y-3 relative group">
                      <ImageUpload
                        value={watch(`images.${index}.url`)}
                        onChange={(url, publicId) => {
                          setValue(`images.${index}.url`, url);
                          setValue(`images.${index}.cloudinaryId`, publicId);
                        }}
                        onRemove={() => {
                          setValue(`images.${index}.url`, "");
                          setValue(`images.${index}.cloudinaryId`, "");
                        }}
                      />
                      <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary" {...register(`images.${index}.isPrimary`)} />
                          Imagen Principal
                        </label>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => images.remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================= */}
        {/* TSTA 3: PRECIOS */}
        {/* ========================================================= */}
        <TabsContent value="precios">
          {isBookable ? (
            <Card>
              <CardHeader>
                <CardTitle>Tarifas y Disponibilidad</CardTitle>
                <div className="text-sm text-muted-foreground">Configura los precios de venta y las fechas en las que los clientes podrán reservar este paquete.</div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label className={`font-semibold text-primary ${errors.pricing?.basePriceUsdAdult ? "text-destructive" : ""}`}>Adulto USD ($) *</Label>
                    <Input type="number" step="0.01" min={0} {...register("pricing.basePriceUsdAdult", { valueAsNumber: true })} className={`text-lg ${errors.pricing?.basePriceUsdAdult ? "border-destructive" : ""}`} />
                    {errors.pricing?.basePriceUsdAdult && <p className="text-[11px] font-medium text-destructive">{errors.pricing.basePriceUsdAdult.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Niño USD ($)</Label>
                    <Input type="number" step="0.01" min={0} {...register("pricing.basePriceUsdChild", { valueAsNumber: true })} />
                  </div>
                </div>

                {/* Descuento Grupal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Descuento Grupal Automático (%)</Label>
                    <Input type="number" step="0.01" min={0} max={100} {...register("pricing.groupDiscountPercent", { valueAsNumber: true })} placeholder="Ej: 10" />
                    <div className="text-xs text-muted-foreground mt-1">Si el grupo tiene suficientes personas, se aplica este %.</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mín. Personas para Descuento</Label>
                    <Input type="number" min={1} {...register("pricing.groupMinPersons", { valueAsNumber: true })} placeholder="Ej: 4" />
                  </div>
                </div>

                <Separator />

                {/* Fechas de Salida */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label className="text-base font-semibold">Fechas Programadas</Label>
                      <div className="text-sm text-muted-foreground">Establece en qué fechas hay espacios disponibles para ventas directas online.</div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => departures.append({ departureDate: "", maxCapacity: 16 })}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Agregar Fecha
                    </Button>
                  </div>
                  {departures.fields.length === 0 ? (
                    <div className="rounded border border-dashed p-6 text-center text-muted-foreground bg-muted/10">
                      Sin fechas programadas al momento. Útil si las ventas son variables o privadas.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {departures.fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-3 p-3 border rounded-lg bg-card">
                          <div className="flex-1 space-y-1">
                            <Label className={`text-xs font-semibold ${errors.departures?.[index]?.departureDate ? "text-destructive" : ""}`}>Día de Salida</Label>
                            <Input type="date" {...register(`departures.${index}.departureDate`)} className={errors.departures?.[index]?.departureDate ? "border-destructive" : ""} />
                          </div>
                          <div className="w-32 space-y-1">
                            <Label className={`text-xs font-semibold ${errors.departures?.[index]?.maxCapacity ? "text-destructive" : ""}`}>Lugares Topes</Label>
                            <Input type="number" min={1} {...register(`departures.${index}.maxCapacity`, { valueAsNumber: true })} className={errors.departures?.[index]?.maxCapacity ? "border-destructive" : ""} />
                          </div>
                          <Button type="button" variant="outline" size="icon" onClick={() => departures.remove(index)} className="hover:bg-destructive hover:text-white transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card">
              Este tour está marcado como "Informativo" así que no lleva precios de venta ni fechas.
              <br />Ve a la pestaña <b>Información General</b> para cambiarlo si lo requieres.
            </div>
          )}
        </TabsContent>

        {/* ========================================================= */}
        {/* TSTA 4: ITINERARIO Y OTROS */}
        {/* ========================================================= */}
        <TabsContent value="avanzado" className="space-y-6">
          {/* Itinerario */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Itinerario Detallado</CardTitle>
                <div className="text-sm text-muted-foreground">El paso a paso de lo que los viajeros disfrutarán, día por día.</div>
              </div>
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
                <Plus className="mr-2 h-4 w-4" /> Agregar Día
              </Button>
            </CardHeader>
            <CardContent>
              {itinerary.fields.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/10">
                  Aún no has agregado detalles del itinerario. ¡Anímate a guiar a los posibles compradores!
                </div>
              ) : (
                <div className="space-y-4">
                  {itinerary.fields.map((field, index) => (
                    <div key={field.id} className="rounded-xl border p-4 space-y-4 bg-card shadow-sm relative group">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-md font-bold tracking-tight text-primary">DÍA {index + 1}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-50 group-hover:opacity-100 transition-opacity" onClick={() => itinerary.remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <input type="hidden" {...register(`itinerary.${index}.dayNumber`)} value={index + 1} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input placeholder="Título (ES) ej. Llegada Mágica..." {...register(`itinerary.${index}.titleEs`)} className={`font-medium ${errors.itinerary?.[index]?.titleEs ? "border-destructive" : ""}`} />
                        <Input placeholder="Título (EN) ej. Magical Arrival..." {...register(`itinerary.${index}.titleEn`)} className={`font-medium ${errors.itinerary?.[index]?.titleEn ? "border-destructive" : ""}`} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Textarea rows={3} placeholder="Describe las actividades en español..." {...register(`itinerary.${index}.descriptionEs`)} className={errors.itinerary?.[index]?.descriptionEs ? "border-destructive" : ""} />
                        <Textarea rows={3} placeholder="Describe las actividades en inglés..." {...register(`itinerary.${index}.descriptionEn`)} className={errors.itinerary?.[index]?.descriptionEn ? "border-destructive" : ""} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incluye / No Incluye */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 border-b mb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-700 flex flex-col gap-1">
                    <span>✅ Lo que Incluye</span>
                  </CardTitle>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => includes.append({ textEs: "", textEn: "" })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {includes.fields.length === 0 && <div className="text-sm text-muted-foreground">Nada listado.</div>}
                  {includes.fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 p-2 border rounded-lg bg-green-50/50">
                      <div className="flex-1 space-y-2">
                        <Input placeholder="ES: Almuerzo bufet" {...register(`includes.${index}.textEs`)} className={`h-8 ${errors.includes?.[index]?.textEs ? "border-destructive" : ""}`} />
                        <Input placeholder="EN: Buffet lunch" {...register(`includes.${index}.textEn`)} className={`h-8 ${errors.includes?.[index]?.textEn ? "border-destructive" : ""}`} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="self-center hover:text-red-600 h-8 w-8" onClick={() => includes.remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b mb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-red-700 flex flex-col gap-1">
                    <span>❌ Lo que No Incluye</span>
                  </CardTitle>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => excludes.append({ textEs: "", textEn: "" })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {excludes.fields.length === 0 && <div className="text-sm text-muted-foreground">Nada listado.</div>}
                  {excludes.fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 p-2 border rounded-lg bg-red-50/50">
                      <div className="flex-1 space-y-2">
                        <Input placeholder="ES: Vuelos internacionales" {...register(`excludes.${index}.textEs`)} className={`h-8 ${errors.excludes?.[index]?.textEs ? "border-destructive" : ""}`} />
                        <Input placeholder="EN: International flights" {...register(`excludes.${index}.textEn`)} className={`h-8 ${errors.excludes?.[index]?.textEn ? "border-destructive" : ""}`} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="self-center hover:text-red-600 h-8 w-8" onClick={() => excludes.remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración SEO (Adicional)</CardTitle>
              <div className="text-sm text-muted-foreground">Mejora el posicionamiento del tour en los buscadores (Google).</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Meta Título (ES)</Label>
                  <Input {...register("metaTitleEs")} placeholder="Reserva Cusco Mágico 2024 - Mejor Precio" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Meta Título (EN)</Label>
                  <Input {...register("metaTitleEn")} placeholder="Book Magical Cusco - Best Price" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Meta Descripción (ES)</Label>
                  <Textarea rows={2} {...register("metaDescEs")} placeholder="Conoce las maravillas de..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Meta Descripción (EN)</Label>
                  <Textarea rows={2} {...register("metaDescEn")} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa del Tour</DialogTitle>
          </DialogHeader>
          <TourPreview data={getValues()} />
        </DialogContent>
      </Dialog>
    </form>
  );
}

function TourPreview({ data }: { data: TourFormData }) {
  const primaryImage = data.images.find((img) => img.isPrimary) || data.images[0];

  return (
    <div className="space-y-4">
      {primaryImage?.url && (
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
          <img src={primaryImage.url} alt={data.nameEs} className="object-cover w-full h-full" />
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={data.tourType === "BOOKABLE" ? "default" : "secondary"}>
            {data.tourType === "BOOKABLE" ? "Comprable" : "Informativo"}
          </Badge>
          <Badge variant="outline">{data.category || "Sin categoria"}</Badge>
          <Badge variant="outline">{data.destination || "Sin destino"}</Badge>
        </div>
        <h2 className="text-xl font-bold">{data.nameEs || "Sin nombre"}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {data.durationDays} dias / {data.durationNights} noches
        </p>
      </div>
      <p className="text-sm">{data.shortDescEs || "Sin descripcion corta"}</p>
      {data.tourType === "BOOKABLE" && data.pricing?.basePriceUsdAdult > 0 && (
        <div className="rounded-lg bg-primary/10 p-3">
          <span className="text-sm text-muted-foreground">Desde </span>
          <span className="text-xl font-bold text-primary">$ {data.pricing.basePriceUsdAdult}</span>
          <span className="text-sm text-muted-foreground"> / persona</span>
        </div>
      )}
      {data.longDescEs && (
        <div>
          <h3 className="font-semibold mb-1">Descripcion</h3>
          <p className="text-sm whitespace-pre-wrap">{data.longDescEs}</p>
        </div>
      )}
      {data.itinerary.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Itinerario</h3>
          {data.itinerary.map((day, i) => (
            <div key={i} className="mb-2 rounded border p-2">
              <p className="text-sm font-medium">Dia {i + 1}: {day.titleEs}</p>
              <p className="text-xs text-muted-foreground">{day.descriptionEs}</p>
            </div>
          ))}
        </div>
      )}
      {data.images.length > 1 && (
        <div>
          <h3 className="font-semibold mb-2">Galeria ({data.images.length} imagenes)</h3>
          <div className="grid grid-cols-4 gap-2">
            {data.images.filter(img => img.url).map((img, i) => (
              <img key={i} src={img.url} alt="" className="rounded aspect-square object-cover" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
