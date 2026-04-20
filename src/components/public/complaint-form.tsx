"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  locale: "es" | "en";
}

const t = (locale: "es" | "en") => ({
  // Section titles
  consumerData: locale === "es" ? "1. Identificación del consumidor" : "1. Consumer identification",
  itemData: locale === "es" ? "2. Identificación del bien o servicio contratado" : "2. Product or service contracted",
  complaintData: locale === "es" ? "3. Detalle de la reclamación" : "3. Complaint details",
  // Fields
  name: locale === "es" ? "Nombre completo" : "Full name",
  docType: locale === "es" ? "Tipo de documento" : "ID type",
  docNum: locale === "es" ? "Número de documento" : "ID number",
  address: locale === "es" ? "Domicilio" : "Address",
  phone: locale === "es" ? "Teléfono" : "Phone",
  phoneOpt: locale === "es" ? "(opcional)" : "(optional)",
  email: locale === "es" ? "Correo electrónico" : "Email",
  isMinor: locale === "es" ? "El consumidor es menor de edad" : "Consumer is a minor",
  guardianName: locale === "es" ? "Nombre del padre/madre/tutor" : "Parent/guardian name",
  guardianDoc: locale === "es" ? "DNI del padre/madre/tutor" : "Guardian ID number",
  itemType: locale === "es" ? "Tipo" : "Type",
  product: locale === "es" ? "Producto" : "Product",
  service: locale === "es" ? "Servicio" : "Service",
  itemDesc: locale === "es" ? "Descripción del bien o servicio" : "Product or service description",
  amount: locale === "es" ? "Monto reclamado" : "Claimed amount",
  amountOpt: locale === "es" ? "(opcional)" : "(optional)",
  currency: locale === "es" ? "Moneda" : "Currency",
  type: locale === "es" ? "Tipo" : "Type",
  reclamo: locale === "es" ? "Reclamo (producto/servicio)" : "Complaint (product/service)",
  queja: locale === "es" ? "Queja (atención al cliente)" : "Grievance (customer service)",
  detail: locale === "es" ? "Detalle de lo sucedido" : "Details of what happened",
  request: locale === "es" ? "Pedido del consumidor" : "Consumer's request",
  submit: locale === "es" ? "Enviar registro" : "Submit",
  sending: locale === "es" ? "Enviando..." : "Sending...",
  required: locale === "es" ? "Campo obligatorio" : "Required field",
  legalNote: locale === "es"
    ? "La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI. El proveedor deberá dar respuesta en un plazo no mayor a treinta (30) días calendario, conforme al D.S. 011-2011-PCM."
    : "Filing a complaint does not prevent you from seeking other dispute resolution channels nor is it a prerequisite for filing a complaint with INDECOPI. The provider must respond within no more than thirty (30) calendar days, in accordance with D.S. 011-2011-PCM.",
  successTitle: locale === "es" ? "¡Registro completado!" : "Submission received!",
  successDesc: (code: string) => locale === "es"
    ? `Hemos recibido tu registro con código ${code}. Te hemos enviado una constancia a tu correo electrónico. Recibirás respuesta en un plazo máximo de 30 días calendario.`
    : `We have received your submission with code ${code}. We have sent a receipt to your email. You will receive a response within a maximum of 30 calendar days.`,
  newSubmission: locale === "es" ? "Hacer otro registro" : "Submit another",
  errorTitle: locale === "es" ? "Error al enviar" : "Submission error",
});

