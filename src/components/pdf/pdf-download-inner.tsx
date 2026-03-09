"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { VoucherPDF } from "./voucher-pdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function PDFDownloadInner({ data, isEs, className, variant = "default" }: any) {
    return (
        <PDFDownloadLink
            document={<VoucherPDF data={data} />}
            fileName={`comprobante-${data.referenceCode}.pdf`}
            className={className}
        >
            {({ blob, url, loading, error }) => (
                <Button
                    disabled={loading || !!error}
                    variant={variant}
                    className={`w-full sm:w-auto h-12 gap-2 ${className || ""}`}
                >
                    {loading ? (
                        <>
                            <Download className="h-4 w-4 animate-bounce" />
                            {isEs ? "Generando..." : "Generating..."}
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4" />
                            {isEs ? "Descargar PDF" : "Download PDF"}
                        </>
                    )}
                </Button>
            )}
        </PDFDownloadLink>
    );
}
