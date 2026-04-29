"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { VoucherPDF, type VoucherProps } from "./voucher-pdf";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface Props {
  data: VoucherProps;
  isEs: boolean;
  className?: string;
  variant?: string;
}

export default function PDFDownloadInner({ data, isEs, className, variant = "ghost" }: Props) {
  const [loading, setLoading] = useState(false);
  // Cargamos settings publicos (cacheados) para inyectar datos reales en el footer.
  const { data: settings } = trpc.public.settings.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
  });

  const handleDownload = async () => {
    try {
      setLoading(true);
      const s = (settings || {}) as Record<string, string>;
      // Resolver la web publica que aparece en el footer.
      // NUNCA debe mostrar subdominios internos (panel.*, admin.*) porque el
      // voucher es de cara al cliente; usamos el dominio raiz publico.
      const stripInternalSubdomain = (host: string) =>
        host.replace(/^(panel|admin|app|dashboard|staging|dev)\./i, "");
      const publicWeb =
        s.companyWeb ||
        (process.env.NEXT_PUBLIC_BASE_URL
          ? stripInternalSubdomain(
              process.env.NEXT_PUBLIC_BASE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")
            )
          : typeof window !== "undefined"
            ? stripInternalSubdomain(window.location.host)
            : "likeinhouseperu.com");

      const enriched: VoucherProps = {
        ...data,
        company: {
          name: "Like In House",
          legalName: s.companyLegalName || "Like In House Peru S.R.L.",
          ruc: s.companyRuc || undefined,
          address: s.address || undefined,
          phone: s.phone || data.company?.phone,
          email: s.contactEmail || data.company?.email,
          web: publicWeb,
          ...(data.company || {}),
        },
      };

      const blob = await pdf(<VoucherPDF data={enriched} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voucher-${data.referenceCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generando PDF:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant as any}
      className={className || "h-8 gap-1.5 px-2.5 text-xs font-medium"}
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {isEs ? "Generando..." : "Generating..."}
        </>
      ) : (
        <>
          <Download className="h-3.5 w-3.5" />
          {isEs ? "Descargar Voucher" : "Download Voucher"}
        </>
      )}
    </Button>
  );
}