export function ComplaintForm({ locale }: Props) {
  const L = t(locale);
  const { toast } = useToast();
  const [success, setSuccess] = useState<{ code: string } | null>(null);

  const [form, setForm] = useState({
    consumerName: "",
    consumerDocType: "DNI" as "DNI" | "CE" | "PASAPORTE" | "RUC",
    consumerDocNum: "",
    consumerAddress: "",
    consumerPhone: "",
    consumerEmail: "",
    isMinor: false,
    guardianName: "",
    guardianDocNum: "",
    itemType: "SERVICIO" as "PRODUCTO" | "SERVICIO",
    itemDescription: "",
    amountClaimed: "",
    currency: "PEN" as "PEN" | "USD",
    type: "RECLAMO" as "RECLAMO" | "QUEJA",
    detail: "",
    request: "",
  });

  const createMutation = trpc.complaint.create.useMutation({
    onSuccess: (data) => {
      setSuccess({ code: data.code });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err) => {
      toast({
        title: L.errorTitle,
        description: err.message,
        variant: "destructive",
      });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      consumerName: form.consumerName.trim(),
      consumerDocType: form.consumerDocType,
      consumerDocNum: form.consumerDocNum.trim(),
      consumerAddress: form.consumerAddress.trim(),
      consumerPhone: form.consumerPhone.trim() || null,
      consumerEmail: form.consumerEmail.trim().toLowerCase(),
      isMinor: form.isMinor,
      guardianName: form.isMinor ? form.guardianName.trim() : null,
      guardianDocNum: form.isMinor ? form.guardianDocNum.trim() : null,
      itemType: form.itemType,
      itemDescription: form.itemDescription.trim(),
      amountClaimed: form.amountClaimed ? parseFloat(form.amountClaimed) : null,
      currency: form.currency,
      type: form.type,
      detail: form.detail.trim(),
      request: form.request.trim(),
      locale,
    });
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{L.successTitle}</h2>
        <p className="text-gray-600 max-w-xl mx-auto mb-8">{L.successDesc(success.code)}</p>
        <div className="inline-block bg-gray-50 border border-gray-200 rounded-lg px-6 py-3 mb-8">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{locale === "es" ? "Código de registro" : "Submission code"}</p>
          <p className="text-xl font-mono font-semibold text-gray-900">{success.code}</p>
        </div>
        <div>
          <Button
            onClick={() => {
              setSuccess(null);
              setForm({
                consumerName: "",
                consumerDocType: "DNI",
                consumerDocNum: "",
                consumerAddress: "",
                consumerPhone: "",
                consumerEmail: "",
                isMinor: false,
                guardianName: "",
                guardianDocNum: "",
                itemType: "SERVICIO",
                itemDescription: "",
                amountClaimed: "",
                currency: "PEN",
                type: "RECLAMO",
                detail: "",
                request: "",
              });
            }}
            variant="outline"
          >
            {L.newSubmission}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Sección 1: Consumidor */}
      <section className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b">{L.consumerData}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="consumerName">{L.name} *</Label>
            <Input
              id="consumerName"
              required
              maxLength={200}
              value={form.consumerName}
              onChange={(e) => setForm({ ...form, consumerName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="consumerDocType">{L.docType} *</Label>
            <Select
              value={form.consumerDocType}
              onValueChange={(v: any) => setForm({ ...form, consumerDocType: v })}
            >
              <SelectTrigger id="consumerDocType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DNI">DNI</SelectItem>
                <SelectItem value="CE">Carné de Extranjería</SelectItem>
                <SelectItem value="PASAPORTE">{locale === "es" ? "Pasaporte" : "Passport"}</SelectItem>
                <SelectItem value="RUC">RUC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="consumerDocNum">{L.docNum} *</Label>
            <Input
              id="consumerDocNum"
              required
              maxLength={20}
              value={form.consumerDocNum}
              onChange={(e) => setForm({ ...form, consumerDocNum: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="consumerAddress">{L.address} *</Label>
            <Input
              id="consumerAddress"
              required
              maxLength={300}
              value={form.consumerAddress}
              onChange={(e) => setForm({ ...form, consumerAddress: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="consumerEmail">{L.email} *</Label>
            <Input
              id="consumerEmail"
              type="email"
              required
              maxLength={200}
              value={form.consumerEmail}
              onChange={(e) => setForm({ ...form, consumerEmail: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="consumerPhone">{L.phone} <span className="text-muted-foreground">{L.phoneOpt}</span></Label>
            <Input
              id="consumerPhone"
              maxLength={30}
              value={form.consumerPhone}
              onChange={(e) => setForm({ ...form, consumerPhone: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 flex items-start gap-3 pt-2">
            <input
              id="isMinor"
              type="checkbox"
              checked={form.isMinor}
              onChange={(e) => setForm({ ...form, isMinor: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isMinor" className="font-normal cursor-pointer">{L.isMinor}</Label>
          </div>
          {form.isMinor && (
            <>
              <div>
                <Label htmlFor="guardianName">{L.guardianName} *</Label>
                <Input
                  id="guardianName"
                  required={form.isMinor}
                  maxLength={200}
                  value={form.guardianName}
                  onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="guardianDocNum">{L.guardianDoc} *</Label>
                <Input
                  id="guardianDocNum"
                  required={form.isMinor}
                  maxLength={20}
                  value={form.guardianDocNum}
                  onChange={(e) => setForm({ ...form, guardianDocNum: e.target.value })}
                />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Sección 2: Bien o servicio */}
      <section className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b">{L.itemData}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>{L.itemType} *</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="itemType"
                  checked={form.itemType === "PRODUCTO"}
                  onChange={() => setForm({ ...form, itemType: "PRODUCTO" })}
                />
                {L.product}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="itemType"
                  checked={form.itemType === "SERVICIO"}
                  onChange={() => setForm({ ...form, itemType: "SERVICIO" })}
                />
                {L.service}
              </label>
            </div>
          </div>
          <div>
            <Label htmlFor="currency">{L.currency}</Label>
            <Select value={form.currency} onValueChange={(v: any) => setForm({ ...form, currency: v })}>
              <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PEN">PEN (S/)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amountClaimed">{L.amount} <span className="text-muted-foreground text-xs">{L.amountOpt}</span></Label>
            <Input
              id="amountClaimed"
              type="number"
              min="0"
              step="0.01"
              value={form.amountClaimed}
              onChange={(e) => setForm({ ...form, amountClaimed: e.target.value })}
            />
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="itemDescription">{L.itemDesc} *</Label>
            <Textarea
              id="itemDescription"
              required
              rows={3}
              maxLength={2000}
              value={form.itemDescription}
              onChange={(e) => setForm({ ...form, itemDescription: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Sección 3: Detalle */}
      <section className="bg-white rounded-2xl shadow-sm p-6 lg:p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b">{L.complaintData}</h2>
        <div className="space-y-4">
          <div>
            <Label>{L.type} *</Label>
            <div className="flex flex-col gap-3 mt-2">
              <label className={cn(
                "flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                form.type === "RECLAMO" ? "border-brand-orange bg-brand-orange/5" : "border-gray-200"
              )}>
                <input
                  type="radio"
                  name="type"
                  checked={form.type === "RECLAMO"}
                  onChange={() => setForm({ ...form, type: "RECLAMO" })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{L.reclamo}</div>
                  <div className="text-xs text-muted-foreground">{locale === "es" ? "Disconformidad con el bien adquirido o servicio prestado." : "Disagreement about the product or service provided."}</div>
                </div>
              </label>
              <label className={cn(
                "flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors",
                form.type === "QUEJA" ? "border-brand-orange bg-brand-orange/5" : "border-gray-200"
              )}>
                <input
                  type="radio"
                  name="type"
                  checked={form.type === "QUEJA"}
                  onChange={() => setForm({ ...form, type: "QUEJA" })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{L.queja}</div>
                  <div className="text-xs text-muted-foreground">{locale === "es" ? "Malestar respecto a la atención recibida." : "Discomfort regarding the customer service received."}</div>
                </div>
              </label>
            </div>
          </div>
          <div>
            <Label htmlFor="detail">{L.detail} *</Label>
            <Textarea
              id="detail"
              required
              rows={5}
              maxLength={5000}
              value={form.detail}
              onChange={(e) => setForm({ ...form, detail: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="request">{L.request} *</Label>
            <Textarea
              id="request"
              required
              rows={3}
              maxLength={2000}
              value={form.request}
              onChange={(e) => setForm({ ...form, request: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Nota legal */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-900">{L.legalNote}</p>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {L.sending}
            </>
          ) : (
            L.submit
          )}
        </Button>
      </div>
    </form>
  );
}
