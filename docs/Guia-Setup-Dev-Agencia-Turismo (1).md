# Guía de Entorno de Desarrollo — Setup Completo

**Objetivo:** Levantar un entorno local que sea idéntico a producción.  
**Tiempo estimado:** 30-45 minutos la primera vez.

---

## 1. Requisitos Previos

### Software que necesitas instalar

```bash
# 1. Node.js 20 LTS (recomendado vía nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
node -v  # v20.x.x

# 2. Docker Desktop (para PostgreSQL local)
# Descargar de: https://www.docker.com/products/docker-desktop/
# Verificar:
docker --version
docker compose version

# 3. Git
git --version

# 4. Editor: VS Code (recomendado)
# Extensiones esenciales:
#   - Prisma (syntax highlighting + autocompletado)
#   - Tailwind CSS IntelliSense
#   - ESLint
#   - Pretty TypeScript Errors
#   - Thunder Client (para testear APIs manualmente)
```

---

## 2. Crear el Proyecto

```bash
# Crear proyecto Next.js 14 con App Router + TypeScript + Tailwind
npx create-next-app@14 agencia-turismo \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd agencia-turismo

# Instalar dependencias core
npm install @trpc/server@next @trpc/client@next @trpc/react-query@next \
  @trpc/next@next @tanstack/react-query \
  @prisma/client next-auth@beta \
  zod zustand next-intl \
  @tiptap/react @tiptap/starter-kit @tiptap/extension-image \
  @tiptap/extension-link @tiptap/extension-text-align \
  @tiptap/extension-table @tiptap/extension-placeholder \
  resend @react-pdf/renderer \
  cloudinary next-cloudinary \
  photoswipe \
  decimal.js bcryptjs \
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Dependencias de desarrollo
npm install -D prisma @types/bcryptjs tsx

# shadcn/ui (componentes UI)
npx shadcn@latest init
# Seleccionar:
#   Style: Default
#   Base color: Slate
#   CSS variables: Yes

# Instalar componentes shadcn que se van a usar
npx shadcn@latest add button input label card table dialog \
  dropdown-menu select tabs badge separator sheet \
  form toast alert calendar popover command avatar \
  switch textarea tooltip skeleton
```

---

## 3. Base de Datos Local con Docker

### 3.1 docker-compose.yml

Crear en la raíz del proyecto:

```yaml
# docker-compose.yml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    container_name: agencia_db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: agencia
      POSTGRES_PASSWORD: agencia_dev_2026
      POSTGRES_DB: agencia_turismo
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U agencia"]
      interval: 5s
      timeout: 5s
      retries: 5

  # pgAdmin (opcional) — interfaz web para ver la DB
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: agencia_pgadmin
    restart: unless-stopped
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@agencia.com
      PGADMIN_DEFAULT_PASSWORD: admin
    depends_on:
      - db

volumes:
  pgdata:
```

### 3.2 Levantar la base de datos

```bash
# Levantar PostgreSQL + pgAdmin
docker compose up -d

# Verificar que está corriendo
docker compose ps
# Debe mostrar agencia_db como "running (healthy)"

# Acceder a pgAdmin (opcional):
# http://localhost:5050
# Email: admin@agencia.com
# Password: admin
# Agregar servidor: host=db, port=5432, user=agencia, password=agencia_dev_2026
```

---

## 4. Variables de Entorno

### 4.1 Crear .env

