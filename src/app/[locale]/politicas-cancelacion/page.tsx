import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { buildMetadata } from "@/lib/seo";

type CancellationRow = {
  period: string;
  penalty: string;
};

const CUSCO_UYUNI: CancellationRow[] = [
  { period: "Hasta 30 días antes del viaje", penalty: "25% por gastos administrativos, pago de tickets y hospedajes." },
  { period: "Hasta 20 días antes del viaje", penalty: "40% del monto total pactado de la reserva." },
  { period: "Hasta 10 días antes del viaje", penalty: "60% del monto acordado por el servicio." },
  { period: "Hasta 5 días antes del viaje", penalty: "80% del monto acordado por el servicio." },
  { period: "Un día antes o el mismo día", penalty: "100% del monto total del servicio. No show: no hay devolución." },
];

const PUNO_AREQUIPA_ICA: CancellationRow[] = [
  { period: "Hasta 20 días antes del viaje", penalty: "25% por gastos administrativos, pago de tickets y hospedajes." },
  { period: "Hasta 10 días antes del viaje", penalty: "50% del monto total pactado de la reserva." },
  { period: "Hasta 5 días antes del viaje", penalty: "80% del monto acordado por el servicio." },
  { period: "Un día antes o el mismo día", penalty: "100% del monto total pagado. No show: no hay devolución." },
];

const LIMA_TUMBES: CancellationRow[] = [
  { period: "Hasta 10 días antes del viaje", penalty: "25% por gastos administrativos, pago de tickets y hospedajes." },
  { period: "Hasta 5 días antes del viaje", penalty: "50% del monto total pactado de la reserva." },
  { period: "Hasta 2 días antes del viaje", penalty: "80% del monto acordado por el servicio." },
  { period: "Un día antes o el mismo día", penalty: "100% del monto total pagado. No show: no hay devolución." },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";

  return buildMetadata({
    locale,
    title: isEs ? "Políticas de Cancelación, Reprogramaciones y Reembolso" : "Cancellation, Rescheduling and Refund Policy",
    description: isEs
      ? "Consulta las penalidades y condiciones de cancelación, reprogramación y reembolso de Like In House."
      : "Review Like In House cancellation, rescheduling and refund penalties and conditions.",
    pathByLocale: "/politicas-cancelacion",
  });
}

export default async function PoliticasCancelacionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEs = locale === "es";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-orange"
          >
            <ArrowLeft className="h-4 w-4" />
            {isEs ? "Volver al inicio" : "Back to home"}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8 lg:p-12">
          {isEs ? <CancellationPolicyEs /> : <CancellationPolicyEn />}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {isEs ? "Última actualización: septiembre 2026" : "Last updated: September 2026"}
        </p>
      </div>
    </div>
  );
}

function CancellationPolicyEs() {
  return (
    <article className="prose prose-gray max-w-none prose-headings:font-heading prose-a:text-brand-orange">
      <h1>Políticas de Cancelación, Reprogramaciones y Reembolso</h1>
      <p className="lead">
        Cuando el viaje sea cancelado, y según el tiempo de anticipación, Like In House S.R.L. intentará ofrecer otra alternativa. Si no es aceptada, se devolverá el importe de acuerdo con las siguientes condiciones.
      </p>

      <CancellationTable title="Cusco y Uyuni" rows={CUSCO_UYUNI} />
      <CancellationTable title="Puno, Arequipa, Ica y Nazca" rows={PUNO_AREQUIPA_ICA} />
      <CancellationTable title="Lima, Tumbes y otras ciudades del Perú" rows={LIMA_TUMBES} />

      <p className="not-prose rounded-lg border border-brand-teal/30 bg-brand-teal/10 p-4 text-sm text-brand-darkRed">
        <strong>Importante:</strong> Los porcentajes de penalidad no incluyen gastos financieros asociados a transferencias bancarias, comisiones de tarjetas de crédito u otros gastos y costos relacionados con la devolución.
      </p>

      <h2>Reprogramaciones y modificaciones</h2>
      <ul>
        <li>Una vez cerrada la venta, cualquier corrección de datos está sujeta a una penalidad del 10% de la tarifa más gastos administrativos.</li>
        <li>La reprogramación solicitada por el cliente procede si no existen saldos pendientes, el proveedor lo permite y no hay diferencia tarifaria para la nueva fecha.</li>
        <li>Si el pasajero cambia un tour por otro de mayor costo durante el servicio, debe pagar la diferencia. Si elige uno de menor costo, la diferencia no es reembolsable.</li>
        <li>No se concede devolución por ausencia del turista, cancelación durante el viaje o servicios no utilizados dentro de un paquete.</li>
        <li>Los servicios de hoteles, buses o trenes ya emitidos no son reembolsables.</li>
      </ul>

      <h2>Fuerza mayor y proveedores</h2>
      <p>
        Algunos servicios pueden interrumpirse o cancelarse por condiciones climáticas, fuerza mayor u otras causas fuera del control de hoteles, líneas aéreas, proveedores u operadores asociados. Las alternativas y condiciones dependerán de cada proveedor.
      </p>

      <h2>Cómo solicitar una cancelación o reembolso</h2>
      <p>
        Las solicitudes deben enviarse a <a href="mailto:gerencia@likeinhouseperu.com">gerencia@likeinhouseperu.com</a> indicando el código de reserva y los datos del pasajero.
      </p>

      <h2>Tiempos de procesamiento</h2>
      <ul>
        <li>Los pagos realizados con tarjeta se reembolsan por la misma vía y los tiempos dependen de la entidad bancaria.</li>
        <li>Los pagos por depósito o efectivo se reembolsan mediante transferencia bancaria a nombre de la empresa.</li>
        <li>El trámite de reembolso por depósito o efectivo demora en promedio entre 10 y 15 días útiles, sin contar fines de semana ni feriados.</li>
      </ul>
    </article>
  );
}

