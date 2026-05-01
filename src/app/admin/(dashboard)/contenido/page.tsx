"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { RouterOutput } from "@/types";
import DOMPurify from "dompurify";

// Sanitize HTML to prevent XSS using browser-native DOMPurify
function sanitizeClientHtml(html: string): string {
  if (typeof window === "undefined") return ""; // Never render unsanitized HTML during SSR
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
import Image from "next/image";
import dynamic from "next/dynamic";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CreditCard, Bell, Home as HomeIcon } from "lucide-react";
import { parseAirbnbListings, type AirbnbListing } from "@/lib/airbnb";

const TiptapEditor = dynamic(() => import("@/components/ui/tiptap-editor").then(m => ({ default: m.TiptapEditor })), { ssr: false });

export default function ContenidoPage() {
  const [activeTab, setActiveTab] = useState("faqs");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-darkRed">Contenido</h1>
        <p className="font-serif italic text-brand-teal">
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
          {activeTab === "faqs" && <FAQsSection />}
        </TabsContent>

        <TabsContent value="testimonials" className="mt-6">
          {activeTab === "testimonials" && <TestimonialsSection />}
        </TabsContent>

        <TabsContent value="blog" className="mt-6">
          {activeTab === "blog" && <BlogSection />}
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          {activeTab === "contact" && <ContactMessagesSection />}
        </TabsContent>

        <TabsContent value="sections" className="mt-6">
          {activeTab === "sections" && <HomeSectionsSection />}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          {activeTab === "settings" && <SettingsSection />}
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
                      <CheckCircle className="h-4 w-4 text-brand-teal" />
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
                      <Star className="h-4 w-4 text-brand-orange fill-brand-orange" />
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
                    <Trash2 className="h-4 w-4 text-brand-darkRed" />
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
            <p className="text-center py-8 font-serif italic text-brand-teal">No hay articulos aun</p>
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
                  <p className="text-sm font-serif italic text-brand-teal">Pagina {data.page} de {data.pages}</p>
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
            <p className="text-center py-8 font-serif italic text-brand-teal">No hay mensajes aún</p>
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
                  <p className="text-sm font-serif italic text-brand-teal">
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

// Predefined settings with friendly labels
const PREDEFINED_SETTINGS = [
  { key: "phone", label: "Teléfono", placeholder: "+51 84 123 456" },
  { key: "contactEmail", label: "Email de contacto", placeholder: "info@likeinhouseperu.com" },
  { key: "address", label: "Dirección", placeholder: "Bellavista B-9-A, Cusco, Perú" },
  { key: "companyLegalName", label: "Razón Social (legal)", placeholder: "Like In House Peru S.A.C." },
  { key: "companyRuc", label: "RUC", placeholder: "20612345678" },
  { key: "companyWeb", label: "Web (sin https://)", placeholder: "likeinhouseperu.com" },
  { key: "facebookUrl", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "instagramUrl", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "tiktokUrl", label: "TikTok", placeholder: "https://tiktok.com/@..." },
  { key: "youtubeUrl", label: "YouTube", placeholder: "https://youtube.com/@..." },
  { key: "libroReclamacionesUrl", label: "Libro de Reclamaciones (URL)", placeholder: "https://..." },
  { key: "codigoEsnnaUrl", label: "Código ESNNA (URL)", placeholder: "https://..." },
  { key: "politicasCancelacionUrl", label: "Políticas de Cancelación (URL)", placeholder: "/politicas-cancelacion" },
  { key: "proteccionDatosUrl", label: "Protección de Datos (URL)", placeholder: "/proteccion-datos" },
] as const;

const CERTIFICATIONS = [
  { slot: 1, name: "Mincetur",        description: "Ministerio de Comercio Exterior y Turismo" },
  { slot: 2, name: "PromPerú",        description: "Comisión de Promoción del Perú" },
  { slot: 3, name: "Y tú qué planes?", description: "Marca turística del Perú" },
  { slot: 4, name: "Gercetur Cusco",  description: "Gerencia Regional de Comercio Exterior y Turismo" },
  { slot: 5, name: "Dircetur Tumbes", description: "Dirección Regional de Comercio Exterior y Turismo" },
] as const;

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

  const getSettingValue = (key: string): string => {
    if (!settings) return "";
    const s = settings.find((s: Setting) => s.key === key);
    if (!s) return "";
    return typeof s.value === "string" ? s.value : JSON.stringify(s.value);
  };

  const handleQuickSave = (key: string, value: string) => {
    upsertSetting.mutate({ key, value });
  };

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

  // Settings not in the predefined list
  const predefinedKeys = new Set<string>(PREDEFINED_SETTINGS.map(s => s.key));
  const customSettings = settings?.filter((s: Setting) => !predefinedKeys.has(s.key)) || [];

  return (
    <div className="space-y-6">
      {/* Predefined Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de Contacto y Links</CardTitle>
          <CardDescription>Información que aparece en el sitio web</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PREDEFINED_SETTINGS.map(({ key, label, placeholder }) => {
            const currentValue = getSettingValue(key);
            return (
              <PredefinedSettingRow
                key={key}
                settingKey={key}
                label={label}
                placeholder={placeholder}
                currentValue={currentValue}
                onSave={handleQuickSave}
                isPending={upsertSetting.isPending}
              />
            );
          })}
        </CardContent>
      </Card>

      {/* Pasarelas de Pago */}
      <PaymentGatewaysSettings
        getSettingValue={getSettingValue}
        onSave={handleQuickSave}
        isPending={upsertSetting.isPending}
      />

      {/* Notificaciones WhatsApp a Dueños */}
      <OwnerNotificationsSettings
        getSettingValue={getSettingValue}
        onSave={handleQuickSave}
        isPending={upsertSetting.isPending}
      />

      {/* Alojamientos en Airbnb */}
      <AirbnbListingsSettings
        settings={settings || []}
        onSave={handleQuickSave}
        isPending={upsertSetting.isPending}
      />

      {/* Certificaciones / Avales */}
      <CertificationsSettings
        getSettingValue={getSettingValue}
        onSave={handleQuickSave}
        isPending={upsertSetting.isPending}
      />

      {/* Custom Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Configuración Avanzada</CardTitle>
            <CardDescription>Otras configuraciones del sistema</CardDescription>
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
              {customSettings.map((setting: Setting) => (
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
                          <Save className="h-4 w-4 text-brand-teal" />
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
              {customSettings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                    No hay configuraciones personalizadas
                  </TableCell>
                </TableRow>
              )}
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
              <Input name="key" required placeholder="mi_configuracion" />
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
    </div>
  );
}

// Pasarelas de Pago — toggle para activar Culqi (requiere env vars)
function PaymentGatewaysSettings({
  getSettingValue, onSave, isPending,
}: {
  getSettingValue: (key: string) => string;
  onSave: (key: string, value: string) => void;
  isPending: boolean;
}) {
  const raw = getSettingValue("culqiEnabled");
  const enabled = raw === "true" || raw === "1";

  const handleToggle = (checked: boolean) => {
    onSave("culqiEnabled", checked ? "true" : "false");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pasarelas de Pago</CardTitle>
        <CardDescription>Activa o desactiva los métodos de pago disponibles en el checkout</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange/10 shrink-0">
              <CreditCard className="h-5 w-5 text-brand-orange" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">Culqi (Tarjeta · Yape)</p>
                {enabled ? (
                  <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-500">Activo</Badge>
                ) : (
                  <Badge variant="secondary">Desactivado</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Acepta pagos en soles (PEN) con tarjetas Visa, Mastercard, Amex, Diners y Yape.
              </p>
              {!enabled && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2 mt-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900">
                    Antes de activar: configura <code className="px-1 rounded bg-amber-100 font-mono text-[11px]">CULQI_SECRET_KEY</code>,{" "}
                    <code className="px-1 rounded bg-amber-100 font-mono text-[11px]">NEXT_PUBLIC_CULQI_PUBLIC_KEY</code> y{" "}
                    <code className="px-1 rounded bg-amber-100 font-mono text-[11px]">CULQI_WEBHOOK_SECRET</code> en las variables de entorno (Vercel).
                  </p>
                </div>
              )}
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          PayPal siempre está activo. Si Culqi está desactivado, los clientes solo verán PayPal como opción de pago.
        </p>
      </CardContent>
    </Card>
  );
}

// Notificaciones WhatsApp a Dueños — lista editable de números que reciben todas las alertas
function OwnerNotificationsSettings({
  getSettingValue, onSave, isPending,
}: {
  getSettingValue: (key: string) => string;
  onSave: (key: string, value: string) => void;
  isPending: boolean;
}) {
  const SETTING_KEY = "owner.whatsapp_phones";
  const raw = getSettingValue(SETTING_KEY);

  // Parsear el valor guardado: acepta JSON array o CSV
  const parseStored = (v: string): string[] => {
    if (!v) return [];
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) return p.map(String);
    } catch { /* no es JSON */ }
    return v.split(/[,\s\n]+/).filter(Boolean);
  };

  const [draft, setDraft] = useState<string>(() => parseStored(raw).join("\n"));
  const [lastSavedRaw, setLastSavedRaw] = useState<string>(raw);

  // Si el valor remoto cambia (ej: tras refetch), sincronizar draft una sola vez
  if (raw !== lastSavedRaw && draft === parseStored(lastSavedRaw).join("\n")) {
    setDraft(parseStored(raw).join("\n"));
    setLastSavedRaw(raw);
  }

  const parsed = draft
    .split(/[,\s\n]+/)
    .map((s) => s.replace(/\D/g, ""))
    .filter(Boolean);
  const valid = parsed.filter((p) => p.length >= 8);
  const invalid = parsed.filter((p) => p.length < 8);

  const handleSave = () => {
    // Guardar como CSV (el server acepta ambos formatos)
    onSave(SETTING_KEY, valid.join(","));
    setLastSavedRaw(valid.join(","));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand-orange" />
          Notificaciones WhatsApp (Dueños)
        </CardTitle>
        <CardDescription>
          Números que reciben todas las alertas: nuevas reservas, pagos confirmados y el resumen diario de 8:00 am con las reservas próximas.
          Un número por línea, formato internacional sin <code>+</code> (ej: <code>51987654321</code>).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={"51987654321\n51912345678"}
          rows={4}
          className="font-mono text-sm"
        />
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {valid.length > 0 ? (
              <span className="text-emerald-600">✓ {valid.length} número{valid.length > 1 ? "s" : ""} válido{valid.length > 1 ? "s" : ""}</span>
            ) : (
              <span className="text-amber-600">Sin números: se usará el número de emergencia del .env</span>
            )}
            {invalid.length > 0 && (
              <span className="text-destructive ml-2">· {invalid.length} inválido{invalid.length > 1 ? "s" : ""} (mínimo 8 dígitos)</span>
            )}
          </div>
          <Button onClick={handleSave} disabled={isPending} size="sm">
            <Save className="mr-2 h-4 w-4" /> Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Alojamientos Airbnb — lista editable de listings (label + url)
function AirbnbListingsSettings({
  settings, onSave, isPending,
}: {
  settings: Setting[];
  onSave: (key: string, value: string) => void;
  isPending: boolean;
}) {
  const SETTING_KEY = "airbnbListings";

  // Construir el mapa key->value desde el array para reusar el parser publico
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const initial = parseAirbnbListings(settingsMap);

  const [draft, setDraft] = useState<AirbnbListing[]>(() =>
    initial.length > 0 ? initial : [{ label: "", url: "" }]
  );
  const [lastSaved, setLastSaved] = useState<string>(JSON.stringify(initial));

  // Re-sync si remoto cambia (ej. tras refetch) y no hay edicion en curso
  const remoteJson = JSON.stringify(initial);
  if (remoteJson !== lastSaved && JSON.stringify(draft) === lastSaved) {
    setDraft(initial.length > 0 ? initial : [{ label: "", url: "" }]);
    setLastSaved(remoteJson);
  }

  const updateRow = (i: number, patch: Partial<AirbnbListing>) => {
    setDraft((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  };
  const addRow = () => setDraft((d) => [...d, { label: "", url: "" }]);
  const removeRow = (i: number) => setDraft((d) => d.filter((_, idx) => idx !== i));

  const valid = draft.filter(
    (r) => r.label.trim().length > 0 && /^https?:\/\/.+/i.test(r.url.trim())
  );

  const handleSave = () => {
    const cleaned = valid.map((r) => ({ label: r.label.trim().slice(0, 80), url: r.url.trim() }));
    // Guardamos como JSON string; el upsert intenta JSON.parse antes de almacenar.
    onSave(SETTING_KEY, JSON.stringify(cleaned));
    setLastSaved(JSON.stringify(cleaned));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HomeIcon className="h-5 w-5 text-[#FF385C]" />
          Alojamientos en Airbnb
        </CardTitle>
        <CardDescription>
          Cada listing aparece en el botón &quot;Airbnb&quot; del navbar. Si hay <strong>uno</strong> es link directo;
          si hay <strong>dos o más</strong> se abre un menú para que el visitante elija. El nombre se muestra al usuario
          (ej. &quot;Casa Cusco&quot;, &quot;Departamento Lima&quot;).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {draft.map((row, i) => {
            const urlOk = !row.url.trim() || /^https?:\/\/.+/i.test(row.url.trim());
            return (
              <div key={i} className="flex items-start gap-2">
                <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 flex-1">
                  <Input
                    placeholder="Casa Cusco"
                    value={row.label}
                    onChange={(e) => updateRow(i, { label: e.target.value })}
                    maxLength={80}
                  />
                  <Input
                    placeholder="https://www.airbnb.com/rooms/..."
                    value={row.url}
                    onChange={(e) => updateRow(i, { url: e.target.value })}
                    className={!urlOk ? "border-destructive" : ""}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(i)}
                  disabled={draft.length === 1}
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-2 h-4 w-4" /> Agregar otro
            </Button>
            <span className="text-xs text-muted-foreground">
              {valid.length === 0 ? (
                <span className="text-amber-600">Sin alojamientos visibles</span>
              ) : (
                <span className="text-emerald-600">
                  ✓ {valid.length} alojamiento{valid.length > 1 ? "s" : ""} listo{valid.length > 1 ? "s" : ""}
                </span>
              )}
            </span>
          </div>
          <Button onClick={handleSave} disabled={isPending} size="sm">
            <Save className="mr-2 h-4 w-4" /> Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Certificaciones / Avales — grid de 5 cards con ImageUpload + Link
function CertificationsSettings({
  getSettingValue, onSave, isPending,
}: {
  getSettingValue: (key: string) => string;
  onSave: (key: string, value: string) => void;
  isPending: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificaciones y Avales</CardTitle>
        <CardDescription>
          Logos de instituciones que aparecen en la sección "Certificaciones" de la web.
          Sube el logo y opcionalmente agrega un link (se abrirá en nueva pestaña).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CERTIFICATIONS.map((cert) => (
            <CertificationCard
              key={cert.slot}
              cert={cert}
              imageUrl={getSettingValue(`footerLogo${cert.slot}Url`)}
              linkUrl={getSettingValue(`footerLogo${cert.slot}Link`)}
              onSave={onSave}
              isPending={isPending}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CertificationCard({
  cert, imageUrl, linkUrl, onSave, isPending,
}: {
  cert: { slot: number; name: string; description: string };
  imageUrl: string;
  linkUrl: string;
  onSave: (key: string, value: string) => void;
  isPending: boolean;
}) {
  const [link, setLink] = useState(linkUrl);
  const [linkDirty, setLinkDirty] = useState(false);

  const imageKey = `footerLogo${cert.slot}Url`;
  const linkKey = `footerLogo${cert.slot}Link`;

  const handleImageChange = (url: string) => onSave(imageKey, url);
  const handleImageRemove = () => onSave(imageKey, "");

  const handleLinkSave = () => {
    onSave(linkKey, link);
    setLinkDirty(false);
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div>
        <p className="font-semibold text-sm">{cert.name}</p>
        <p className="text-xs text-muted-foreground">{cert.description}</p>
      </div>

      {/* Preview + upload */}
      {imageUrl ? (
        <div className="relative w-full h-24 rounded-md border bg-white flex items-center justify-center overflow-hidden">
          <Image src={imageUrl} alt={cert.name} fill className="object-contain p-2" sizes="200px" />
          <Button
            type="button"
            onClick={handleImageRemove}
            variant="destructive"
            size="sm"
            className="absolute top-1 right-1 h-7 w-7 p-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <ImageUpload value="" onChange={(url) => handleImageChange(url)} onRemove={handleImageRemove} />
      )}

      {/* Link */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Link (opcional)</Label>
        <div className="flex gap-1.5">
          <Input
            value={link}
            onChange={(e) => { setLink(e.target.value); setLinkDirty(e.target.value !== linkUrl); }}
            placeholder="https://..."
            className="h-9 text-sm"
          />
          {linkDirty && (
            <Button size="sm" onClick={handleLinkSave} disabled={isPending} className="shrink-0 h-9">
              <Save className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline editable row for predefined settings
function PredefinedSettingRow({
  settingKey, label, placeholder, currentValue, onSave, isPending,
}: {
  settingKey: string; label: string; placeholder: string;
  currentValue: string; onSave: (key: string, value: string) => void; isPending: boolean;
}) {
  const [value, setValue] = useState(currentValue);
  const [dirty, setDirty] = useState(false);

  const handleChange = (v: string) => {
    setValue(v);
    setDirty(v !== currentValue);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <Label className="w-40 shrink-0 text-sm font-medium">{label}</Label>
      <div className="flex flex-1 gap-2">
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        {dirty && (
          <Button
            size="sm"
            onClick={() => { onSave(settingKey, value); setDirty(false); }}
            disabled={isPending}
            className="shrink-0"
          >
            <Save className="h-4 w-4 mr-1" /> Guardar
          </Button>
        )}
      </div>
    </div>
  );
}
