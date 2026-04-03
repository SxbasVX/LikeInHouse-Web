"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Upload, FolderOpen } from "lucide-react";

export default function GaleriaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-darkRed">Galería</h1>
          <p className="font-serif italic text-brand-teal">
            Gestiona las imágenes del sitio (Cloudinary)
          </p>
        </div>
        <Button disabled>
          <Upload className="mr-2 h-4 w-4" /> Subir Imagen
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Imágenes</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs font-serif italic text-brand-teal">En Cloudinary</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espacio Usado</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs font-serif italic text-brand-teal">Almacenamiento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transformaciones</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs font-serif italic text-brand-teal">Este mes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Image className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Galería de Imágenes</h3>
              <p className="text-muted-foreground max-w-md mx-auto mt-2">
                La integración con Cloudinary para subir, organizar y optimizar
                imágenes estará disponible próximamente. Por ahora, las imágenes
                se gestionan directamente en el formulario de tours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