function CancellationPolicyEn() {
  return (
    <article className="prose prose-gray max-w-none prose-headings:font-heading prose-a:text-brand-orange">
      <h1>Cancellation, Rescheduling and Refund Policy</h1>
      <p className="lead">
        When a trip is cancelled, Like In House S.R.L. will try to offer an alternative according to the notice period. If the alternative is not accepted, the refund is calculated under the conditions below.
      </p>

      <CancellationTable title="Cusco and Uyuni" rows={CUSCO_UYUNI} />
      <CancellationTable title="Puno, Arequipa, Ica and Nazca" rows={PUNO_AREQUIPA_ICA} />
      <CancellationTable title="Lima, Tumbes and other cities in Peru" rows={LIMA_TUMBES} />

      <p className="not-prose rounded-lg border border-brand-teal/30 bg-brand-teal/10 p-4 text-sm text-brand-darkRed">
        <strong>Important:</strong> Penalties do not include bank transfer costs, credit card commissions or other costs related to the refund.
      </p>

      <h2>Rescheduling and changes</h2>
      <ul>
        <li>After a sale is closed, correcting passenger details carries a 10% fee plus administrative costs.</li>
        <li>Customer-requested rescheduling is subject to no outstanding balance, supplier approval and no fare difference for the new date.</li>
        <li>No refund is granted for no-shows, cancellations during the trip or unused services within a package.</li>
        <li>Hotels, buses or trains already issued are non-refundable.</li>
      </ul>

      <h2>Requesting a cancellation or refund</h2>
      <p>
        Send requests to <a href="mailto:gerencia@likeinhouseperu.com">gerencia@likeinhouseperu.com</a> with the booking code and passenger details.
      </p>

      <h2>Processing times</h2>
      <ul>
        <li>Card payments are refunded through the same card; timing depends on the bank.</li>
        <li>Deposits and cash payments are refunded by bank transfer to the company account.</li>
        <li>Cash or deposit refunds generally take 10 to 15 business days, excluding weekends and holidays.</li>
      </ul>
    </article>
  );
}

function CancellationTable({ title, rows }: { title: string; rows: CancellationRow[] }) {
  return (
    <section className="not-prose my-8 overflow-hidden rounded-xl border border-brand-teal/30">
      <h2 className="bg-brand-teal px-4 py-3 text-lg font-bold uppercase tracking-wide text-white sm:px-5">
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm sm:text-base">
          <thead className="bg-brand-teal/90 text-white">
            <tr>
              <th className="w-2/5 border-r border-white/40 px-4 py-3 font-bold">Cancellation notice</th>
              <th className="px-4 py-3 font-bold">Penalty</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.period} className="odd:bg-[#fff0e7] even:bg-white">
                <td className="border-t border-white px-4 py-3 font-medium">{row.period}</td>
                <td className="border-t border-white px-4 py-3">{row.penalty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
