"use client";

import dynamic from "next/dynamic";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadPDFButtonProps {
    data: any;
    isEs: boolean;
    className?: string;
    variant?: "default" | "outline" | "secondary" | "ghost";
}

// Dynamically import the PDFDownloadLink to avoid SSR issues with Node APIs on the browser
const PDFDownloadBtnDynamic = dynamic<DownloadPDFButtonProps>(
    // @ts-ignore
    () => import("./pdf-download-inner"),
    {
        ssr: false,
        loading: () => (
            <Button disabled variant="ghost" size="sm" className="gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Cargando...
            </Button>
        ),
    }
);

export function DownloadPDFButton(props: DownloadPDFButtonProps) {
    return (
        <PDFDownloadBtnDynamic {...props} />
    );
}
