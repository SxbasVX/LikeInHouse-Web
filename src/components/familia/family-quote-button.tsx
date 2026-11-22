"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { QuoteRequestDialog } from "@/components/public/quote-request-form";

// Botón que abre el formulario de cotización con el mensaje de WhatsApp familiar.
export function FamilyQuoteButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const t = useTranslations("familia");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <QuoteRequestDialog open={open} onOpenChange={setOpen} whatsappText={t("cta_whatsapp_message")} />
    </>
  );
}
