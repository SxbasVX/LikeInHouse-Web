"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, FileText, Globe, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DocumentosPage() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: docs, isLoading } = trpc.docs.list.useQuery(
    { search: search || undefined },
    { staleTime: 30_000 }
  );

  const deleteMut = trpc.docs.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Documento eliminado" });
      utils.docs.list.invalidate();
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    deleteMut.mutate({ id });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documentos</h2>
          <p className="font-serif italic text-brand-teal">
            PDFs y páginas de contenido (T&C, certificaciones, políticas)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/documentos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Documento
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar documentos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {docs ? `${docs.length} documento${docs.length !== 1 ? "s" : ""}` : "Documentos"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : !docs?.length ? (
            <div className="p-8 text-center text-muted-foreground">
              No hay documentos. Crea el primero.
            </div>
          ) : (
            <div className="divide-y">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {doc.type === "PDF" ? (
                        <FileText className="h-5 w-5 text-brand-orange" />
                      ) : (
                        <Globe className="h-5 w-5 text-brand-teal" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{doc.titleEs}</p>
                      <p className="text-sm text-muted-foreground truncate">/docs/{doc.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Badge variant={doc.type === "PDF" ? "secondary" : "outline"}>
                      {doc.type}
                    </Badge>
                    <Badge variant={doc.isPublished ? "default" : "secondary"}>
                      {doc.isPublished ? "Publicado" : "Borrador"}
                    </Badge>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`/docs/${doc.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/documentos/${doc.id}/editar`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(doc.id, doc.titleEs)}
                      disabled={deleteMut.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">¿Cómo usar los documentos?</p>
        <ul className="space-y-1 text-blue-700">
          <li>• <strong>PDF:</strong> Sube el PDF a Cloudinary, pega la URL aquí. La página mostrará el PDF dentro del sitio.</li>
          <li>• <strong>Contenido:</strong> Escribe el texto directamente. Útil para T&C, políticas de privacidad.</li>
          <li>• En Certificaciones y Footer, usa <code className="bg-blue-100 px-1 rounded">/docs/mi-slug</code> como link.</li>
        </ul>
      </div>
    </div>
  );
}