```bash
# .env (NO commitear, ya está en .gitignore)

# ═══════════════════════════════════════
# BASE DE DATOS
# ═══════════════════════════════════════
DATABASE_URL="postgresql://agencia:agencia_dev_2026@localhost:5432/agencia_turismo"

# ═══════════════════════════════════════
# NEXTAUTH
# ═══════════════════════════════════════
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-cambiar-en-produccion-generar-con-openssl"

# ═══════════════════════════════════════
# CULQI (MODO TEST)
# ═══════════════════════════════════════
# Crear cuenta gratuita en: https://culqi.com
# Las llaves test las dan al registrarse
CULQI_PUBLIC_KEY="pk_test_xxxxxxxxxxxxxxxx"
CULQI_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxx"
CULQI_WEBHOOK_SECRET=""

# ═══════════════════════════════════════
# PAYPAL (SANDBOX)
# ═══════════════════════════════════════
# Crear app en: https://developer.paypal.com/dashboard/applications/sandbox
PAYPAL_CLIENT_ID="sandbox-client-id"
PAYPAL_CLIENT_SECRET="sandbox-client-secret"
PAYPAL_WEBHOOK_ID=""
PAYPAL_MODE="sandbox"

# ═══════════════════════════════════════
# CLOUDINARY
# ═══════════════════════════════════════
# Crear cuenta gratuita en: https://cloudinary.com
# Dashboard → Account Details
CLOUDINARY_CLOUD_NAME="tu-cloud-name"
CLOUDINARY_API_KEY="tu-api-key"
CLOUDINARY_API_SECRET="tu-api-secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="tu-cloud-name"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="agencia_tours_dev"

# ═══════════════════════════════════════
# RESEND (EMAIL)
# ═══════════════════════════════════════
# Crear cuenta gratuita en: https://resend.com
# En dev, los emails solo se envían a tu email verificado
RESEND_API_KEY="re_test_xxxxxxxx"
EMAIL_FROM="onboarding@resend.dev"
ADMIN_NOTIFICATION_EMAIL="tu-email@gmail.com"

# ═══════════════════════════════════════
# APP
# ═══════════════════════════════════════
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_WHATSAPP_NUMBER="+51999999999"
```

---

## 5. Cuentas Gratuitas que Necesitas Crear

Todas son gratis y tienen modo test/sandbox para desarrollo:

### 5.1 Culqi (pagos nacionales)

```
1. Ir a https://culqi.com
2. Registrarse (necesitas RUC o DNI)
3. Dashboard → Desarrollo → API Keys
4. Copiar pk_test_xxx y sk_test_xxx al .env
5. Tarjetas de prueba:
   - Exitosa:   4111 1111 1111 1111 | CVV: 123 | Exp: cualquier fecha futura
   - Rechazada: 4000 0000 0000 0002 | CVV: 123
   - Yape test: disponible en sandbox
```

### 5.2 PayPal Sandbox

```
1. Ir a https://developer.paypal.com
2. Crear cuenta developer (gratis)
3. Dashboard → Apps & Credentials → Sandbox → Create App
4. Copiar Client ID y Secret al .env
5. Sandbox crea automáticamente cuentas test:
   - Comprador: sb-buyer@personal.example.com
   - Vendedor: sb-seller@business.example.com
   - Las credenciales están en: Sandbox → Accounts
```

### 5.3 Cloudinary (imágenes)

```
1. Ir a https://cloudinary.com → Sign up (gratis)
2. Dashboard → te da Cloud Name, API Key, API Secret
3. Settings → Upload → Add upload preset:
   - Nombre: "agencia_tours_dev"
   - Signing mode: Unsigned (para desarrollo)
   - Folder: "dev/"
   - Allowed formats: jpg, png, webp
   - Max file size: 10MB
   - Eager transformations:
     - c_fill,w_400,h_300,q_auto,f_auto/  (thumbnail)
     - c_fill,w_800,h_600,q_auto,f_auto/  (card)
     - c_limit,w_1920,q_auto,f_auto/      (full)
```

### 5.4 Resend (email)

```
1. Ir a https://resend.com → Sign up (gratis)
2. API Keys → Create API Key
3. En modo gratuito:
   - 100 emails/día
   - Solo puedes enviar a emails verificados
   - Suficiente para desarrollo y testing
4. Para ver los emails enviados: Dashboard → Emails
```

---

## 6. Inicializar Prisma y Base de Datos

