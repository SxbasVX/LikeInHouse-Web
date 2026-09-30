import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
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
    title: isEs ? "Términos y Condiciones" : "Terms and Conditions",
    description: isEs
      ? "Términos y condiciones del servicio de Like In House, agencia de turismo en Perú. Reservas, pagos y políticas de cancelación."
      : "Terms and conditions of Like In House, a Peru tourism agency. Bookings, payments and cancellation policies.",
    pathByLocale: "/terminos",
  });
}

export default async function TerminosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEs = locale === "es";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-orange transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {isEs ? "Volver al inicio" : "Back to home"}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <iframe
            src="/legal/terminos-condiciones.pdf"
            title={isEs ? "Políticas, términos y condiciones" : "Policies, terms and conditions"}
            className="h-[75vh] min-h-[560px] w-full"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <a
            href="/legal/terminos-condiciones.pdf"
            download
            className="text-sm font-semibold text-brand-orange hover:underline"
          >
            {isEs ? "Descargar PDF" : "Download PDF"}
          </a>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          {isEs ? "Documento original de Like In House" : "Original Like In House document"}
        </p>
      </div>
    </div>
  );
}

function TerminosEs() {
  return (
    <article className="prose prose-gray max-w-none prose-headings:font-heading prose-a:text-brand-orange">
      <h1>Políticas, Términos y Condiciones</h1>
      <p className="lead">
        Es esencial que revise y acepte nuestras políticas, términos y condiciones relacionados con los servicios que ofrecemos.
      </p>

      <h2>De nuestros servicios</h2>
      <ul>
        <li>El agente de viajes brinda información y asesoría, pero no garantiza disponibilidad.</li>
        <li>Los paquetes se elaboran según lo solicitado y se cotizan en dólares o soles al tipo de cambio vigente. No incluyen impuestos de ley para pasajeros peruanos o residentes.</li>
        <li>Por desastres naturales, clima, huelgas, protestas u otras situaciones de fuerza mayor, la reserva puede modificarse, posponerse, cancelarse o reprogramarse para proteger la seguridad de los pasajeros. En estos casos se emitirá una nota de crédito con vigencia de un año, descontando 10% por gastos administrativos.</li>
        <li>Like In House puede actuar como intermediario entre el pasajero y operadores turísticos.</li>
        <li>Las tarifas publicadas no aplican a feriados, fines de semana largos o eventos internacionales, salvo indicación expresa.</li>
        <li>Las reservas de transporte son personales, intransferibles y no reembolsables, y están sujetas a las políticas del transportista.</li>
        <li>El pasajero debe presentarse con la anticipación requerida en la estación o aeropuerto. No asumimos responsabilidad por pérdidas ocasionadas por tardanzas, colas o falta de check-in.</li>
        <li>Para prestar nuestros servicios se debe firmar el consentimiento informado al confirmar la reserva.</li>
      </ul>

      <h2>Políticas de reserva</h2>
      <ul>
        <li>Las reservas de Cusco deben confirmarse con 60 días de anticipación; los grupos de más de 15 personas, con 90 días. Sin Machu Picchu, pueden confirmarse hasta 5 días antes.</li>
        <li>Puno, Arequipa e Ica: 20 días antes; grupos de más de 15 personas, 30 días antes.</li>
        <li>Lima y Tumbes: 10 días antes; grupos de más de 15 personas, 20 días antes.</li>
        <li>La confirmación requiere el pago o depósito de garantía y el voucher correspondiente. El código de reserva se enviará por WhatsApp, correo u otro medio acordado.</li>
        <li>El cliente dispone de 48 horas desde la recepción del voucher para realizar observaciones. Después de ese plazo, o iniciado el servicio, se entiende que existe conformidad.</li>
      </ul>

      <h3>Datos requeridos</h3>
      <p>Enviar el comprobante y los siguientes datos a reservas@likeinhouseperu.com o por WhatsApp al +51 969 815 462 / 991 835 431:</p>
      <ul>
        <li>Tour o servicio, fecha de viaje y número de pasajeros.</li>
        <li>Nombre completo, procedencia, pasaporte del pasajero principal y teléfono de contacto.</li>
        <li>Nombre del agente o asesor de viajes.</li>
      </ul>

      <h2>Políticas de pago</h2>
      <ul>
        <li>El depósito de garantía es del 50% del costo total por persona.</li>
        <li>El saldo debe pagarse hasta 2 días antes del inicio del servicio.</li>
        <li>Para grupos de más de 8 personas: 50% a 60 días, 20% a 30 días y saldo a 2 días.</li>
        <li>Las reservas realizadas con menos de 7 días de anticipación requieren el pago del 100%.</li>
        <li>No se otorga crédito. El incumplimiento del pago final puede ocasionar la cancelación sin reembolso.</li>
        <li>El cliente asume los gastos de transacción, las comisiones bancarias y las diferencias de tipo de cambio.</li>
        <li>Los pagos con tarjeta nacional tienen un recargo del 5% y los internacionales del 5.20%, según el canal de pago.</li>
      </ul>

      <h3>Medios de pago</h3>
      <p>Aceptamos tarjetas Visa, MasterCard, American Express y Diners Club, depósitos y transferencias bancarias, Yape, Plin, QR y POS. Los costos de transacción son asumidos por el cliente.</p>

      <h3>Datos de nuestras cuentas bancarias</h3>
      <ul>
        <li><strong>Interbank, cuenta corriente:</strong> soles 2003004327053; CCI soles 00320000300432705334; dólares 2003004327060; CCI dólares 00320000300432706039.</li>
        <li><strong>BCP, cuenta negocios:</strong> soles 19214745438080; CCI soles 00219211474543808037.</li>
        <li>En ambos casos, el titular es LIKE IN HOUSE SRL.</li>
      </ul>

      <h3>Condiciones para rutas cortas en Lima</h3>
      <ul>
        <li>Las tarifas están expresadas en dólares, son netas y no incluyen IGV. Para solicitar boleta o factura se agrega 18%.</li>
        <li>No aplican a feriados; en Semana Santa, fiestas patrias, Navidad y Año Nuevo se agrega 15%.</li>
        <li>Los city tours se confirman con un mínimo de 2 pasajeros, excepto Lima Colonial y Moderna, Circuito Mágico del Agua y Pachacámac.</li>
        <li>Los recojos se realizan en hoteles céntricos de Barranco, Miraflores y San Isidro, según el tour. Los horarios son referenciales y se confirman la noche anterior.</li>
        <li>El pasajero debe esperar en el lobby desde la hora indicada; la tolerancia es de 5 minutos.</li>
        <li>Las anulaciones y reprogramaciones se aceptan hasta 20 horas antes, excepto Pachacámac, City con cena show y Pachacámac con caballos de paso, que requieren 36 horas.</li>
        <li>Para gestionar una reserva se requieren nombres, documento, fecha, idioma, dirección del hotel y cualquier indicación necesaria para operar el servicio.</li>
      </ul>

      <h2>Responsabilidades y condiciones</h2>
      <ul>
        <li>El pasajero debe contar con pasaporte, visas, seguro, vacunas y demás documentos vigentes.</li>
        <li>Debe informar cualquier condición médica, especialmente si visitará lugares sobre los 4,000 m s. n. m.</li>
        <li>La agencia puede modificar itinerarios por seguridad, clima, fuerza mayor, huelgas o situaciones políticas.</li>
        <li>No somos responsables por pérdida de objetos, vuelos, hospedajes, viajes, accidentes o gastos adicionales ocasionados por hechos fuera de nuestro control.</li>
        <li>Los niños de hasta 5 años no pagan si viajan en brazos de un adulto, excepto en Machu Picchu, donde pagan desde los 3 años. Existen tarifas diferenciadas para niños de 3 a 11 años y juniors de 11 a 17 años.</li>
      </ul>

      <h2>Igualdad e inclusión</h2>
      <p>Promovemos un entorno libre de discriminación, acoso y violencia por género, orientación sexual, identidad, edad, discapacidad, etnia, religión o condición social. Las denuncias serán atendidas de forma confidencial, inmediata y justa.</p>

      <h2>Contacto</h2>
      <p>Para consultas puedes escribirnos a <a href="mailto:reservas@likeinhouseperu.com">reservas@likeinhouseperu.com</a> o comunicarte por WhatsApp al <strong>+51 913 406 888</strong>.</p>
    </article>
  );
}

