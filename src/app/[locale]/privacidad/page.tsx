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
    title: isEs ? "Política de Privacidad" : "Privacy Policy",
    description: isEs
      ? "Conoce cómo Like In House trata y protege tus datos personales conforme a la Ley N° 29733."
      : "Learn how Like In House handles and protects your personal data under Law N° 29733.",
    pathByLocale: "/privacidad",
  });
}

export default async function PrivacidadPage({
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
          {isEs ? <PrivacidadEs /> : <PrivacidadEn />}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          {isEs ? "Última actualización: enero 2025" : "Last updated: January 2025"}
        </p>
      </div>
    </div>
  );
}

function PrivacidadEs() {
  return (
    <article className="prose prose-gray max-w-none prose-headings:font-heading prose-a:text-brand-orange">
      <h1>Política de Privacidad</h1>
      <p className="lead">
        En Like In House nos comprometemos a proteger la privacidad de nuestros clientes. Esta política explica qué datos recopilamos, cómo los usamos y tus derechos al respecto.
      </p>

      <h2>1. Datos que Recopilamos</h2>
      <p>Recopilamos los siguientes tipos de datos personales:</p>
      <ul>
        <li><strong>Datos de identificación:</strong> Nombre, DNI/pasaporte, fecha de nacimiento.</li>
        <li><strong>Datos de contacto:</strong> Email, teléfono, país de origen.</li>
        <li><strong>Datos de pago:</strong> Procesados de forma segura a través de pasarelas certificadas (no almacenamos datos de tarjetas).</li>
        <li><strong>Datos de navegación:</strong> Cookies técnicas y de analítica para mejorar la experiencia en nuestro sitio.</li>
      </ul>

      <h2>2. Finalidad del Tratamiento</h2>
      <p>Usamos tus datos para:</p>
      <ul>
        <li>Gestionar y confirmar tus reservas de tours.</li>
        <li>Enviarte información relevante sobre tu viaje.</li>
        <li>Cumplir con obligaciones legales y fiscales.</li>
        <li>Mejorar nuestros servicios y atención al cliente.</li>
        <li>Enviarte comunicaciones de marketing (solo con tu consentimiento explícito).</li>
      </ul>

      <h2>3. Base Legal</h2>
      <p>
        El tratamiento de tus datos se basa en la ejecución del contrato de servicios turísticos, el cumplimiento de obligaciones legales, y en los casos de marketing, en tu consentimiento expreso.
      </p>

      <h2>4. Compartir con Terceros</h2>
      <p>
        Podemos compartir tus datos con:
      </p>
      <ul>
        <li>Proveedores de servicios (hoteles, transportistas, guías) estrictamente necesarios para prestar el tour.</li>
        <li>Plataformas de pago certificadas (Culqi, PayPal).</li>
        <li>Autoridades gubernamentales cuando sea requerido por ley.</li>
      </ul>
      <p>No vendemos ni cedemos tus datos a terceros con fines comerciales.</p>

      <h2>5. Conservación de Datos</h2>
      <p>
        Conservamos tus datos durante el tiempo necesario para prestar el servicio y cumplir con las obligaciones legales (mínimo 5 años para registros fiscales según la legislación peruana).
      </p>

      <h2>6. Tus Derechos (Ley N° 29733)</h2>
      <p>De acuerdo con la Ley de Protección de Datos Personales de Perú, tienes derecho a:</p>
      <ul>
        <li><strong>Acceso:</strong> Saber qué datos tenemos sobre ti.</li>
        <li><strong>Rectificación:</strong> Corregir datos inexactos.</li>
        <li><strong>Cancelación:</strong> Solicitar la eliminación de tus datos.</li>
        <li><strong>Oposición:</strong> Oponerte al tratamiento de tus datos.</li>
      </ul>
      <p>
        Para ejercer tus derechos, escríbenos a{" "}
        <a href="mailto:privacidad@likeinhouse.com">privacidad@likeinhouse.com</a>.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Utilizamos cookies técnicas imprescindibles para el funcionamiento del sitio y cookies de analítica (Google Analytics) para entender cómo los usuarios interactúan con nuestra web. Puedes desactivar las cookies de analítica desde la configuración de tu navegador.
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado HTTPS, acceso restringido por roles, y almacenamiento seguro en servidores certificados.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Para cualquier consulta sobre privacidad contacta a nuestro responsable de datos:{" "}
        <a href="mailto:privacidad@likeinhouse.com">privacidad@likeinhouse.com</a>
        {" "}| Like In House, Bellavista B-9-A, Cusco, Perú.
      </p>
    </article>
  );
}