### 6.1 Configurar Prisma

```bash
# Inicializar Prisma
npx prisma init

# Esto crea:
# - prisma/schema.prisma
# - .env (ya lo creamos antes)
```

### 6.2 Copiar el Schema

Reemplazar el contenido de `prisma/schema.prisma` con el schema completo de la Especificación Técnica v3.1 (sección 2).

### 6.3 Migrar

```bash
# Crear la primera migración
npx prisma migrate dev --name init

# Esto:
# 1. Crea todas las tablas en PostgreSQL
# 2. Genera el Prisma Client
# 3. Ejecuta el seed si existe

# Verificar que todo se creó bien:
npx prisma studio
# Abre http://localhost:5555 — interfaz visual de la DB
# Deberías ver todas las tablas vacías
```

### 6.4 Crear el Seed

```typescript
// prisma/seed.ts

import { PrismaClient, UserRole, HomeSectionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ═══════════════════════════════════════
  // 1. USUARIO ADMIN
  // ═══════════════════════════════════════
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@agencia.com" },
    update: {},
    create: {
      email: "admin@agencia.com",
      name: "Administrador",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Usuarios de prueba
  const salesPassword = await bcrypt.hash("vendedor123", 12);
  await prisma.user.upsert({
    where: { email: "vendedor@agencia.com" },
    update: {},
    create: {
      email: "vendedor@agencia.com",
      name: "María Vendedora",
      passwordHash: salesPassword,
      role: UserRole.SALES,
      isActive: true,
    },
  });

  const mktPassword = await bcrypt.hash("marketing123", 12);
  await prisma.user.upsert({
    where: { email: "marketing@agencia.com" },
    update: {},
    create: {
      email: "marketing@agencia.com",
      name: "Carlos Marketing",
      passwordHash: mktPassword,
      role: UserRole.MARKETING,
      isActive: true,
    },
  });
  console.log("✅ Test users created");

  // ═══════════════════════════════════════
  // 2. NAVBAR
  // ═══════════════════════════════════════
  const navItems = [
    { labelEs: "Inicio", labelEn: "Home", href: "/", sortOrder: 0 },
    { labelEs: "Tours", labelEn: "Tours", href: "/tours", sortOrder: 1 },
    { labelEs: "Nosotros", labelEn: "About Us", href: "/nosotros", sortOrder: 2 },
    { labelEs: "Blog", labelEn: "Blog", href: "/blog", sortOrder: 3 },
    { labelEs: "Contacto", labelEn: "Contact", href: "/contacto", sortOrder: 4 },
  ];
  for (const item of navItems) {
    await prisma.navItem.create({ data: item });
  }
  console.log("✅ Navbar items created");

  // ═══════════════════════════════════════
  // 3. HOMEPAGE SECTIONS
  // ═══════════════════════════════════════
  const sections = [
    { type: HomeSectionType.HERO, titleEs: "Descubre el Perú", titleEn: "Discover Peru", sortOrder: 0 },
    { type: HomeSectionType.FEATURED_TOURS, titleEs: "Tours Destacados", titleEn: "Featured Tours", sortOrder: 1 },
    { type: HomeSectionType.DESTINATIONS, titleEs: "Destinos Populares", titleEn: "Popular Destinations", sortOrder: 2 },
    { type: HomeSectionType.TESTIMONIALS, titleEs: "Lo que dicen nuestros viajeros", titleEn: "What our travelers say", sortOrder: 3 },
    { type: HomeSectionType.CTA, titleEs: "¿Listo para tu aventura?", titleEn: "Ready for your adventure?", sortOrder: 4 },
    { type: HomeSectionType.BLOG_PREVIEW, titleEs: "Desde el Blog", titleEn: "From the Blog", sortOrder: 5 },
  ];
  for (const section of sections) {
    await prisma.homeSection.create({ data: { ...section, isVisible: true } });
  }
  console.log("✅ Homepage sections created");

  // ═══════════════════════════════════════
  // 4. PÁGINAS DEFAULT
  // ═══════════════════════════════════════
  const pages = [
    {
      slug: "nosotros",
      titleEs: "Sobre Nosotros",
      titleEn: "About Us",
      contentEs: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Somos una agencia de turismo..." }] }] },
      contentEn: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "We are a tourism agency..." }] }] },
      isPublished: true,
    },
    {
      slug: "terminos",
      titleEs: "Términos y Condiciones",
      titleEn: "Terms and Conditions",
      contentEs: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Términos..." }] }] },
      contentEn: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Terms..." }] }] },
      isPublished: true,
    },
    {
      slug: "politica-cancelacion",
      titleEs: "Política de Cancelación",
      titleEn: "Cancellation Policy",
      contentEs: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Política..." }] }] },
      contentEn: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Policy..." }] }] },
      isPublished: true,
    },
  ];
  for (const page of pages) {
    await prisma.page.create({ data: page });
  }
  console.log("✅ Default pages created");

  // ═══════════════════════════════════════
  // 5. EMAIL TEMPLATES
  // ═══════════════════════════════════════
  const emailTemplates = [
    { key: "reservation_confirmed", subjectEs: "Reserva Confirmada - {{tourName}}", subjectEn: "Booking Confirmed - {{tourName}}", variables: ["clientName", "tourName", "departureDate", "referenceCode", "totalAmount"] },
    { key: "reminder_pretrip_7d", subjectEs: "¡Tu viaje es en 7 días! - {{tourName}}", subjectEn: "Your trip is in 7 days! - {{tourName}}", variables: ["clientName", "tourName", "departureDate"] },
    { key: "reminder_pretrip_3d", subjectEs: "¡Tu viaje es en 3 días! - {{tourName}}", subjectEn: "Your trip is in 3 days! - {{tourName}}", variables: ["clientName", "tourName", "departureDate"] },
    { key: "reminder_pretrip_1d", subjectEs: "¡Tu viaje es mañana! - {{tourName}}", subjectEn: "Your trip is tomorrow! - {{tourName}}", variables: ["clientName", "tourName", "departureDate"] },
    { key: "review_request", subjectEs: "¿Cómo fue tu experiencia? - {{tourName}}", subjectEn: "How was your experience? - {{tourName}}", variables: ["clientName", "tourName"] },
    { key: "quotation_sent", subjectEs: "Tu Cotización - {{quotationCode}}", subjectEn: "Your Quote - {{quotationCode}}", variables: ["clientName", "quotationCode", "totalAmount", "validUntil"] },
    { key: "quotation_reminder", subjectEs: "Tu cotización está por vencer - {{quotationCode}}", subjectEn: "Your quote is expiring soon - {{quotationCode}}", variables: ["clientName", "quotationCode", "validUntil"] },
    { key: "balance_reminder", subjectEs: "Recordatorio de saldo pendiente - {{tourName}}", subjectEn: "Balance reminder - {{tourName}}", variables: ["clientName", "tourName", "balanceAmount", "balanceDueDate"] },
  ];
  for (const tmpl of emailTemplates) {
    await prisma.emailTemplate.create({
      data: {
        ...tmpl,
        bodyEs: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: `Template: ${tmpl.key}` }] }] },
        bodyEn: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: `Template: ${tmpl.key}` }] }] },
        isActive: true,
      },
    });
  }
  console.log("✅ Email templates created");

  // ═══════════════════════════════════════
  // 6. SETTINGS
  // ═══════════════════════════════════════
  const settings = [
    { key: "exchange_rate_pen_usd", value: { rate: 3.75, lastUpdated: new Date().toISOString() } },
    { key: "company_name", value: { es: "Agencia de Turismo", en: "Tourism Agency" } },
    { key: "company_phone", value: { number: "+51999999999" } },
    { key: "company_address", value: { es: "Lima, Perú", en: "Lima, Peru" } },
    { key: "deposit_default_percent", value: { percent: 50 } },
    { key: "reminder_days_default", value: { days: 3 } },
    { key: "session_timeout_minutes", value: { minutes: 60 } },
  ];
  for (const setting of settings) {
    await prisma.setting.create({ data: { key: setting.key, value: setting.value } });
  }
  console.log("✅ Settings created");

  // ═══════════════════════════════════════
  // 7. TOUR DE EJEMPLO
  // ═══════════════════════════════════════
  const tour = await prisma.tour.create({
    data: {
      slug: "cusco-magico-4d-3n",
      status: "PUBLISHED",
      isFeatured: true,
      category: "cultural",
      difficulty: "EASY",
      durationDays: 4,
      durationNights: 3,
      destination: "Cusco",
      nameEs: "Cusco Mágico 4 Días / 3 Noches",
      shortDescEs: "Descubre la ciudad imperial, el Valle Sagrado y Machu Picchu en un viaje inolvidable.",
      longDescEs: "Un recorrido completo por los principales atractivos de Cusco y alrededores...",
      nameEn: "Magical Cusco 4 Days / 3 Nights",
      shortDescEn: "Discover the imperial city, Sacred Valley and Machu Picchu in an unforgettable trip.",
      longDescEn: "A complete tour through the main attractions of Cusco and surroundings...",
      metaTitleEs: "Tour Cusco 4 Días - Machu Picchu Incluido | Agencia de Turismo",
      metaDescEs: "Paquete turístico Cusco 4D/3N con Machu Picchu, Valle Sagrado y City Tour. Mejor precio garantizado.",
      metaTitleEn: "Cusco Tour 4 Days - Machu Picchu Included | Tourism Agency",
      metaDescEn: "Cusco tourist package 4D/3N with Machu Picchu, Sacred Valley and City Tour. Best price guaranteed.",
      pricing: {
        create: {
          basePricePenAdult: 1800.00,
          basePriceUsdAdult: 480.00,
          basePricePenChild: 1200.00,
          basePriceUsdChild: 320.00,
          groupDiscountPercent: 10.00,
          groupMinPersons: 4,
          promoDiscountPercent: 15.00,
          promoStartDate: new Date("2026-03-01"),
          promoEndDate: new Date("2026-04-30"),
          promoLabelEs: "¡15% OFF Temporada Baja!",
          promoLabelEn: "15% OFF Low Season!",
        },
      },
      itinerary: {
        create: [
          { dayNumber: 1, titleEs: "Llegada a Cusco + City Tour", titleEn: "Arrival in Cusco + City Tour", descriptionEs: "Recepción en el aeropuerto y traslado al hotel. Por la tarde, City Tour visitando la Plaza de Armas, Catedral, Qoricancha, Sacsayhuamán y más.", descriptionEn: "Airport reception and transfer to hotel. In the afternoon, City Tour visiting Plaza de Armas, Cathedral, Qoricancha, Sacsayhuaman and more." },
          { dayNumber: 2, titleEs: "Valle Sagrado", titleEn: "Sacred Valley", descriptionEs: "Día completo recorriendo Pisac (mercado y ruinas), Ollantaytambo y Chinchero. Almuerzo buffet incluido.", descriptionEn: "Full day touring Pisac (market and ruins), Ollantaytambo and Chinchero. Buffet lunch included." },
          { dayNumber: 3, titleEs: "Machu Picchu", titleEn: "Machu Picchu", descriptionEs: "Tren a Aguas Calientes y bus a Machu Picchu. Tour guiado de 2 horas por la ciudadela. Tiempo libre para explorar.", descriptionEn: "Train to Aguas Calientes and bus to Machu Picchu. 2-hour guided tour of the citadel. Free time to explore." },
          { dayNumber: 4, titleEs: "Día libre + Despedida", titleEn: "Free Day + Departure", descriptionEs: "Mañana libre para compras o visitar el mercado de San Pedro. Traslado al aeropuerto.", descriptionEn: "Free morning for shopping or visiting San Pedro market. Airport transfer." },
        ],
      },
      includes: {
        create: [
          { type: "INCLUDE", textEs: "Hotel 3★ con desayuno", textEn: "3★ hotel with breakfast", sortOrder: 0 },
          { type: "INCLUDE", textEs: "Transporte turístico", textEn: "Tourist transportation", sortOrder: 1 },
          { type: "INCLUDE", textEs: "Guía profesional bilingüe", textEn: "Bilingual professional guide", sortOrder: 2 },
          { type: "INCLUDE", textEs: "Entradas a sitios arqueológicos", textEn: "Archaeological site entrance fees", sortOrder: 3 },
          { type: "INCLUDE", textEs: "Tren a Machu Picchu (Expedition)", textEn: "Train to Machu Picchu (Expedition)", sortOrder: 4 },
          { type: "INCLUDE", textEs: "Bus Aguas Calientes - Machu Picchu - Aguas Calientes", textEn: "Bus Aguas Calientes - Machu Picchu - Aguas Calientes", sortOrder: 5 },
          { type: "INCLUDE", textEs: "Almuerzo buffet en Valle Sagrado", textEn: "Buffet lunch in Sacred Valley", sortOrder: 6 },
          { type: "EXCLUDE", textEs: "Vuelos Lima - Cusco - Lima", textEn: "Flights Lima - Cusco - Lima", sortOrder: 0 },
          { type: "EXCLUDE", textEs: "Almuerzos y cenas no mencionados", textEn: "Lunches and dinners not mentioned", sortOrder: 1 },
          { type: "EXCLUDE", textEs: "Propinas", textEn: "Tips", sortOrder: 2 },
          { type: "EXCLUDE", textEs: "Seguro de viaje", textEn: "Travel insurance", sortOrder: 3 },
        ],
      },
      seasons: {
        create: [
          { name: "Alta", startDate: new Date("2026-06-01"), endDate: new Date("2026-09-30"), surchargePercent: 20.00 },
          { name: "Baja", startDate: new Date("2026-01-01"), endDate: new Date("2026-03-31"), surchargePercent: -10.00 },
        ],
      },
      departures: {
        create: [
          { departureDate: new Date("2026-04-15"), maxCapacity: 20, bookedCount: 12, status: "AVAILABLE" },
          { departureDate: new Date("2026-04-22"), maxCapacity: 20, bookedCount: 18, status: "AVAILABLE" },
          { departureDate: new Date("2026-05-01"), maxCapacity: 15, bookedCount: 3, status: "AVAILABLE" },
          { departureDate: new Date("2026-05-15"), maxCapacity: 20, bookedCount: 20, status: "SOLD_OUT" },
        ],
      },
    },
  });
  console.log("✅ Example tour created:", tour.slug);

  // ═══════════════════════════════════════
  // 8. CLIENTES Y RESERVAS DE EJEMPLO
  // ═══════════════════════════════════════
  const client1 = await prisma.client.create({
    data: { email: "carlos.garcia@gmail.com", firstName: "Carlos", lastName: "García", phone: "+51987654321", country: "PE", language: "es" },
  });

  const client2 = await prisma.client.create({
    data: { email: "sarah.johnson@gmail.com", firstName: "Sarah", lastName: "Johnson", phone: "+14155551234", country: "US", language: "en" },
  });

  const departures = await prisma.tourDeparture.findMany({ where: { tourId: tour.id }, orderBy: { departureDate: "asc" } });

  await prisma.reservation.create({
    data: {
      referenceCode: "RSV-0001",
      status: "PAID",
      origin: "WEB",
      clientId: client1.id,
      tourId: tour.id,
      departureId: departures[0]?.id,
      adults: 2,
      children: 1,
      currency: "PEN",
      totalAmount: 4800.00,
      internalNotes: "Cliente frecuente, segundo viaje con nosotros.",
      payments: {
        create: {
          status: "COMPLETED",
          method: "CULQI_CARD",
          amount: 4800.00,
          currency: "PEN",
          culqiChargeId: "chr_test_xxxxxxxxxx",
          processedAt: new Date(),
        },
      },
    },
  });

  await prisma.reservation.create({
    data: {
      referenceCode: "RSV-0002",
      status: "PENDING",
      origin: "WEB",
      clientId: client2.id,
      tourId: tour.id,
      departureId: departures[1]?.id,
      adults: 2,
      children: 0,
      currency: "USD",
      totalAmount: 960.00,
      depositAmount: 480.00,
      balanceAmount: 480.00,
    },
  });
  console.log("✅ Example clients and reservations created");

  // ═══════════════════════════════════════
  // 9. FAQ DE EJEMPLO
  // ═══════════════════════════════════════
  await prisma.fAQ.createMany({
    data: [
      { questionEs: "¿Qué incluye el tour?", questionEn: "What does the tour include?", answerEs: "Cada tour detalla lo que incluye en su ficha.", answerEn: "Each tour details what's included on its page.", category: "general", sortOrder: 0 },
      { questionEs: "¿Cómo puedo pagar?", questionEn: "How can I pay?", answerEs: "Aceptamos tarjetas Visa/Mastercard, Yape, Plin y PayPal.", answerEn: "We accept Visa/Mastercard, Yape, Plin and PayPal.", category: "pagos", sortOrder: 0 },
      { questionEs: "¿Puedo cancelar mi reserva?", questionEn: "Can I cancel my booking?", answerEs: "Sí, consulta nuestra política de cancelación.", answerEn: "Yes, please check our cancellation policy.", category: "cancelaciones", sortOrder: 0 },
    ],
  });
  console.log("✅ FAQs created");

  // ═══════════════════════════════════════
  // 10. TESTIMONIOS DE EJEMPLO
  // ═══════════════════════════════════════
  await prisma.testimonial.createMany({
    data: [
      { clientName: "Roberto Díaz", country: "PE", tourName: "Cusco Mágico 4D/3N", rating: 5, textEs: "Increíble experiencia, todo muy bien organizado.", textEn: "Incredible experience, everything very well organized.", isApproved: true, isFeatured: true },
      { clientName: "Emma Wilson", country: "US", tourName: "Cusco Mágico 4D/3N", rating: 5, textEs: "Un viaje que cambió mi vida. Machu Picchu es mágico.", textEn: "A trip that changed my life. Machu Picchu is magical.", isApproved: true, isFeatured: true },
    ],
  });
  console.log("✅ Testimonials created");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Test accounts:");
  console.log("   Admin:     admin@agencia.com     / admin123");
  console.log("   Vendedor:  vendedor@agencia.com  / vendedor123");
  console.log("   Marketing: marketing@agencia.com / marketing123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 6.5 Configurar el seed en package.json

```json
// Agregar a package.json:
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 6.6 Ejecutar el seed

