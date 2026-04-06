"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { VoucherPDF } from "./voucher-pdf";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PDFDownloadInner({ data, isEs, className }: any) {
    return (
        <PDFDownloadLink
            document={<VoucherPDF data={data} />}
            fileName={`voucher-${data.referenceCode}.pdf`}
            style={{ textDecoration: "none" }}
        >
            {({ loading, error }) => (
                <span
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                        "hover:bg-accent hover:text-accent-foreground",
                        loading && "opacity-50 pointer-events-none",
                        className || "h-8 px-2.5 text-xs"
                    )}
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
                </span>
            )}
        </PDFDownloadLink>
    );
}
