import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale === "es";
  return {
    title: isEs ? "Términos y Condiciones | Like In House" : "Terms and Conditions | Like In House",
    description: isEs
      ? "Conoce los términos y condiciones del servicio de Like In House, agencia de turismo en Perú."
      : "Read the terms and conditions of Like In House, a Peru tourism agency.",
  };
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

      {/* Contenido */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-12">
          {isEs ? <TerminosEs /> : <TerminosEn />}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          {isEs ? "Última actualización: enero 2025" : "Last updated: January 2025"}
        </p>
      </div>
    </div>
  );
}

function TerminosEs() {
  return (
    <article className="prose prose-gray max-w-none prose-headings:font-heading prose-a:text-brand-orange">
      <h1>Términos y Condiciones</h1>
      <p className="lead">
        Bienvenido a Like In House. Al contratar nuestros servicios turísticos, aceptas los siguientes términos y condiciones.
      </p>

      <h2>1. Reservas y Pagos</h2>
      <p>
        Para confirmar una reserva se requiere un depósito del 30% del costo total del tour. El saldo restante debe abonarse con al menos 48 horas de anticipación a la fecha de inicio del tour.
      </p>
      <p>
        Los pagos pueden realizarse mediante transferencia bancaria, tarjeta de crédito/débito a través de nuestra plataforma o pago en efectivo en nuestra oficina.
      </p>

      <h2>2. Política de Cancelación</h2>
      <ul>
        <li><strong>Cancelación con más de 15 días de anticipación:</strong> Reembolso del 90% del monto pagado.</li>
        <li><strong>Cancelación entre 8 y 15 días de anticipación:</strong> Reembolso del 50% del monto pagado.</li>
        <li><strong>Cancelación con menos de 7 días:</strong> No se realizan reembolsos. Se puede reagendar el tour sujeto a disponibilidad.</li>
        <li><strong>No presentación (No Show):</strong> Sin reembolso.</li>
      </ul>

      <h2>3. Modificaciones de Itinerario</h2>
      <p>
        Like In House se reserva el derecho de modificar itinerarios por razones de fuerza mayor, condiciones climáticas adversas, o factores fuera de nuestro control. En tal caso, se ofrecerán alternativas equivalentes sin costo adicional.
      </p>

      <h2>4. Responsabilidades del Pasajero</h2>
      <ul>
        <li>Presentarse en el punto de encuentro a la hora indicada.</li>
        <li>Portar los documentos de identidad vigentes.</li>
        <li>Informar previamente sobre condiciones médicas relevantes.</li>
        <li>Respetar las indicaciones del guía y las normas de los atractivos turísticos.</li>
        <li>Contratar un seguro de viaje (recomendado).</li>
      </ul>

      <h2>5. Menores de Edad</h2>
      <p>
        Los menores de edad deben estar acompañados por un adulto responsable. Para menores viajando con un solo progenitor o tutor, se puede requerir documentación adicional.
      </p>

      <h2>6. Seguro y Salud</h2>
      <p>
        Like In House no es responsable de accidentes, enfermedades o pérdida de equipaje durante los tours. Recomendamos ampliamente contratar un seguro de viaje que cubra asistencia médica y repatriación.
      </p>

      <h2>7. Fotografías y Material Audiovisual</h2>
      <p>
        Al participar en nuestros tours autorizas a Like In House a utilizar fotografías y videos en los que aparezcas para fines promocionales, a menos que indiques expresamente lo contrario.
      </p>

      <h2>8. Ley Aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia será resuelta ante los tribunales de la ciudad del Cusco.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Para consultas sobre estos términos puedes escribirnos a{" "}
        <a href="mailto:info@likeinhouse.com">info@likeinhouse.com</a> o
        comunicarte a través de WhatsApp al <strong>+51 913 406 888</strong>.
      </p>
    </article>
  );
}

function TerminosEn() {
  return (
    <article className="prose prose-gray max-w-none prose-headings:font-heading prose-a:text-brand-orange">
      <h1>Terms and Conditions</h1>
      <p className="lead">
        Welcome to Like In House. By booking our tourism services, you accept the following terms and conditions.
      </p>

      <h2>1. Bookings and Payments</h2>
      <p>
        A deposit of 30% of the total tour cost is required to confirm a booking. The remaining balance must be paid at least 48 hours before the tour start date.
      </p>
      <p>
        Payments can be made via bank transfer, credit/debit card through our platform, or cash at our office.
      </p>

      <h2>2. Cancellation Policy</h2>
      <ul>
        <li><strong>Cancellation more than 15 days in advance:</strong> 90% refund of the amount paid.</li>
        <li><strong>Cancellation 8–15 days in advance:</strong> 50% refund of the amount paid.</li>
        <li><strong>Cancellation less than 7 days:</strong> No refunds. Tour may be rescheduled subject to availability.</li>
        <li><strong>No Show:</strong> No refund.</li>
      </ul>

      <h2>3. Itinerary Changes</h2>
      <p>
        Like In House reserves the right to modify itineraries due to force majeure, adverse weather conditions, or factors beyond our control. Equivalent alternatives will be offered at no additional cost.
      </p>

      <h2>4. Passenger Responsibilities</h2>
      <ul>
        <li>Arrive at the meeting point at the indicated time.</li>
        <li>Carry valid identity documents.</li>
        <li>Inform us in advance of relevant medical conditions.</li>
        <li>Follow guide instructions and tourist site regulations.</li>
        <li>Purchase travel insurance (recommended).</li>
      </ul>

      <h2>5. Minors</h2>
      <p>
        Minors must be accompanied by a responsible adult. Additional documentation may be required for minors traveling with only one parent or guardian.
      </p>

      <h2>6. Insurance and Health</h2>
      <p>
        Like In House is not responsible for accidents, illness, or loss of luggage during tours. We strongly recommend purchasing travel insurance covering medical assistance and repatriation.
      </p>

      <h2>7. Photos and Media</h2>
      <p>
        By participating in our tours you authorize Like In House to use photos and videos in which you appear for promotional purposes, unless you explicitly indicate otherwise.
      </p>

      <h2>8. Applicable Law</h2>
      <p>
        These terms are governed by the laws of the Republic of Peru. Any disputes will be resolved before the courts of the city of Cusco.
      </p>

      <h2>9. Contact</h2>
      <p>
        For questions about these terms, write to{" "}
        <a href="mailto:info@likeinhouse.com">info@likeinhouse.com</a> or
        contact us via WhatsApp at <strong>+51 913 406 888</strong>.
      </p>
    </article>
  );
}
