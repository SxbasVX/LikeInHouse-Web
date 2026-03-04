"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { RouterOutput } from "@/types";

type FAQ = NonNullable<RouterOutput["content"]["faqList"]>[number];
type Testimonial = NonNullable<RouterOutput["content"]["testimonialList"]>[number];
type BlogPost = RouterOutput["content"]["blogList"]["posts"][number];
type HomeSection = NonNullable<RouterOutput["content"]["homeSectionList"]>[number];
type Setting = NonNullable<RouterOutput["content"]["settingsList"]>[number];
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ContenidoPage() {
  const [activeTab, setActiveTab] = useState("faqs");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contenido</h1>
        <p className="text-muted-foreground">
          Gestiona el contenido del sitio web público
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonios</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="sections">Secciones Home</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="mt-6">
          <FAQsSection />
        </TabsContent>

        <TabsContent value="testimonials" className="mt-6">
          <TestimonialsSection />
        </TabsContent>

        <TabsContent value="blog" className="mt-6">
          <BlogSection />
        </TabsContent>

        <TabsContent value="sections" className="mt-6">
          <HomeSectionsSection />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===== FAQs =====
function FAQsSection() {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: faqs, isLoading, refetch } = trpc.content.faqList.useQuery();

  const deleteFaq = trpc.content.faqDelete.useMutation({
    onSuccess: () => {
      toast({ title: "FAQ eliminada" });
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Preguntas Frecuentes</CardTitle>
          <CardDescription>{faqs?.length ?? 0} FAQs registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pregunta (ES)</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs?.map((faq: FAQ) => (
                <TableRow key={faq.id}>
                  <TableCell className="font-medium max-w-md truncate">
                    {faq.questionEs}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{faq.category || "General"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={faq.isPublished ? "default" : "secondary"}>
                      {faq.isPublished ? "Publicada" : "Oculta"}
                    </Badge>
                  </TableCell>
                  <TableCell>{faq.sortOrder}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setDeleteId(faq.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar FAQ</DialogTitle>
            <DialogDescription>¿Estás seguro? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteFaq.mutate({ id: deleteId })}
              disabled={deleteFaq.isPending}
            >
              {deleteFaq.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===== Testimonials =====
function TestimonialsSection() {
  const { toast } = useToast();

  const { data: testimonials, isLoading, refetch } = trpc.content.testimonialList.useQuery();

  const updateTestimonial = trpc.content.testimonialUpdate.useMutation({
    onSuccess: () => {
      toast({ title: "Testimonio actualizado" });
      refetch();
    },
  });

  const deleteTestimonial = trpc.content.testimonialDelete.useMutation({
    onSuccess: () => {
      toast({ title: "Testimonio eliminado" });
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testimonios</CardTitle>
        <CardDescription>{testimonials?.length ?? 0} testimonios</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Tour</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Texto</TableHead>
              <TableHead>Aprobado</TableHead>
              <TableHead>Destacado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testimonials?.map((t: Testimonial) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.clientName}</TableCell>
                <TableCell>{t.country || "-"}</TableCell>
                <TableCell>{t.tourName || "-"}</TableCell>
                <TableCell>{"⭐".repeat(t.rating)}</TableCell>
                <TableCell className="max-w-xs truncate">{t.textEs}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateTestimonial.mutate({
                        id: t.id,
                        isApproved: !t.isApproved,
                      })
                    }
                  >
                    {t.isApproved ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateTestimonial.mutate({
                        id: t.id,
                        isFeatured: !t.isFeatured,
                      })
                    }
                  >
                    {t.isFeatured ? (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTestimonial.mutate({ id: t.id })}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ===== Blog =====
function BlogSection() {
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const { data, isLoading, refetch } = trpc.content.blogList.useQuery({
    page,
    limit: 10,
  });

  const togglePublish = trpc.content.blogTogglePublish.useMutation({
    onSuccess: () => {
      toast({ title: "Estado actualizado" });
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blog Posts</CardTitle>
        <CardDescription>{data?.total ?? 0} artículos</CardDescription>
      </CardHeader>
      <CardContent>
        {data?.posts.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No hay artículos aún</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.posts.map((post: BlogPost) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.titleEs}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{post.category || "General"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.isPublished ? "default" : "secondary"}>
                        {post.isPublished ? "Publicado" : "Borrador"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("es-PE")
                        : new Date(post.createdAt).toLocaleDateString("es-PE")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => togglePublish.mutate({ id: post.id })}
                          >
                            {post.isPublished ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" /> Despublicar
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" /> Publicar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {data && data.pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Página {data.page} de {data.pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= (data?.pages ?? 1)}
                  >
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Home Sections =====
function HomeSectionsSection() {
  const { toast } = useToast();

  const { data: sections, isLoading, refetch } = trpc.content.homeSectionList.useQuery();

  const toggleVisible = trpc.content.homeSectionToggleVisible.useMutation({
    onSuccess: () => {
      toast({ title: "Visibilidad actualizada" });
      refetch();
    },
  });

  const typeLabels: Record<string, string> = {
    HERO: "Hero Banner",
    FEATURED_TOURS: "Tours Destacados",
    DESTINATIONS: "Destinos",
    TESTIMONIALS: "Testimonios",
    PROMOTIONS: "Promociones",
    CTA: "Call to Action",
    ABOUT_PREVIEW: "Sobre Nosotros",
    BLOG_PREVIEW: "Blog Preview",
    CUSTOM_HTML: "HTML Personalizado",
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Secciones del Home</CardTitle>
        <CardDescription>
          Activa/desactiva secciones de la página principal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Título (ES)</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead className="w-[100px]">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections?.map((section: HomeSection) => (
              <TableRow key={section.id}>
                <TableCell>
                  <Badge variant="outline">{typeLabels[section.type] || section.type}</Badge>
                </TableCell>
                <TableCell>{section.titleEs || "-"}</TableCell>
                <TableCell>{section.sortOrder}</TableCell>
                <TableCell>
                  <Badge variant={section.isVisible ? "default" : "secondary"}>
                    {section.isVisible ? "Visible" : "Oculta"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleVisible.mutate({ id: section.id })}
                  >
                    {section.isVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ===== Settings =====
function SettingsSection() {
  const { data: settings, isLoading } = trpc.content.settingsList.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración General</CardTitle>
        <CardDescription>Configuraciones del sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clave</TableHead>
              <TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings?.map((setting: Setting) => (
              <TableRow key={setting.id}>
                <TableCell className="font-mono text-sm">{setting.key}</TableCell>
                <TableCell className="max-w-md truncate text-sm">
                  {typeof setting.value === "string"
                    ? setting.value
                    : JSON.stringify(setting.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
