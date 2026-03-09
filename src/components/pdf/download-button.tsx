"use client";

import dynamic from "next/dynamic";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import the PDFDownloadLink to avoid SSR issues with Node APIs on the browser
const PDFDownloadBtnDynamic = dynamic<DownloadPDFButtonProps>(
    // @ts-ignore
    () => import("./pdf-download-inner"),
    {
        ssr: false,
        loading: () => (
            <Button disabled variant="outline" className="w-full sm:w-auto h-12 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando PDF...
            </Button>
        ),
    }
);

interface DownloadPDFButtonProps {
    data: any;
    isEs: boolean;
    className?: string;
    variant?: "default" | "outline" | "secondary" | "ghost";
}

export function DownloadPDFButton(props: DownloadPDFButtonProps) {
    return (
        <PDFDownloadBtnDynamic {...props} />
    );
}