```bash
# Ejecutar seed
npx prisma db seed

# Output esperado:
# 🌱 Seeding database...
# ✅ Admin user created: admin@agencia.com
# ✅ Test users created
# ✅ Navbar items created
# ✅ Homepage sections created
# ✅ Default pages created
# ✅ Email templates created
# ✅ Settings created
# ✅ Example tour created: cusco-magico-4d-3n
# ✅ Example clients and reservations created
# ✅ FAQs created
# ✅ Testimonials created
# 🎉 Seed completed!
```

---

## 7. Levantar el Proyecto

```bash
# Desarrollo
npm run dev

# Debería estar corriendo en:
# http://localhost:3000          ← Web pública
# http://localhost:3000/admin    ← Panel admin
# http://localhost:5555          ← Prisma Studio (si lo abriste)
# http://localhost:5050          ← pgAdmin (si lo necesitas)
```

---

## 8. Comandos Útiles del Día a Día

```bash
# ═══════════════════════════════════════
# BASE DE DATOS
# ═══════════════════════════════════════
npx prisma studio              # UI visual de la DB
npx prisma migrate dev         # Crear nueva migración después de cambiar schema
npx prisma migrate reset       # Borrar todo y re-crear (ejecuta seed)
npx prisma generate            # Re-generar client (después de cambiar schema)
npx prisma db push             # Push rápido sin crear migración (dev only)

# ═══════════════════════════════════════
# DOCKER
# ═══════════════════════════════════════
docker compose up -d           # Levantar PostgreSQL
docker compose down            # Parar
docker compose down -v         # Parar y borrar datos (reset total)
docker compose logs db         # Ver logs de PostgreSQL

# ═══════════════════════════════════════
# TESTING
# ═══════════════════════════════════════
# Para testear webhooks de Culqi/PayPal localmente:
# Opción 1: ngrok (expone localhost a internet)
npx ngrok http 3000
# Te da una URL tipo https://abc123.ngrok.io
# Configurar en Culqi/PayPal dashboard:
#   Webhook URL: https://abc123.ngrok.io/api/webhooks/culqi
#   Webhook URL: https://abc123.ngrok.io/api/webhooks/paypal

# Opción 2: Culqi CLI (más simple para Culqi)
# Descargar desde dashboard de Culqi

# ═══════════════════════════════════════
# CLOUDINARY
# ═══════════════════════════════════════
# Para subir imágenes de prueba rápido:
# 1. Buscar fotos gratis en Unsplash (buscar "cusco", "machu picchu", etc.)
# 2. Subirlas desde el panel admin cuando esté listo
# 3. O usar la API de Cloudinary directamente:
#    Dashboard → Media Library → Upload

# ═══════════════════════════════════════
# PRODUCCIÓN (cuando esté listo)
# ═══════════════════════════════════════
npm run build                  # Build de producción
npm start                      # Servir build
```

