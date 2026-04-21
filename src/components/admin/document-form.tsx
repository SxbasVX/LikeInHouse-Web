"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { documentCreateSchema, type DocumentCreateInput } from "@/lib/validators/document";
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
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, ExternalLink } from "lucide-react";
import Link from "next/link";

interface DocumentFormProps {
  documentId?: string;
  initialData?: DocumentCreateInput & { id: string };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function DocumentForm({ documentId, initialData }: DocumentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const isEditing = !!documentId;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DocumentCreateInput>({
    resolver: zodResolver(documentCreateSchema) as any,
    defaultValues: initialData ?? {
      slug: "",
      titleEs: "",
      titleEn: "",
      type: "PDF",
      pdfUrl: null,
      contentEs: null,
      contentEn: null,
      isPublished: true,
      sortOrder: 0,
    },
  });

  const type = watch("type");
  const titleEs = watch("titleEs");
  const slug = watch("slug");

  // Auto-generar slug desde titleEs si no está editando
  useEffect(() => {
    if (!isEditing && titleEs) {
      setValue("slug", slugify(titleEs));
    }
  }, [titleEs, isEditing, setValue]);

  const createMut = trpc.docs.create.useMutation({
    onSuccess: () => {
      toast({ title: "Documento creado" });
      utils.docs.list.invalidate();
      router.push("/admin/documentos");
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateMut = trpc.docs.update.useMutation({
    onSuccess: () => {
      toast({ title: "Documento actualizado" });
      utils.docs.list.invalidate();
      router.push("/admin/documentos");
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  function onSubmit(data: any) {
    if (isEditing && documentId) {
      updateMut.mutate({ ...data, id: documentId });
    } else {
      createMut.mutate(data);
    }
  }

  const isPending = createMut.isPending || updateMut.isPending || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/documentos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{isEditing ? "Editar Documento" : "Nuevo Documento"}</h2>
            <p className="font-serif italic text-brand-teal text-sm">
              {isEditing ? "Modifica los datos del documento" : "Agrega un PDF o página de contenido"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && slug && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/docs/${slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Ver página
              </a>
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">

          {/* Títulos */}
          <Card>
            <CardHeader><CardTitle>Títulos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Título en Español *</Label>
                <Input {...register("titleEs")} placeholder="Ej: Términos y Condiciones" />
                {errors.titleEs && <p className="text-sm text-destructive">{errors.titleEs.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Título en Inglés *</Label>
                <Input {...register("titleEn")} placeholder="Ej: Terms and Conditions" />
                {errors.titleEn && <p className="text-sm text-destructive">{errors.titleEn.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Contenido */}
          <Card>
            <CardHeader>
              <CardTitle>
                {type === "PDF" ? "URL del PDF" : "Contenido de la página"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {type === "PDF" ? (
                <div className="space-y-1.5">
                  <Label>Archivo PDF *</Label>
                  <FileUpload
                    value={watch("pdfUrl") || ""}
                    onChange={(url) => setValue("pdfUrl", url, { shouldValidate: true })}
                    onRemove={() => setValue("pdfUrl", null, { shouldValidate: true })}
                    disabled={isPending}
                    accept={["pdf"]}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sube el PDF directamente a Cloudinary. Se guardará con tipo <code>raw</code> automáticamente.
                  </p>
                  {errors.pdfUrl && <p className="text-sm text-destructive">{errors.pdfUrl.message}</p>}
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>Contenido en Español</Label>
                    <Textarea
                      {...register("contentEs")}
                      placeholder="Escribe el contenido en español. Puedes usar HTML básico."
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Acepta HTML básico: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;a&gt;</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contenido en Inglés</Label>
                    <Textarea
                      {...register("contentEn")}
                      placeholder="Write the content in English."
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">

          {/* Config */}
          <Card>
            <CardHeader><CardTitle>Configuración</CardTitle></CardHeader>
            <CardContent className="space-y-4">

              {/* Tipo */}
              <div className="space-y-1.5">
                <Label>Tipo de documento</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setValue("type", v as "PDF" | "CONTENT")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF (visor embebido)</SelectItem>
                    <SelectItem value="CONTENT">Contenido (texto/HTML)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <Label>Slug (URL) *</Label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">/docs/</span>
                  <Input
                    {...register("slug")}
                    placeholder="terminos-y-condiciones"
                    className="font-mono text-sm"
                  />
                </div>
                {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              </div>

              {/* Orden */}
              <div className="space-y-1.5">
                <Label>Orden</Label>
                <Input
                  type="number"
                  {...register("sortOrder", { valueAsNumber: true })}
                  min={0}
                />
              </div>

              {/* Publicado */}
              <div className="flex items-center justify-between">
                <Label>Publicado</Label>
                <Switch
                  checked={watch("isPublished")}
                  onCheckedChange={(v) => setValue("isPublished", v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tip */}
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="font-medium mb-2">Cómo enlazarlo</p>
            <p className="text-muted-foreground text-xs mb-2">
              Usa esta URL como link en Certificaciones o en el Footer:
            </p>
            <code className="block bg-background rounded px-2 py-1.5 text-xs break-all">
              /docs/{slug || "mi-slug"}
            </code>
          </div>
        </div>
      </div>
    </form>
  );
}
