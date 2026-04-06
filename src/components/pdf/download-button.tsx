"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

interface DownloadPDFButtonProps {
    data: any;
    isEs: boolean;
    className?: string;
    variant?: string;
}

const PDFDownloadBtnDynamic = dynamic<DownloadPDFButtonProps>(
    // @ts-ignore
    () => import("./pdf-download-inner"),
    {
        ssr: false,
        loading: () => (
            <span className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Cargando...
            </span>
        ),
    }
);

export function DownloadPDFButton(props: DownloadPDFButtonProps) {
    return <PDFDownloadBtnDynamic {...props} />;
}
