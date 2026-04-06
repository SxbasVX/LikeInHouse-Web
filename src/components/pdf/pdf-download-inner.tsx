"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { VoucherPDF } from "./voucher-pdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function PDFDownloadInner({ data, isEs, className, variant = "default" }: any) {
    return (
        <PDFDownloadLink
            document={<VoucherPDF data={data} />}
            fileName={`voucher-${data.referenceCode}.pdf`}
            style={{ textDecoration: "none" }}
        >
            {({ loading, error }) => (
                <Button
                    disabled={loading || !!error}
                    variant={variant}
                    className={className || "w-full sm:w-auto h-12 gap-2"}
                    type="button"
                >
                    {loading ? (
                        <>
                            <Download className="h-4 w-4 animate-bounce" />
                            {isEs ? "Generando..." : "Generating..."}
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4" />
                            {isEs ? "Descargar Voucher" : "Download Voucher"}
                        </>
                    )}
                </Button>
            )}
        </PDFDownloadLink>
    );
}
