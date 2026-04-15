"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Plus, Trash2, Pencil, CheckCircle2, XCircle, Tag, Image as ImageIcon, Percent,
  Power, PowerOff,
} from "lucide-react";

// ─── BANNERS ─────────────────────────────────────────────────────────────────

function BannersTab() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: banners = [], isLoading } = trpc.content.bannerList.useQuery();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    titleEs: "", titleEn: "",
    subtitleEs: "", subtitleEn: "",
    imageUrl: "",
    linkUrl: "", linkTextEs: "", linkTextEn: "",
    isActive: true,
    startsAt: "", endsAt: "",
    sortOrder: 0,
  });

  const create = trpc.content.bannerCreate.useMutation({
    onSuccess: () => { utils.content.bannerList.invalidate(); toast({ title: "Banner creado" }); setOpen(false); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const update = trpc.content.bannerUpdate.useMutation({
    onSuccess: () => { utils.content.bannerList.invalidate(); toast({ title: "Banner actualizado" }); setOpen(false); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const del = trpc.content.bannerDelete.useMutation({
    onSuccess: () => { utils.content.bannerList.invalidate(); toast({ title: "Banner eliminado" }); },
  });

  function openNew() {
    setEditing(null);
    setForm({ titleEs: "", titleEn: "", subtitleEs: "", subtitleEn: "", imageUrl: "", linkUrl: "", linkTextEs: "", linkTextEn: "", isActive: true, startsAt: "", endsAt: "", sortOrder: 0 });
    setOpen(true);
  }
  function openEdit(b: any) {
    setEditing(b);
    setForm({
      titleEs: b.titleEs, titleEn: b.titleEn,
      subtitleEs: b.subtitleEs || "", subtitleEn: b.subtitleEn || "",
      imageUrl: b.imageUrl, linkUrl: b.linkUrl || "",
      linkTextEs: b.linkTextEs || "", linkTextEn: b.linkTextEn || "",
      isActive: b.isActive,
      startsAt: b.startsAt ? b.startsAt.slice(0, 10) : "",
      endsAt: b.endsAt ? b.endsAt.slice(0, 10) : "",
      sortOrder: b.sortOrder,
    });
    setOpen(true);
  }
  function submit() {
    if (!form.imageUrl) return toast({ title: "Sube una imagen", variant: "destructive" });
    if (editing) {
      update.mutate({ id: editing.id, ...form });
    } else {
      create.mutate(form as any);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">Imágenes promocionales que aparecen en la home</p>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nuevo banner
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl">
          <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No hay banners aún. Crea el primero.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagen</TableHead>
              <TableHead>Título (ES)</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  {b.imageUrl ? (
                    <img src={b.imageUrl} alt={b.titleEs} className="h-12 w-20 object-cover rounded-lg" />
                  ) : (
                    <div className="h-12 w-20 bg-muted rounded-lg" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{b.titleEs}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {b.startsAt ? new Date(b.startsAt).toLocaleDateString("es") : "—"}
                  {" → "}
                  {b.endsAt ? new Date(b.endsAt).toLocaleDateString("es") : "sin límite"}
                </TableCell>
                <TableCell>
                  <Badge variant={b.isActive ? "default" : "secondary"}>
                    {b.isActive ? <><CheckCircle2 className="h-3 w-3 mr-1" />Activo</> : <><XCircle className="h-3 w-3 mr-1" />Inactivo</>}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => del.mutate({ id: b.id })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar banner" : "Nuevo banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Imagen del banner *</Label>
              <ImageUpload
                value={form.imageUrl}
                onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                folder="banners"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Título ES *</Label>
                <Input value={form.titleEs} onChange={(e) => setForm((f) => ({ ...f, titleEs: e.target.value }))} />
              </div>
              <div>
                <Label>Título EN *</Label>
                <Input value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subtítulo ES</Label>
                <Input value={form.subtitleEs} onChange={(e) => setForm((f) => ({ ...f, subtitleEs: e.target.value }))} />
              </div>
              <div>
                <Label>Subtítulo EN</Label>
                <Input value={form.subtitleEn} onChange={(e) => setForm((f) => ({ ...f, subtitleEn: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>URL de destino (link)</Label>
              <Input placeholder="https://..." value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Texto del botón ES</Label>
                <Input placeholder="Ver oferta" value={form.linkTextEs} onChange={(e) => setForm((f) => ({ ...f, linkTextEs: e.target.value }))} />
              </div>
              <div>
                <Label>Texto del botón EN</Label>
                <Input placeholder="See offer" value={form.linkTextEn} onChange={(e) => setForm((f) => ({ ...f, linkTextEn: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Fecha inicio</Label>
                <Input type="date" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
              </div>
              <div>
                <Label>Fecha fin</Label>
                <Input type="date" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
              </div>
              <div>
                <Label>Orden</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
              <Label>Activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={create.isPending || update.isPending}>
              {editing ? "Guardar cambios" : "Crear banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── DESCUENTOS GLOBALES ──────────────────────────────────────────────────────

function DiscountsTab() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: discounts = [], isLoading } = trpc.content.globalDiscountList.useQuery();
  const [name, setName] = useState("");
  const [percent, setPercent] = useState("");

  const create = trpc.content.globalDiscountCreate.useMutation({
    onSuccess: () => { utils.content.globalDiscountList.invalidate(); setName(""); setPercent(""); toast({ title: "Descuento creado" }); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const activate = trpc.content.globalDiscountActivate.useMutation({
    onSuccess: () => { utils.content.globalDiscountList.invalidate(); utils.public.activeGlobalDiscount.invalidate(); toast({ title: "Descuento activado para todos los tours" }); },
  });
  const deactivate = trpc.content.globalDiscountDeactivate.useMutation({
    onSuccess: () => { utils.content.globalDiscountList.invalidate(); utils.public.activeGlobalDiscount.invalidate(); toast({ title: "Descuento desactivado" }); },
  });
  const del = trpc.content.globalDiscountDelete.useMutation({
    onSuccess: () => { utils.content.globalDiscountList.invalidate(); toast({ title: "Eliminado" }); },
  });

  const hasActive = discounts.some((d) => d.isActive);

  return (
    <div className="space-y-6">
      {hasActive && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">
                Descuento activo: {discounts.find((d) => d.isActive)?.name} —{" "}
                {Number(discounts.find((d) => d.isActive)?.percent)}% en todos los tours
              </span>
            </div>
            <Button variant="outline" size="sm" className="border-green-300 text-green-700" onClick={() => deactivate.mutate()}>
              <PowerOff className="h-4 w-4 mr-1" /> Desactivar
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crear nuevo descuento</CardTitle>
          <CardDescription>Ej: "Black Friday" con 20%. Puedes tenerlos guardados y activar cuando quieras.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input placeholder="Nombre (ej: Black Friday)" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
            <div className="relative w-32">
              <Input
                type="number" min={1} max={99} placeholder="10"
                value={percent} onChange={(e) => setPercent(e.target.value)}
                className="pr-8"
              />
              <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <Button onClick={() => create.mutate({ name, percent: Number(percent) })} disabled={!name || !percent || create.isPending}>
              <Plus className="h-4 w-4 mr-1" /> Crear
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : discounts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border rounded-xl">
          <Tag className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>No hay descuentos creados aún.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descuento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-brand-orange border-brand-orange">
                    {Number(d.percent)}% OFF
                  </Badge>
                </TableCell>
                <TableCell>
                  {d.isActive ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Activo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {!d.isActive && (
                    <Button variant="outline" size="sm" onClick={() => activate.mutate({ id: d.id })} disabled={activate.isPending}>
                      <Power className="h-3.5 w-3.5 mr-1" /> Activar
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => del.mutate({ id: d.id })} disabled={d.isActive}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PromocionesPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Promociones</h1>
        <p className="text-muted-foreground text-sm">Gestiona banners en la home y descuentos globales para todos los tours</p>
      </div>

      <Tabs defaultValue="banners">
        <TabsList>
          <TabsTrigger value="banners">
            <ImageIcon className="h-4 w-4 mr-1.5" /> Banners / Flyers
          </TabsTrigger>
          <TabsTrigger value="descuentos">
            <Tag className="h-4 w-4 mr-1.5" /> Descuentos globales
          </TabsTrigger>
        </TabsList>
        <TabsContent value="banners" className="mt-6">
          <BannersTab />
        </TabsContent>
        <TabsContent value="descuentos" className="mt-6">
          <DiscountsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
