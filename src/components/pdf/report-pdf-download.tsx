"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { MonthlyReportPDF, TourReportPDF } from "./report-pdf";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface MonthlyPDFProps {
  type: "monthly";
  data: Parameters<typeof MonthlyReportPDF>[0]["data"];
  filename: string;
}

interface TourPDFProps {
  type: "tour";
  data: Parameters<typeof TourReportPDF>[0]["data"];
  filename: string;
}

type ReportPDFDownloadProps = MonthlyPDFProps | TourPDFProps;

export default function ReportPDFDownload(props: ReportPDFDownloadProps) {
  const doc =
    props.type === "monthly" ? (
      <MonthlyReportPDF data={props.data} />
    ) : (
      <TourReportPDF data={props.data} />
    );

  return (
    <PDFDownloadLink document={doc} fileName={`${props.filename}.pdf`}>
      {({ loading, error }) => (
        <Button disabled={loading || !!error} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {loading ? "Generando PDF..." : "Exportar PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