function PrivacidadEn() {
  return (
    <article className="prose prose-gray max-w-none prose-headings:font-heading prose-a:text-brand-orange">
      <h1>Privacy Policy</h1>
      <p className="lead">
        At Like In House we are committed to protecting our clients' privacy. This policy explains what data we collect, how we use it, and your rights.
      </p>

      <h2>1. Data We Collect</h2>
      <p>We collect the following types of personal data:</p>
      <ul>
        <li><strong>Identification data:</strong> Name, ID/passport, date of birth.</li>
        <li><strong>Contact data:</strong> Email, phone, country of origin.</li>
        <li><strong>Payment data:</strong> Processed securely through certified gateways (we do not store card details).</li>
        <li><strong>Browsing data:</strong> Technical and analytics cookies to improve your site experience.</li>
      </ul>

      <h2>2. Purpose of Processing</h2>
      <p>We use your data to:</p>
      <ul>
        <li>Manage and confirm your tour bookings.</li>
        <li>Send you relevant information about your trip.</li>
        <li>Comply with legal and tax obligations.</li>
        <li>Improve our services and customer support.</li>
        <li>Send marketing communications (only with your explicit consent).</li>
      </ul>

      <h2>3. Legal Basis</h2>
      <p>
        Data processing is based on the execution of the tourism services contract, compliance with legal obligations, and in marketing cases, your express consent.
      </p>

      <h2>4. Sharing with Third Parties</h2>
      <p>We may share your data with:</p>
      <ul>
        <li>Service providers (hotels, transport, guides) strictly necessary to deliver the tour.</li>
        <li>Certified payment platforms (Culqi, PayPal).</li>
        <li>Government authorities when required by law.</li>
      </ul>
      <p>We do not sell or transfer your data to third parties for commercial purposes.</p>

      <h2>5. Data Retention</h2>
      <p>
        We retain your data for the time necessary to provide the service and comply with legal obligations (minimum 5 years for tax records under Peruvian law).
      </p>

      <h2>6. Your Rights (Law N° 29733)</h2>
      <p>Under Peru's Personal Data Protection Law, you have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Know what data we hold about you.</li>
        <li><strong>Rectification:</strong> Correct inaccurate data.</li>
        <li><strong>Cancellation:</strong> Request deletion of your data.</li>
        <li><strong>Opposition:</strong> Object to the processing of your data.</li>
      </ul>
      <p>
        To exercise your rights, email{" "}
        <a href="mailto:privacidad@likeinhouse.com">privacidad@likeinhouse.com</a>.
      </p>

      <h2>7. Cookies</h2>
      <p>
        We use essential technical cookies for site functionality and analytics cookies (Google Analytics) to understand how users interact with our site. You can disable analytics cookies in your browser settings.
      </p>

      <h2>8. Security</h2>
      <p>
        We implement technical and organizational measures to protect your data: HTTPS encryption, role-based access control, and secure storage on certified servers.
      </p>

      <h2>9. Contact</h2>
      <p>
        For any privacy queries, contact our data controller:{" "}
        <a href="mailto:privacidad@likeinhouse.com">privacidad@likeinhouse.com</a>
        {" "}| Like In House, Bellavista B-9-A, Cusco, Peru.
      </p>
    </article>
  );
}
