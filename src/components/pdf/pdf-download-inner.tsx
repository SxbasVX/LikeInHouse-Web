"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { VoucherPDF } from "./voucher-pdf";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PDFDownloadInner({ data, isEs, className, variant = "ghost" }: any) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        try {
            setLoading(true);
            const blob = await pdf(<VoucherPDF data={data} />).toBlob();
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