function TerminosEn() {
  return (
    <article className="prose prose-gray max-w-none prose-headings:font-heading prose-a:text-brand-orange">
      <h1>Policies, Terms and Conditions</h1>
      <p className="lead">
        Please review and accept our policies, terms and conditions before booking our tourism services.
      </p>

      <h2>Services and bookings</h2>
      <p>
        Bookings are confirmed once the required payment or guarantee deposit is received. Confirmation deadlines vary by destination: Cusco requires 60 days, Puno, Arequipa and Ica 20 days, and Lima and Tumbes 10 days. Larger groups require additional notice.
      </p>
      <p>
        We accept cards, bank transfers, deposits, Yape, Plin, QR and POS. Transaction and banking fees, as well as exchange-rate differences, are paid by the customer.
      </p>

      <h2>Cancellation policy</h2>
      <p>Cancellation penalties depend on the destination and the notice period. See the complete <Link href="/politicas-cancelacion">Cancellation, Rescheduling and Refund Policy</Link>.</p>

      <h2>Itinerary changes and force majeure</h2>
      <p>
        Like In House may modify, postpone, cancel or reschedule services because of weather, strikes, protests, natural disasters or other circumstances beyond its control, prioritizing passenger safety.
      </p>

      <h2>Passenger responsibilities</h2>
      <ul>
        <li>Arrive at the meeting point at the indicated time.</li>
        <li>Carry valid identity documents.</li>
        <li>Inform us in advance of relevant medical conditions.</li>
        <li>Follow guide instructions and tourist site regulations.</li>
        <li>Carry valid passports, visas, insurance and other required documents.</li>
        <li>Inform us of relevant medical conditions, especially for high-altitude destinations.</li>
      </ul>

      <h2>Minors and inclusion</h2>
      <p>
        Minors must travel with a parent or responsible adult and may need notarized authorization. We promote an environment free from discrimination, harassment and violence.
      </p>

      <h2>Liability</h2>
      <p>
        Like In House is not responsible for losses, accidents, illness, luggage, missed transport or additional expenses caused by events outside our control. Travel insurance is strongly recommended.
      </p>

      <h2>Applicable law</h2>
      <p>
        These terms are governed by the laws of the Republic of Peru. Any disputes will be resolved before the courts of the city of Cusco.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these terms, write to{" "}
        <a href="mailto:reservas@likeinhouseperu.com">reservas@likeinhouseperu.com</a> or
        contact us via WhatsApp at <strong>+51 913 406 888</strong>.
      </p>
    </article>
  );
}
