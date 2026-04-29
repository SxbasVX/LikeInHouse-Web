import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { ArrowLeft, BookOpen } from "lucide-react";
import { ComplaintForm } from "@/components/public/complaint-form";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";
  return buildMetadata({
    locale,
    title: isEs ? "Libro de Reclamaciones" : "Complaint Book",
    description: isEs
      ? "Registra tu reclamo o queja conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571) del Perú."
      : "Register your complaint or grievance pursuant to Peru's Consumer Protection Code (Law N° 29571).",
    pathByLocale: "/libro-reclamaciones",
  });
}

export default async function LibroReclamacionesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEs = locale === "es";
  const l = (locale === "en" ? "en" : "es") as "es" | "en";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-orange transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {isEs ? "Volver al inicio" : "Back to home"}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                {isEs ? "Libro de Reclamaciones" : "Complaint Book"}
              </h1>
              <p className="text-slate-300 text-sm lg:text-base max-w-2xl">
                {isEs
                  ? "Conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571) y el Reglamento del Libro de Reclamaciones (D.S. 011-2011-PCM y D.S. 058-2021-PCM)."
                  : "In accordance with Peru's Consumer Protection Code (Law N° 29571) and the Complaint Book Regulation (D.S. 011-2011-PCM and D.S. 058-2021-PCM)."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Datos del proveedor */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            {isEs ? "Datos del proveedor" : "Provider information"}
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{isEs ? "Razón social" : "Company"}</dt>
              <dd className="font-medium text-gray-900">Like In House Peru S.A.C.</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">RUC</dt>
              <dd className="font-medium text-gray-900">20612345678</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{isEs ? "Domicilio fiscal" : "Registered address"}</dt>
              <dd className="font-medium text-gray-900">Bellavista B-9-A, Cusco, Perú</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{isEs ? "Correo" : "Email"}</dt>
              <dd className="font-medium text-gray-900">administracion@likeinhouseperu.com</dd>
            </div>
          </dl>
        </div>

        {/* Formulario */}
        <ComplaintForm locale={l} />
      </div>
    </div>
  );
}