---

## 9. Diagrama: Dev vs Producción

```
DESARROLLO (tu máquina)              PRODUCCIÓN (Railway)
───────────────────────              ────────────────────

localhost:3000                       agencia.com
      │                                   │
      │                              Cloudflare (DDoS/CDN)
      │                                   │
   Next.js dev server                Next.js (build)
      │                                   │
   Docker PostgreSQL                 Railway PostgreSQL
   localhost:5432                    (red privada)
      │                                   │
   Culqi TEST keys                   Culqi LIVE keys
   PayPal SANDBOX                    PayPal LIVE
   Cloudinary (misma cuenta)         Cloudinary (misma cuenta)
   Resend (test)                     Resend + dominio verificado
                                          │
                                     Cloudflare R2 (backups)

Todo el código es EXACTAMENTE el mismo.
Solo cambian las variables de entorno (.env).
```

---

## 10. Checklist de Verificación

Después del setup, verificar que todo funciona:

```
[ ] Docker corriendo (docker compose ps)
[ ] PostgreSQL accesible (npx prisma studio abre sin error)
[ ] Seed ejecutado (ver datos en Prisma Studio)
[ ] npm run dev funciona sin errores
[ ] localhost:3000 carga
[ ] Cuenta Culqi creada (keys test en .env)
[ ] Cuenta PayPal Developer creada (sandbox keys en .env)
[ ] Cuenta Cloudinary creada (keys en .env, upload preset creado)
[ ] Cuenta Resend creada (API key en .env)
[ ] .env completo (todas las variables tienen valor)
[ ] .gitignore incluye: .env, node_modules, .next
```

---

*Con este setup, el entorno de desarrollo es una réplica exacta de producción. El mismo código, la misma base de datos (PostgreSQL), las mismas APIs (Culqi test, PayPal sandbox, Cloudinary, Resend). La única diferencia son las keys en el .env.*
