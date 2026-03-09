"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { RouterOutput } from "@/types";
import DOMPurify from "dompurify";

// Sanitize HTML to prevent XSS using browser-native DOMPurify
function sanitizeClientHtml(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html);
}

type FAQ = NonNullable<RouterOutput["content"]["faqList"]>[number];
type Testimonial = NonNullable<RouterOutput["content"]["testimonialList"]>[number];
type BlogPost = RouterOutput["content"]["blogList"]["posts"][number];
type HomeSection = NonNullable<RouterOutput["content"]["homeSectionList"]>[number];
type Setting = NonNullable<RouterOutput["content"]["settingsList"]>[number];
type ContactMessage = RouterOutput["content"]["contactList"]["messages"][number];
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Pencil, Save, Plus, ChevronLeft, ChevronRight, XCircle, CheckCircle, Trash2, StarOff, Star, EyeOff, Eye, MoreHorizontal } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import dynamic from "next/dynamic";

const TiptapEditor = dynamic(() => import("@/components/ui/tiptap-editor").then(m => ({ default: m.TiptapEditor })), { ssr: false });

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
          <TabsTrigger value="contact">Mensajes</TabsTrigger>
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

        <TabsContent value="contact" className="mt-6">
          <ContactMessagesSection />
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
  const [editFaq, setEditFaq] = useState<FAQ | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: faqs, isLoading, refetch } = trpc.content.faqList.useQuery();

  const createFaq = trpc.content.faqCreate.useMutation({
    onSuccess: () => {
      toast({ title: "FAQ creada" });
      refetch();
      setShowCreate(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateFaq = trpc.content.faqUpdate.useMutation({
    onSuccess: () => {
      toast({ title: "FAQ actualizada" });
      refetch();
      setEditFaq(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createFaq.mutate({
      questionEs: fd.get("questionEs") as string,
      questionEn: fd.get("questionEn") as string,
      answerEs: fd.get("answerEs") as string,
      answerEn: fd.get("answerEn") as string,
      category: (fd.get("category") as string) || undefined,
      sortOrder: Number(fd.get("sortOrder") || 0),
      isPublished: true,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editFaq) return;
    const fd = new FormData(e.currentTarget);
    updateFaq.mutate({
      id: editFaq.id,
      questionEs: fd.get("questionEs") as string,
      questionEn: fd.get("questionEn") as string,
      answerEs: fd.get("answerEs") as string,
      answerEn: fd.get("answerEn") as string,
      category: (fd.get("category") as string) || undefined,
      sortOrder: Number(fd.get("sortOrder") || 0),
    });
  };

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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Preguntas Frecuentes</CardTitle>
            <CardDescription>{faqs?.length ?? 0} FAQs registradas</CardDescription>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva FAQ
          </Button>
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
                        <DropdownMenuItem onClick={() => setEditFaq(faq)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
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

      {/* Dialog Crear FAQ */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva FAQ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Pregunta (ES)</Label>
                <Input name="questionEs" required />
              </div>
              <div className="space-y-2">
                <Label>Pregunta (EN)</Label>
                <Input name="questionEn" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Respuesta (ES)</Label>
                <Textarea name="answerEs" rows={3} required />
              </div>
              <div className="space-y-2">
                <Label>Respuesta (EN)</Label>
                <Textarea name="answerEn" rows={3} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Input name="category" placeholder="General" />
              </div>
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input name="sortOrder" type="number" defaultValue={0} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createFaq.isPending}>
                {createFaq.isPending ? "Creando..." : "Crear FAQ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar FAQ */}
      <Dialog open={!!editFaq} onOpenChange={() => setEditFaq(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar FAQ</DialogTitle>
          </DialogHeader>
          {editFaq && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pregunta (ES)</Label>
                  <Input name="questionEs" defaultValue={editFaq.questionEs} required />
                </div>
                <div className="space-y-2">
                  <Label>Pregunta (EN)</Label>
                  <Input name="questionEn" defaultValue={editFaq.questionEn} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Respuesta (ES)</Label>
                  <Textarea name="answerEs" rows={3} defaultValue={editFaq.answerEs} required />
                </div>
                <div className="space-y-2">
                  <Label>Respuesta (EN)</Label>
                  <Textarea name="answerEn" rows={3} defaultValue={editFaq.answerEn} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Input name="category" defaultValue={editFaq.category || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Orden</Label>
                  <Input name="sortOrder" type="number" defaultValue={editFaq.sortOrder} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditFaq(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateFaq.isPending}>
                  {updateFaq.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar FAQ */}
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
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [contentEs, setContentEs] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ title: string; content: string; image: string }>({ title: "", content: "", image: "" });

  const { data, isLoading, refetch } = trpc.content.blogList.useQuery({ page, limit: 10 });

  const { data: editPost, isLoading: editLoading } = trpc.content.blogGetById.useQuery(
    { id: editId! },
    { enabled: !!editId }
  );

  const togglePublish = trpc.content.blogTogglePublish.useMutation({
    onSuccess: () => { toast({ title: "Estado actualizado" }); refetch(); },
  });

  const createBlog = trpc.content.blogCreate.useMutation({
    onSuccess: () => {
      toast({ title: "Articulo creado como borrador" });
      refetch();
      setShowCreate(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateBlog = trpc.content.blogUpdate.useMutation({
    onSuccess: () => {
      toast({ title: "Articulo actualizado" });
      refetch();
      setEditId(null);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteBlog = trpc.content.blogDelete.useMutation({
    onSuccess: () => {
      toast({ title: "Articulo eliminado" });
      refetch();
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setCoverImageUrl("");
    setContentEs("");
    setContentEn("");
  };

  const slugify = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createBlog.mutate({
      slug: fd.get("slug") as string,
      titleEs: fd.get("titleEs") as string,
      titleEn: fd.get("titleEn") as string,
      excerptEs: fd.get("excerptEs") as string,
      excerptEn: fd.get("excerptEn") as string,
      contentEs: contentEs || "",
      contentEn: contentEn || "",
      coverImageUrl: coverImageUrl || undefined,
      category: (fd.get("category") as string) || undefined,
      isPublished: false,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editId) return;
    const fd = new FormData(e.currentTarget);
    updateBlog.mutate({
      id: editId,
      slug: fd.get("slug") as string,
      titleEs: fd.get("titleEs") as string,
      titleEn: fd.get("titleEn") as string,
      excerptEs: fd.get("excerptEs") as string,
      excerptEn: fd.get("excerptEn") as string,
      contentEs: contentEs,
      contentEn: contentEn,
      coverImageUrl: coverImageUrl || undefined,
      category: (fd.get("category") as string) || undefined,
    });
  };

  const openEdit = (postId: string) => {
    setEditId(postId);
  };

  // Cargar datos del post al editar
  const editReady = editPost && editId;
  if (editReady && contentEs === "" && contentEn === "") {
    const esContent = typeof editPost.contentEs === "string" ? editPost.contentEs : JSON.stringify(editPost.contentEs);
    const enContent = typeof editPost.contentEn === "string" ? editPost.contentEn : JSON.stringify(editPost.contentEn);
    setContentEs(esContent);
    setContentEn(enContent);
    setCoverImageUrl(editPost.coverImageUrl || "");
  }

  if (isLoading) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Blog Posts</CardTitle>
            <CardDescription>{data?.total ?? 0} articulos</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Articulo
          </Button>
        </CardHeader>
        <CardContent>
          {data?.posts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay articulos aun</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titulo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.posts.map((post: BlogPost) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {post.coverImageUrl && (
                            <img src={post.coverImageUrl} alt="" className="h-10 w-14 rounded object-cover" />
                          )}
                          <span className="font-medium">{post.titleEs}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{post.category || "General"}</Badge></TableCell>
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
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { resetForm(); openEdit(post.id); }}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePublish.mutate({ id: post.id })}>
                              {post.isPublished ? (
                                <><EyeOff className="mr-2 h-4 w-4" /> Despublicar</>
                              ) : (
                                <><Eye className="mr-2 h-4 w-4" /> Publicar</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const content = typeof post.excerptEs === "string" ? post.excerptEs : "";
                              setPreviewContent({ title: post.titleEs, content, image: post.coverImageUrl || "" });
                              setShowPreview(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" /> Vista Previa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(post.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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
                  <p className="text-sm text-muted-foreground">Pagina {data.page} de {data.pages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= (data?.pages ?? 1)}>
                      Siguiente <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Crear Blog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) resetForm(); setShowCreate(open); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Articulo de Blog</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Titulo (ES) *</Label>
                <Input name="titleEs" required onChange={(e) => {
                  const slugInput = e.currentTarget.form?.querySelector<HTMLInputElement>('[name="slug"]');
                  if (slugInput && !slugInput.dataset.manual) slugInput.value = slugify(e.target.value);
                }} />
              </div>
              <div className="space-y-2">
                <Label>Titulo (EN) *</Label>
                <Input name="titleEn" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input name="slug" required pattern="^[a-z0-9-]+$" onInput={(e) => { (e.target as HTMLInputElement).dataset.manual = "true"; }} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input name="category" placeholder="Travel, Tips, etc." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Imagen de Portada</Label>
              <ImageUpload value={coverImageUrl} onChange={(url) => setCoverImageUrl(url)} onRemove={() => setCoverImageUrl("")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Extracto (ES) *</Label>
                <Textarea name="excerptEs" rows={2} required placeholder="Resumen corto para el listado" />
              </div>
              <div className="space-y-2">
                <Label>Extracto (EN) *</Label>
                <Textarea name="excerptEn" rows={2} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contenido (ES)</Label>
              <TiptapEditor content={contentEs} onChange={setContentEs} placeholder="Escribe el contenido del articulo..." />
            </div>
            <div className="space-y-2">
              <Label>Contenido (EN)</Label>
              <TiptapEditor content={contentEn} onChange={setContentEn} placeholder="Write the article content..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={createBlog.isPending}>
                {createBlog.isPending ? "Creando..." : "Crear como Borrador"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Blog */}
      <Dialog open={!!editId} onOpenChange={(open) => { if (!open) { setEditId(null); resetForm(); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Articulo</DialogTitle>
          </DialogHeader>
          {editLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : editPost ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Titulo (ES)</Label>
                  <Input name="titleEs" defaultValue={editPost.titleEs} required />
                </div>
                <div className="space-y-2">
                  <Label>Titulo (EN)</Label>
                  <Input name="titleEn" defaultValue={editPost.titleEn} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input name="slug" defaultValue={editPost.slug} required pattern="^[a-z0-9-]+$" />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input name="category" defaultValue={editPost.category || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imagen de Portada</Label>
                <ImageUpload value={coverImageUrl} onChange={(url) => setCoverImageUrl(url)} onRemove={() => setCoverImageUrl("")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Extracto (ES)</Label>
                  <Textarea name="excerptEs" rows={2} defaultValue={editPost.excerptEs} required />
                </div>
                <div className="space-y-2">
                  <Label>Extracto (EN)</Label>
                  <Textarea name="excerptEn" rows={2} defaultValue={editPost.excerptEn} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contenido (ES)</Label>
                <TiptapEditor content={contentEs} onChange={setContentEs} placeholder="Escribe el contenido..." />
              </div>
              <div className="space-y-2">
                <Label>Contenido (EN)</Label>
                <TiptapEditor content={contentEn} onChange={setContentEn} placeholder="Write the content..." />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setEditId(null); resetForm(); }}>Cancelar</Button>
                <Button type="submit" disabled={updateBlog.isPending}>
                  {updateBlog.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Dialog Vista Previa Blog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewContent.image && (
              <img src={previewContent.image} alt="" className="w-full aspect-[16/9] object-cover rounded-lg" />
            )}
            <h2 className="text-xl font-bold">{previewContent.title}</h2>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeClientHtml(previewContent.content) }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar Blog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Articulo</DialogTitle>
            <DialogDescription>Esta accion no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteBlog.mutate({ id: deleteId })} disabled={deleteBlog.isPending}>
              {deleteBlog.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===== Home Sections =====
function HomeSectionsSection() {
  const { toast } = useToast();
  const [editSection, setEditSection] = useState<HomeSection | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  const { data: sections, isLoading, refetch } = trpc.content.homeSectionList.useQuery();

  const toggleVisible = trpc.content.homeSectionToggleVisible.useMutation({
    onSuccess: () => {
      toast({ title: "Visibilidad actualizada" });
      refetch();
    },
  });

  const updateSection = trpc.content.homeSectionUpdate.useMutation({
    onSuccess: () => {
      toast({ title: "Sección actualizada correctamente" });
      refetch();
      setEditSection(null);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editSection) return;
    const fd = new FormData(e.currentTarget);
    updateSection.mutate({
      id: editSection.id,
      titleEs: (fd.get("titleEs") as string) || undefined,
      titleEn: (fd.get("titleEn") as string) || undefined,
      subtitleEs: (fd.get("subtitleEs") as string) || undefined,
      subtitleEn: (fd.get("subtitleEn") as string) || undefined,
      imageUrl: imageUrl || undefined,
    });
  };

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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditSection(section);
                        setImageUrl(section.imageUrl || "");
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Dialog Editar Sección / Destinos */}
      <Dialog open={!!editSection} onOpenChange={() => setEditSection(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar {editSection ? typeLabels[editSection.type] : "Sección"}</DialogTitle>
          </DialogHeader>
          {editSection && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Título (ES)</Label>
                  <Input name="titleEs" defaultValue={editSection.titleEs || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Título (EN)</Label>
                  <Input name="titleEn" defaultValue={editSection.titleEn || ""} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Subtítulo (ES)</Label>
                  <Input name="subtitleEs" defaultValue={editSection.subtitleEs || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo (EN)</Label>
                  <Input name="subtitleEn" defaultValue={editSection.subtitleEn || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imagen Principal (Opcional)</Label>
                <div className="pt-2">
                  <ImageUpload
                    value={imageUrl}
                    onChange={(url) => setImageUrl(url)}
                    onRemove={() => setImageUrl("")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditSection(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateSection.isPending}>
                  {updateSection.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ===== Contact Messages =====
function ContactMessagesSection() {
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const { data, isLoading, refetch } = trpc.content.contactList.useQuery({
    page,
    limit: 10,
  });

  const markRead = trpc.content.contactMarkRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteMessage = trpc.content.contactDelete.useMutation({
    onSuccess: () => {
      toast({ title: "Mensaje eliminado" });
      refetch();
      setSelectedMessage(null);
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
          <CardTitle>Mensajes de Contacto</CardTitle>
          <CardDescription>{data?.total ?? 0} mensajes recibidos</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.messages.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay mensajes aún</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.messages.map((msg: ContactMessage) => (
                    <TableRow
                      key={msg.id}
                      className={msg.isRead ? "" : "font-semibold bg-blue-50/50"}
                    >
                      <TableCell>{msg.name}</TableCell>
                      <TableCell>{msg.email}</TableCell>
                      <TableCell className="max-w-xs truncate">{msg.subject}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(msg.createdAt).toLocaleDateString("es-PE")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={msg.isRead ? "secondary" : "default"}>
                          {msg.isRead ? "Leído" : "Nuevo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedMessage(msg);
                            if (!msg.isRead) markRead.mutate({ id: msg.id });
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

      {/* Dialog Ver Mensaje */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            <DialogDescription>
              De: {selectedMessage?.name} ({selectedMessage?.email})
              {selectedMessage?.phone && ` • Tel: ${selectedMessage.phone}`}
              {" • "}
              {selectedMessage?.createdAt &&
                new Date(selectedMessage.createdAt).toLocaleString("es-PE")}
            </DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm border rounded-md p-4 bg-muted/50 max-h-64 overflow-y-auto">
            {selectedMessage?.message}
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                selectedMessage && deleteMessage.mutate({ id: selectedMessage.id })
              }
              disabled={deleteMessage.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteMessage.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===== Settings =====
function SettingsSection() {
  const { toast } = useToast();
  const { data: settings, isLoading, refetch } = trpc.content.settingsList.useQuery();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const upsertSetting = trpc.content.settingUpsert.useMutation({
    onSuccess: () => {
      toast({ title: "Configuración guardada" });
      refetch();
      setEditingKey(null);
      setShowCreate(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (setting: Setting) => {
    setEditingKey(setting.key);
    setEditValue(typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value));
  };

  const handleSave = (key: string) => {
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(editValue);
    } catch {
      parsedValue = editValue;
    }
    upsertSetting.mutate({ key, value: parsedValue });
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const key = fd.get("key") as string;
    const value = fd.get("value") as string;
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }
    upsertSetting.mutate({ key, value: parsedValue });
  };

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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Configuración General</CardTitle>
            <CardDescription>Configuraciones del sistema</CardDescription>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Config
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="w-[100px]">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings?.map((setting: Setting) => (
                <TableRow key={setting.id}>
                  <TableCell className="font-mono text-sm">{setting.key}</TableCell>
                  <TableCell>
                    {editingKey === setting.key ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="max-w-md"
                      />
                    ) : (
                      <span className="max-w-md truncate text-sm block">
                        {typeof setting.value === "string"
                          ? setting.value
                          : JSON.stringify(setting.value)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingKey === setting.key ? (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSave(setting.key)}
                          disabled={upsertSetting.isPending}
                        >
                          <Save className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingKey(null)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(setting)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Crear Setting */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Configuración</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Clave</Label>
              <Input name="key" required placeholder="site_name, whatsapp_number, etc." />
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input name="value" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={upsertSetting.isPending}>
                {upsertSetting.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
