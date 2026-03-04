# Especificación Técnica: Plataforma Integral Agencia de Turismo

**Para:** Claude Code — Documento de implementación directa  
**Versión:** 3.1 Técnica  
**Fecha:** Marzo 2026

---

## 1. Arquitectura del Sistema

### 1.1 Stack

```
Framework:        Next.js 14 (App Router)
Lenguaje:         TypeScript (strict mode)
Estilos:          Tailwind CSS 3.4
Componentes UI:   shadcn/ui
API:              tRPC v11 (tipado end-to-end)
ORM:              Prisma 5
Base de Datos:    PostgreSQL 16
Autenticación:    NextAuth.js v5 (Auth.js)
Imágenes:         Cloudinary (SDK Node + Upload Widget)
Pagos:            Culqi JS SDK + PayPal REST API v2
Email:            Resend SDK
PDF:              @react-pdf/renderer
i18n:             next-intl
Editor WYSIWYG:   Tiptap (ProseMirror)
Validación:       Zod
Estado cliente:   Zustand (admin) + React Query (data fetching vía tRPC)
Hosting:          Railway (Hobby)
CDN/Seguridad:    Cloudflare (plan gratuito)
Backups:          Cron en Railway → Cloudflare R2
Repo:             GitHub (main + staging branches)
```

### 1.2 Estructura de Archivos

```
/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── src/
│   ├── app/
│   │   ├── [locale]/                    # next-intl: /es/... y /en/...
│   │   │   ├── layout.tsx               # Layout público con navbar dinámico
│   │   │   ├── page.tsx                 # Homepage
│   │   │   ├── tours/
│   │   │   │   ├── page.tsx             # Catálogo con filtros
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx         # Ficha individual del tour
│   │   │   ├── reservar/
│   │   │   │   └── [tourId]/
│   │   │   │       └── page.tsx         # Checkout (fecha, personas, pago)
│   │   │   ├── pago/
│   │   │   │   └── [token]/
│   │   │   │       └── page.tsx         # Página de link de pago personalizado
│   │   │   ├── cotizar/
│   │   │   │   └── page.tsx             # Formulario tour personalizado
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── nosotros/
│   │   │   │   └── page.tsx
│   │   │   ├── faq/
│   │   │   │   └── page.tsx
│   │   │   └── [...slug]/
│   │   │       └── page.tsx             # Páginas dinámicas creadas desde admin
│   │   │
│   │   ├── admin/                       # Panel de administración
│   │   │   ├── layout.tsx               # Layout admin (sidebar + header + auth guard)
│   │   │   ├── page.tsx                 # Dashboard
│   │   │   ├── tours/
│   │   │   │   ├── page.tsx             # Lista CRUD
│   │   │   │   ├── nuevo/
│   │   │   │   │   └── page.tsx         # Formulario plantilla tour
│   │   │   │   └── [id]/
│   │   │   │       └── editar/
│   │   │   │           └── page.tsx     # Editar tour existente
│   │   │   ├── reservas/
│   │   │   │   ├── page.tsx             # Lista con filtros
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         # Detalle reserva
│   │   │   ├── pagos/
│   │   │   │   └── page.tsx             # Panel verificación pagos
│   │   │   ├── cotizaciones/
│   │   │   │   ├── page.tsx             # Lista cotizaciones
│   │   │   │   ├── nueva/
│   │   │   │   │   └── page.tsx         # Crear cotización
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         # Detalle + generar link pago
│   │   │   ├── clientes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         # Historial del cliente
│   │   │   ├── ocupacion/
│   │   │   │   └── page.tsx             # Calendario + barras ocupación
│   │   │   ├── contenido/
│   │   │   │   ├── paginas/
│   │   │   │   │   ├── page.tsx         # Lista páginas editables
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx     # Editor visual de página
│   │   │   │   ├── navbar/
│   │   │   │   │   └── page.tsx         # Gestor menú navegación
│   │   │   │   ├── homepage/
│   │   │   │   │   └── page.tsx         # Editor secciones homepage
│   │   │   │   └── blog/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx     # Editor de blog post
│   │   │   ├── galeria/
│   │   │   │   └── page.tsx             # Gestor de medios (Cloudinary)
│   │   │   └── usuarios/
│   │   │       └── page.tsx             # CRUD usuarios + roles
│   │   │
│   │   └── api/
│   │       ├── trpc/
│   │       │   └── [trpc]/
│   │       │       └── route.ts         # Handler tRPC
│   │       ├── webhooks/
│   │       │   ├── culqi/
│   │       │   │   └── route.ts         # Webhook Culqi (POST)
│   │       │   └── paypal/
│   │       │       └── route.ts         # Webhook PayPal (POST)
│   │       ├── upload/
│   │       │   └── route.ts             # Firma upload Cloudinary
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts
│   │
│   ├── server/
│   │   ├── trpc/
│   │   │   ├── root.ts                  # App router: merge de todos los routers
│   │   │   ├── trpc.ts                  # Inicialización tRPC + middleware auth
│   │   │   └── routers/
│   │   │       ├── tour.ts
│   │   │       ├── reservation.ts
│   │   │       ├── payment.ts
│   │   │       ├── quotation.ts
│   │   │       ├── paymentLink.ts
│   │   │       ├── client.ts
│   │   │       ├── content.ts           # Páginas, navbar, homepage, blog
│   │   │       ├── media.ts             # Cloudinary operations
│   │   │       ├── occupancy.ts
│   │   │       ├── user.ts
│   │   │       ├── email.ts
│   │   │       └── dashboard.ts
│   │   │
│   │   ├── services/
│   │   │   ├── culqi.ts                 # Culqi API wrapper
│   │   │   ├── paypal.ts                # PayPal API wrapper
│   │   │   ├── cloudinary.ts            # Upload, delete, transform
│   │   │   ├── email.ts                 # Resend: templates + envío
│   │   │   ├── pdf.ts                   # Generar voucher + cotización PDF
│   │   │   └── pricing.ts              # Motor de cálculo de precios
│   │   │
│   │   └── lib/
│   │       ├── db.ts                    # Prisma client singleton
│   │       ├── auth.ts                  # NextAuth config
│   │       ├── rate-limit.ts
│   │       ├── webhook-verify.ts        # Verificar firmas Culqi/PayPal
│   │       └── audit-log.ts             # Registro de actividad
│   │
│   ├── components/
│   │   ├── public/                      # Componentes web pública
│   │   │   ├── Navbar.tsx               # Lee NavItem[] de la DB
│   │   │   ├── Footer.tsx
│   │   │   ├── TourCard.tsx
│   │   │   ├── TourFilters.tsx
│   │   │   ├── TourGallery.tsx
│   │   │   ├── ItineraryAccordion.tsx
│   │   │   ├── PriceCalculator.tsx      # Cotizador tiempo real
│   │   │   ├── CheckoutForm.tsx
│   │   │   ├── CulqiPayment.tsx
│   │   │   ├── PayPalPayment.tsx
│   │   │   ├── PaymentLinkPage.tsx      # Renderiza link de pago
│   │   │   ├── WhatsAppButton.tsx
│   │   │   └── LanguageSwitcher.tsx
│   │   │
│   │   ├── admin/                       # Componentes panel admin
│   │   │   ├── Sidebar.tsx
│   │   │   ├── DashboardCards.tsx
│   │   │   ├── TourForm.tsx             # Formulario plantilla 7 secciones
│   │   │   ├── TourFormSections/
│   │   │   │   ├── BasicInfoSection.tsx
│   │   │   │   ├── GallerySection.tsx   # Drag & drop + Cloudinary
│   │   │   │   ├── ItinerarySection.tsx # Días dinámicos
│   │   │   │   ├── PricingSection.tsx   # Temporadas, tipos, promos
│   │   │   │   ├── IncludesSection.tsx
│   │   │   │   ├── DatesSection.tsx     # Fechas salida + cupos
│   │   │   │   └── ConfigSection.tsx    # SEO, estado, idioma
│   │   │   ├── ReservationTable.tsx
│   │   │   ├── PaymentVerification.tsx
│   │   │   ├── QuotationForm.tsx
│   │   │   ├── PaymentLinkGenerator.tsx
│   │   │   ├── OccupancyCalendar.tsx
│   │   │   ├── OccupancyBars.tsx
│   │   │   ├── NavbarEditor.tsx         # Drag & drop reorder navbar
│   │   │   ├── PageEditor.tsx           # Tiptap WYSIWYG
│   │   │   ├── HomepageEditor.tsx       # Secciones arrastrables
│   │   │   ├── MediaLibrary.tsx         # Gestor Cloudinary
│   │   │   ├── ClientHistory.tsx
│   │   │   ├── AuditLog.tsx
│   │   │   └── ExportButton.tsx         # Excel/CSV
│   │   │
│   │   └── ui/                          # shadcn/ui components
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── validators/                  # Schemas Zod compartidos
│   │       ├── tour.ts
│   │       ├── reservation.ts
│   │       ├── quotation.ts
│   │       ├── payment-link.ts
│   │       └── content.ts
│   │
│   ├── i18n/
│   │   ├── request.ts
│   │   └── messages/
│   │       ├── es.json
│   │       └── en.json
│   │
│   └── types/
│       └── index.ts                     # Tipos globales inferidos de Prisma + custom
│
├── public/
│   ├── fonts/
│   └── images/                          # Assets estáticos (logo, favicons)
│
├── scripts/
│   ├── backup.ts                        # Cron: dump PostgreSQL → R2
│   └── seed.ts
│
├── .env.example
├── docker-compose.yml                   # Dev: PostgreSQL local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 1.3 Diagrama de Infraestructura

```
Internet → Cloudflare (DDoS/WAF/SSL/CDN) → Railway Hobby ($5/mes)
                                               ├── Next.js App (web + admin + API)
                                               └── PostgreSQL 16 (red privada)
                                                      ↕
                                       ┌───────────────┼───────────────┐
                                       │               │               │
                                   Cloudinary      Culqi API      PayPal API
                                   (imágenes)      (pagos PEN)    (pagos USD)
                                                       │
                                                   Resend (emails)
                                                       │
                                               Cloudflare R2 (backups)
```

---

## 2. Modelo de Base de Datos (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// AUTENTICACIÓN Y USUARIOS
// ============================================================

enum UserRole {
  ADMIN
  SALES       // Vendedor / Operaciones
  MARKETING   // Marketing / Contenido
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  passwordHash  String
  role          UserRole  @default(SALES)
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relaciones
  quotations    Quotation[]
  paymentLinks  PaymentLink[]
  reservations  Reservation[]  // vendedor asignado
  auditLogs     AuditLog[]

  // NextAuth
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ============================================================
// TOURS
// ============================================================

enum TourStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum Difficulty {
  EASY
  MODERATE
  CHALLENGING
}

model Tour {
  id          String     @id @default(cuid())
  slug        String     @unique     // URL-friendly: "cusco-magico-4d-3n"
  status      TourStatus @default(DRAFT)
  isFeatured  Boolean    @default(false)
  category    String                 // "adventure", "cultural", "relax", "family"
  difficulty  Difficulty @default(EASY)
  durationDays   Int
  durationNights Int
  destination    String              // "Cusco", "Lima", etc.

  // Contenido ES
  nameEs           String
  shortDescEs      String
  longDescEs       String            @db.Text

  // Contenido EN
  nameEn           String
  shortDescEn      String
  longDescEn       String            @db.Text

  // SEO
  metaTitleEs      String?
  metaDescEs       String?
  metaTitleEn      String?
  metaDescEn       String?

  // Orden en catálogo
  sortOrder     Int       @default(0)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relaciones
  images        TourImage[]
  itinerary     ItineraryDay[]
  pricing       TourPricing?
  seasons       TourSeason[]
  includes      TourInclude[]
  departures    TourDeparture[]
  reservations  Reservation[]
  quotationItems QuotationItem[]

  @@index([status, isFeatured])
  @@index([destination])
  @@index([category])
}

model TourImage {
  id           String  @id @default(cuid())
  tourId       String
  tour         Tour    @relation(fields: [tourId], references: [id], onDelete: Cascade)
  cloudinaryId String  // ID en Cloudinary para transformaciones
  url          String  // URL base de Cloudinary
  altEs        String?
  altEn        String?
  isPrimary    Boolean @default(false)
  sortOrder    Int     @default(0)

  @@index([tourId, sortOrder])
}

model ItineraryDay {
  id          String  @id @default(cuid())
  tourId      String
  tour        Tour    @relation(fields: [tourId], references: [id], onDelete: Cascade)
  dayNumber   Int
  titleEs     String
  titleEn     String
  descriptionEs String @db.Text
  descriptionEn String @db.Text

  @@unique([tourId, dayNumber])
  @@index([tourId])
}

model TourPricing {
  id               String  @id @default(cuid())
  tourId           String  @unique
  tour             Tour    @relation(fields: [tourId], references: [id], onDelete: Cascade)

  // Precios base (temporada regular)
  basePricePenAdult   Decimal @db.Decimal(10, 2)
  basePriceUsdAdult   Decimal @db.Decimal(10, 2)
  basePricePenChild   Decimal @db.Decimal(10, 2)
  basePriceUsdChild   Decimal @db.Decimal(10, 2)

  // Descuento grupo
  groupDiscountPercent  Decimal? @db.Decimal(5, 2) // ej: 10.00 = 10%
  groupMinPersons       Int?                        // a partir de cuántas personas

  // Promoción activa
  promoDiscountPercent  Decimal?  @db.Decimal(5, 2)
  promoStartDate        DateTime?
  promoEndDate          DateTime?
  promoLabelEs          String?   // "¡20% Off Fiestas Patrias!"
  promoLabelEn          String?
}

model TourSeason {
  id          String   @id @default(cuid())
  tourId      String
  tour        Tour     @relation(fields: [tourId], references: [id], onDelete: Cascade)
  name        String                  // "Alta", "Baja"
  startDate   DateTime
  endDate     DateTime
  surchargePercent Decimal @db.Decimal(5, 2) // ej: 15.00 = +15% sobre precio base; negativo = descuento

  @@index([tourId])
}

model TourInclude {
  id          String  @id @default(cuid())
  tourId      String
  tour        Tour    @relation(fields: [tourId], references: [id], onDelete: Cascade)
  type        String                 // "INCLUDE" o "EXCLUDE"
  textEs      String
  textEn      String
  sortOrder   Int     @default(0)

  @@index([tourId, type])
}

model TourDeparture {
  id           String   @id @default(cuid())
  tourId       String
  tour         Tour     @relation(fields: [tourId], references: [id], onDelete: Cascade)
  departureDate DateTime
  maxCapacity  Int
  bookedCount  Int      @default(0)   // Se actualiza con cada reserva confirmada
  status       String   @default("AVAILABLE") // "AVAILABLE", "SOLD_OUT", "CANCELLED"

  reservations Reservation[]

  @@index([tourId, departureDate])
  @@index([status])
}

// ============================================================
// CLIENTES
// ============================================================

model Client {
  id          String   @id @default(cuid())
  email       String   @unique
  firstName   String
  lastName    String
  phone       String?
  country     String?
  language    String   @default("es")  // "es" o "en"
  notes       String?  @db.Text        // Notas internas del equipo
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  reservations Reservation[]
  quotations   Quotation[]

  @@index([email])
}

// ============================================================
// RESERVAS
// ============================================================

enum ReservationStatus {
  PENDING       // Recién creada, esperando pago
  CONFIRMED     // Pago verificado manualmente o parcial pagado
  PAID          // Pago completo confirmado
  COMPLETED     // Tour realizado
  CANCELLED     // Cancelada
}

enum ReservationOrigin {
  WEB           // Cliente reservó directamente
  MANUAL        // Vendedor la creó en el admin
  QUOTATION     // Convertida desde cotización
  PAYMENT_LINK  // Pagada desde link personalizado
}

model Reservation {
  id              String            @id @default(cuid())
  referenceCode   String            @unique @default(cuid()) // Código legible: RSV-XXXX
  status          ReservationStatus @default(PENDING)
  origin          ReservationOrigin @default(WEB)

  // Relaciones
  clientId        String
  client          Client            @relation(fields: [clientId], references: [id])
  tourId          String
  tour            Tour              @relation(fields: [tourId], references: [id])
  departureId     String?
  departure       TourDeparture?    @relation(fields: [departureId], references: [id])
  assignedUserId  String?           // Vendedor asignado
  assignedUser    User?             @relation(fields: [assignedUserId], references: [id])
  quotationId     String?           // Si viene de cotización
  paymentLinkId   String?           // Si viene de link de pago

  // Detalle
  adults          Int               @default(1)
  children        Int               @default(0)
  currency        String            @default("PEN") // "PEN" o "USD"
  totalAmount     Decimal           @db.Decimal(10, 2)
  depositAmount   Decimal?          @db.Decimal(10, 2) // Seña
  balanceAmount   Decimal?          @db.Decimal(10, 2) // Saldo pendiente
  extras          Json?             // Servicios adicionales seleccionados

  // Descripción personalizada (para reservas manuales/links)
  customDescEs    String?           @db.Text
  customDescEn    String?           @db.Text

  // Notas internas
  internalNotes   String?           @db.Text

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  payments        Payment[]

  @@index([status])
  @@index([clientId])
  @@index([tourId])
  @@index([createdAt])
}

// ============================================================
// PAGOS
// ============================================================

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  CULQI_CARD
  CULQI_YAPE
  PAYPAL
  BANK_TRANSFER  // Verificación manual
  CASH           // Verificación manual
}

model Payment {
  id              String        @id @default(cuid())
  reservationId   String
  reservation     Reservation   @relation(fields: [reservationId], references: [id])
  status          PaymentStatus @default(PENDING)
  method          PaymentMethod
  amount          Decimal       @db.Decimal(10, 2)
  currency        String        @default("PEN")

  // Referencias externas
  culqiChargeId   String?       // ID de cargo en Culqi
  paypalOrderId   String?       // ID de orden en PayPal
  gatewayResponse Json?         // Respuesta raw de la pasarela

  // Para pagos manuales
  manualVerifiedBy  String?     // userId que verificó
  manualVerifiedAt  DateTime?
  manualNotes       String?

  // Tipo de pago
  isDeposit       Boolean       @default(false) // true = seña; false = pago total o saldo

  processedAt     DateTime?
  createdAt       DateTime      @default(now())

  @@index([reservationId])
  @@index([status])
  @@index([culqiChargeId])
  @@index([paypalOrderId])
}

// ============================================================
// COTIZACIONES
// ============================================================

enum QuotationStatus {
  DRAFT
  SENT
  VIEWED          // Cliente abrió el email/link
  ACCEPTED
  CONVERTED       // Convertida en reserva
  EXPIRED
}

model Quotation {
  id              String          @id @default(cuid())
  referenceCode   String          @unique // COT-XXXX
  status          QuotationStatus @default(DRAFT)

  clientId        String
  client          Client          @relation(fields: [clientId], references: [id])
  createdByUserId String
  createdBy       User            @relation(fields: [createdByUserId], references: [id])

  // Contenido
  titleEs         String
  titleEn         String?
  notesEs         String?         @db.Text  // Notas/condiciones
  notesEn         String?         @db.Text
  currency        String          @default("PEN")
  totalAmount     Decimal         @db.Decimal(10, 2)
  customAmount    Decimal?        @db.Decimal(10, 2) // Si se editó manualmente
  validUntil      DateTime                           // Fecha de vencimiento
  depositPercent  Decimal?        @db.Decimal(5, 2)  // % de seña requerida

  // Seguimiento
  sentAt          DateTime?
  viewedAt        DateTime?
  acceptedAt      DateTime?
  reminderSentAt  DateTime?
  reminderDays    Int             @default(3) // Enviar recordatorio después de X días

  // Conversión
  reservationId   String?         @unique // Si se convirtió
  paymentLinkId   String?         @unique // Link de pago generado

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  items           QuotationItem[]
  paymentLink     PaymentLink?

  @@index([status])
  @@index([clientId])
}

model QuotationItem {
  id            String    @id @default(cuid())
  quotationId   String
  quotation     Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  tourId        String?
  tour          Tour?     @relation(fields: [tourId], references: [id])

  // Puede ser un tour del catálogo o un servicio custom
  descriptionEs String
  descriptionEn String?
  adults        Int       @default(1)
  children      Int       @default(0)
  unitPrice     Decimal   @db.Decimal(10, 2)
  quantity      Int       @default(1)
  subtotal      Decimal   @db.Decimal(10, 2)

  sortOrder     Int       @default(0)

  @@index([quotationId])
}

// ============================================================
// LINKS DE PAGO PERSONALIZADOS
// ============================================================

enum PaymentLinkStatus {
  ACTIVE
  PAID
  PARTIALLY_PAID  // Seña pagada, saldo pendiente
  EXPIRED
  CANCELLED
}

model PaymentLink {
  id              String            @id @default(cuid())
  token           String            @unique @default(cuid()) // Token en la URL: /pago/{token}
  status          PaymentLinkStatus @default(ACTIVE)

  createdByUserId String
  createdBy       User              @relation(fields: [createdByUserId], references: [id])

  quotationId     String?           @unique
  quotation       Quotation?        @relation(fields: [quotationId], references: [id])

  // Datos del cliente
  clientName      String
  clientEmail     String
  clientPhone     String?

  // Descripción del producto/servicio (lo que ve el cliente)
  titleEs         String            // "Tour Cusco Personalizado 5D/4N"
  titleEn         String?
  descriptionEs   String            @db.Text // Itinerario completo, incluye/no incluye
  descriptionEn   String?           @db.Text
  includesEs      String[]          // Lista de incluye
  includesEn      String[]
  excludesEs      String[]          // Lista de no incluye
  excludesEn      String[]
  departureDate   DateTime?
  returnDate      DateTime?
  adults          Int               @default(1)
  children        Int               @default(0)

  // Montos
  currency        String            @default("PEN")
  totalAmount     Decimal           @db.Decimal(10, 2)
  depositRequired Boolean           @default(false)
  depositPercent  Decimal?          @db.Decimal(5, 2) // 50.00 = 50%
  depositAmount   Decimal?          @db.Decimal(10, 2) // Calculado
  balanceAmount   Decimal?          @db.Decimal(10, 2) // Calculado
  balanceDueDate  DateTime?         // Fecha límite para pagar saldo

  // Vencimiento
  expiresAt       DateTime

  // Pagos recibidos
  amountPaid      Decimal           @db.Decimal(10, 2) @default(0)

  // Condiciones / políticas
  termsEs         String?           @db.Text
  termsEn         String?           @db.Text

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([token])
  @@index([status])
  @@index([expiresAt])
}

// ============================================================
// CMS: CONTENIDO WEB EDITABLE
// ============================================================

model NavItem {
  id          String  @id @default(cuid())
  labelEs     String                 // "Tours", "Nosotros"
  labelEn     String
  href        String                 // "/tours", "/nosotros", URL custom
  target      String  @default("_self") // "_self" o "_blank"
  parentId    String?                // Para submenús
  parent      NavItem? @relation("NavItemChildren", fields: [parentId], references: [id])
  children    NavItem[] @relation("NavItemChildren")
  isVisible   Boolean @default(true)
  sortOrder   Int     @default(0)

  @@index([parentId, sortOrder])
}

// Páginas dinámicas (FAQ, Nosotros, Términos, etc.)
model Page {
  id          String   @id @default(cuid())
  slug        String   @unique       // "nosotros", "faq", "terminos"
  titleEs     String
  titleEn     String
  contentEs   Json                    // Tiptap JSON (editor WYSIWYG)
  contentEn   Json
  metaTitleEs String?
  metaDescEs  String?
  metaTitleEn String?
  metaDescEn  String?
  isPublished Boolean  @default(false)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
}

// Secciones de la Homepage (ordenables)
enum HomeSectionType {
  HERO
  FEATURED_TOURS
  DESTINATIONS
  TESTIMONIALS
  PROMOTIONS
  CTA
  ABOUT_PREVIEW
  BLOG_PREVIEW
  CUSTOM_HTML   // Para contenido libre con Tiptap
}

model HomeSection {
  id          String          @id @default(cuid())
  type        HomeSectionType
  titleEs     String?
  titleEn     String?
  subtitleEs  String?
  subtitleEn  String?
  contentEs   Json?                   // Configuración específica por tipo
  contentEn   Json?
  imageUrl    String?                 // Cloudinary URL si aplica
  isVisible   Boolean         @default(true)
  sortOrder   Int             @default(0)

  @@index([isVisible, sortOrder])
}

model BlogPost {
  id            String   @id @default(cuid())
  slug          String   @unique
  titleEs       String
  titleEn       String
  excerptEs     String
  excerptEn     String
  contentEs     Json                  // Tiptap JSON
  contentEn     Json
  coverImageUrl String?
  category      String?
  isPublished   Boolean  @default(false)
  publishedAt   DateTime?
  metaTitleEs   String?
  metaDescEs    String?
  metaTitleEn   String?
  metaDescEn    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([isPublished, publishedAt])
}

model Testimonial {
  id          String   @id @default(cuid())
  clientName  String
  country     String?
  tourName    String?
  rating      Int                     // 1-5
  textEs      String   @db.Text
  textEn      String?  @db.Text
  avatarUrl   String?
  isApproved  Boolean  @default(false)
  isFeatured  Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([isApproved, isFeatured])
}

model FAQ {
  id          String  @id @default(cuid())
  questionEs  String
  questionEn  String
  answerEs    String  @db.Text
  answerEn    String  @db.Text
  category    String? // "general", "pagos", "tours", "cancelaciones"
  sortOrder   Int     @default(0)
  isPublished Boolean @default(true)

  @@index([category, sortOrder])
}

// ============================================================
// SISTEMA
// ============================================================

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  action     String              // "CREATE_TOUR", "UPDATE_PRICE", "CONFIRM_PAYMENT", etc.
  entity     String              // "Tour", "Reservation", "Payment", etc.
  entityId   String
  changes    Json?               // { field: { old: X, new: Y } }
  ipAddress  String?
  createdAt  DateTime @default(now())

  @@index([entity, entityId])
  @@index([userId])
  @@index([createdAt])
}

model EmailTemplate {
  id          String  @id @default(cuid())
  key         String  @unique // "reservation_confirmed", "reminder_pretrip", etc.
  subjectEs   String
  subjectEn   String
  bodyEs      Json               // Tiptap JSON
  bodyEn      Json
  variables   String[]           // ["clientName", "tourName", "departureDate", ...]
  isActive    Boolean @default(true)
}

model Setting {
  id    String @id @default(cuid())
  key   String @unique           // "exchange_rate_pen_usd", "company_phone", etc.
  value Json
}
```

---

## 3. API — tRPC Routers

### 3.1 Tour Router

```typescript
// src/server/trpc/routers/tour.ts

export const tourRouter = router({
  // PÚBLICO (web)
  list: publicProcedure
    .input(z.object({
      locale: z.enum(["es", "en"]),
      destination: z.string().optional(),
      category: z.string().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      durationDays: z.number().optional(),
      sortBy: z.enum(["price_asc", "price_desc", "popular", "newest"]).optional(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(50).default(12),
    }))
    .query(async ({ input }) => {
      // Retorna tours PUBLISHED con pricing calculado
      // Incluye imagen primaria, precio base, promo activa
      // Paginación cursor-based
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string(), locale: z.enum(["es", "en"]) }))
    .query(async ({ input }) => {
      // Tour completo: imágenes, itinerario, pricing, includes, departures con ocupación
    }),

  // ADMIN (protegido)
  adminList: protectedProcedure
    .input(z.object({
      status: z.nativeEnum(TourStatus).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // Todos los tours con stats: reservas activas, ocupación promedio
    }),

  create: protectedProcedure
    .meta({ roles: ["ADMIN", "MARKETING"] })
    .input(tourCreateSchema)   // Zod schema con todas las 7 secciones
    .mutation(async ({ input, ctx }) => {
      // Crea tour + relaciones en transacción
      // AuditLog: CREATE_TOUR
    }),

  update: protectedProcedure
    .meta({ roles: ["ADMIN", "MARKETING"] })
    .input(tourUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      // Actualiza tour + relaciones
      // AuditLog: UPDATE_TOUR con diff de cambios
    }),

  duplicate: protectedProcedure
    .meta({ roles: ["ADMIN", "MARKETING"] })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Copia tour completo con slug "-copia" y status DRAFT
    }),

  updateStatus: protectedProcedure
    .meta({ roles: ["ADMIN", "MARKETING"] })
    .input(z.object({ id: z.string(), status: z.nativeEnum(TourStatus) }))
    .mutation(async ({ input, ctx }) => {
      // Cambiar DRAFT/PUBLISHED/ARCHIVED
      // AuditLog: UPDATE_TOUR_STATUS
    }),

  delete: protectedProcedure
    .meta({ roles: ["ADMIN"] })    // Solo admin puede eliminar
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Soft delete o verificar que no tiene reservas activas
    }),

  reorderImages: protectedProcedure
    .meta({ roles: ["ADMIN", "MARKETING"] })
    .input(z.object({
      tourId: z.string(),
      imageIds: z.array(z.string()),  // Nuevo orden
    }))
    .mutation(async ({ input }) => {
      // Actualiza sortOrder de cada imagen
    }),
});
```

### 3.2 Reservation Router

```typescript
// src/server/trpc/routers/reservation.ts

export const reservationRouter = router({
  // PÚBLICO
  create: publicProcedure
    .input(reservationCreateSchema)
    .mutation(async ({ input }) => {
      // 1. Validar disponibilidad (departure.bookedCount < maxCapacity)
      // 2. Calcular precio con pricing engine
      // 3. Crear Client si no existe (por email)
      // 4. Crear Reservation con status PENDING
      // 5. Retornar reservationId para proceder al pago
    }),

  // ADMIN
  adminList: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(z.object({
      status: z.nativeEnum(ReservationStatus).optional(),
      tourId: z.string().optional(),
      clientId: z.string().optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      search: z.string().optional(),   // Busca por nombre cliente o código
      cursor: z.string().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      // Lista paginada con client, tour, payments incluidos
    }),

  getById: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES", "MARKETING"] })
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Detalle completo: cliente, tour, pagos, historial cambios
    }),

  updateStatus: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(z.object({
      id: z.string(),
      status: z.nativeEnum(ReservationStatus),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Cambia estado + AuditLog
      // Si pasa a PAID → actualizar departure.bookedCount
      // Si se cancela → decrementar departure.bookedCount
    }),

  addNote: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(z.object({ id: z.string(), note: z.string() }))
    .mutation(async ({ input }) => {
      // Append a internalNotes con timestamp y userId
    }),

  exportCsv: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(z.object({ /* mismos filtros que adminList */ }))
    .query(async ({ input }) => {
      // Retorna CSV string
    }),
});
```

### 3.3 Payment Router

```typescript
// src/server/trpc/routers/payment.ts

export const paymentRouter = router({
  // PÚBLICO: Iniciar pago
  createCulqiCharge: publicProcedure
    .input(z.object({
      reservationId: z.string(),
      culqiToken: z.string(),   // Token generado por Culqi.js en el frontend
      isDeposit: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      // 1. Obtener reservation y calcular monto (total o seña)
      // 2. Llamar Culqi API: POST /charges con token
      // 3. Crear Payment con status según respuesta
      // 4. Si exitoso: actualizar reservation.status
      // 5. Enviar email confirmación + voucher PDF
      // 6. Notificar equipo (email interno)
    }),

  createPayPalOrder: publicProcedure
    .input(z.object({
      reservationId: z.string(),
      isDeposit: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      // 1. Calcular monto
      // 2. Crear orden PayPal: POST /v2/checkout/orders
      // 3. Retornar orderID para PayPal JS SDK
    }),

  capturePayPalOrder: publicProcedure
    .input(z.object({
      reservationId: z.string(),
      paypalOrderId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // 1. Capturar: POST /v2/checkout/orders/{id}/capture
      // 2. Crear Payment
      // 3. Actualizar reservation
      // 4. Emails + notificaciones
    }),

  // ADMIN: Pagos manuales
  verifyManual: protectedProcedure
    .meta({ roles: ["ADMIN"] })
    .input(z.object({
      reservationId: z.string(),
      method: z.enum(["BANK_TRANSFER", "CASH"]),
      amount: z.number(),
      currency: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Crea Payment COMPLETED + actualiza reservation
      // AuditLog: VERIFY_MANUAL_PAYMENT
    }),

  // ADMIN: Lista de pagos
  adminList: protectedProcedure
    .meta({ roles: ["ADMIN"] })
    .input(z.object({
      status: z.nativeEnum(PaymentStatus).optional(),
      method: z.nativeEnum(PaymentMethod).optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
    }))
    .query(async ({ input }) => {
      // Lista con reservation + client info
    }),

  // Dashboard: resumen diario
  dailySummary: protectedProcedure
    .meta({ roles: ["ADMIN"] })
    .query(async () => {
      // Total recaudado hoy por pasarela
      // Pagos pendientes
      // Pagos fallidos últimas 24h
    }),
});
```

### 3.4 Payment Link Router

```typescript
// src/server/trpc/routers/paymentLink.ts

export const paymentLinkRouter = router({
  // PÚBLICO: Obtener datos del link
  getByToken: publicProcedure
    .input(z.object({
      token: z.string(),
      locale: z.enum(["es", "en"]),
    }))
    .query(async ({ input }) => {
      // Retorna datos del link para renderizar la página de pago
      // Verifica que no esté expirado ni cancelado
      // Calcula montos (seña si aplica)
    }),

  // PÚBLICO: Pagar desde link
  payWithCulqi: publicProcedure
    .input(z.object({
      token: z.string(),         // Token del link
      culqiToken: z.string(),    // Token de Culqi
      payType: z.enum(["full", "deposit"]),
    }))
    .mutation(async ({ input }) => {
      // 1. Validar link activo y no expirado
      // 2. Calcular monto según payType
      // 3. Crear Reservation si no existe
      // 4. Procesar pago con Culqi
      // 5. Actualizar PaymentLink.status y amountPaid
      // 6. Email confirmación + voucher
    }),

  payWithPayPal: publicProcedure
    .input(z.object({
      token: z.string(),
      payType: z.enum(["full", "deposit"]),
    }))
    .mutation(async ({ input }) => {
      // Similar a payWithCulqi pero crea orden PayPal
    }),

  // ADMIN: Generar link
  create: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(paymentLinkCreateSchema)
    .mutation(async ({ input, ctx }) => {
      // Crea PaymentLink con todos los campos
      // Si viene de quotation, vincular
      // AuditLog: CREATE_PAYMENT_LINK
      // Retorna URL completa: {BASE_URL}/pago/{token}
    }),

  // ADMIN: Lista
  adminList: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(z.object({
      status: z.nativeEnum(PaymentLinkStatus).optional(),
    }))
    .query(async ({ input }) => {}),

  // ADMIN: Cancelar link
  cancel: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Marca como CANCELLED
    }),
});
```

### 3.5 Quotation Router

```typescript
// src/server/trpc/routers/quotation.ts

export const quotationRouter = router({
  create: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(quotationCreateSchema)
    .mutation(async ({ input, ctx }) => {
      // Crea cotización con items
      // Crea Client si no existe
      // Calcula totales
    }),

  update: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(quotationUpdateSchema)
    .mutation(async ({ input }) => {}),

  sendEmail: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Genera PDF
      // Envía email con Resend
      // Actualiza status SENT + sentAt
    }),

  generatePdf: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Genera PDF con @react-pdf/renderer
      // Retorna buffer/base64
    }),

  convertToReservation: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // 1. Crear Reservation desde datos de la cotización
      // 2. Actualizar quotation.status = CONVERTED
      // 3. Vincular quotation.reservationId
    }),

  generatePaymentLink: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 1. Crear PaymentLink con datos de la cotización
      // 2. Vincular quotation.paymentLinkId
      // 3. Retornar URL del link
    }),

  adminList: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .input(z.object({
      status: z.nativeEnum(QuotationStatus).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {}),
});
```

### 3.6 Content Router (CMS)

```typescript
// src/server/trpc/routers/content.ts

export const contentRouter = router({
  // ============ NAVBAR ============
  navbar: {
    list: publicProcedure.query(async () => {
      // Retorna NavItem[] ordenados, con children anidados
      // Filtro: isVisible = true para público
    }),

    adminList: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .query(async () => {
        // Todos los items incluyendo ocultos
      }),

    create: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(z.object({
        labelEs: z.string(),
        labelEn: z.string(),
        href: z.string(),
        target: z.string().default("_self"),
        parentId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Crea NavItem con sortOrder = max + 1
        // AuditLog: CREATE_NAV_ITEM
      }),

    update: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(z.object({
        id: z.string(),
        labelEs: z.string().optional(),
        labelEn: z.string().optional(),
        href: z.string().optional(),
        isVisible: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {}),

    reorder: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(z.object({
        items: z.array(z.object({ id: z.string(), sortOrder: z.number(), parentId: z.string().nullable() })),
      }))
      .mutation(async ({ input }) => {
        // Actualiza sortOrder y parentId de cada item
        // Permite drag & drop con anidamiento
      }),

    delete: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {}),
  },

  // ============ PAGES ============
  pages: {
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string(), locale: z.enum(["es", "en"]) }))
      .query(async ({ input }) => {
        // Retorna página si isPublished
      }),

    adminList: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .query(async () => {}),

    create: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(pageCreateSchema) // slug, titles, content Tiptap JSON
      .mutation(async ({ input, ctx }) => {}),

    update: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(pageUpdateSchema)
      .mutation(async ({ input, ctx }) => {
        // AuditLog con diff del contenido
      }),

    togglePublish: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {}),
  },

  // ============ HOMEPAGE SECTIONS ============
  homepage: {
    list: publicProcedure.query(async () => {
      // Secciones visibles ordenadas
    }),

    adminList: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .query(async () => {
        // Todas las secciones
      }),

    update: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(z.object({
        id: z.string(),
        titleEs: z.string().optional(),
        titleEn: z.string().optional(),
        contentEs: z.any().optional(), // JSON config por tipo
        contentEn: z.any().optional(),
        imageUrl: z.string().optional(),
        isVisible: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {}),

    reorder: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(z.object({
        sectionIds: z.array(z.string()), // Nuevo orden
      }))
      .mutation(async ({ input }) => {}),
  },

  // ============ BLOG ============
  blog: {
    list: publicProcedure
      .input(z.object({
        locale: z.enum(["es", "en"]),
        category: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().default(10),
      }))
      .query(async ({ input }) => {}),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string(), locale: z.enum(["es", "en"]) }))
      .query(async ({ input }) => {}),

    create: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(blogPostCreateSchema)
      .mutation(async ({ input }) => {}),

    update: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(blogPostUpdateSchema)
      .mutation(async ({ input }) => {}),
  },

  // ============ FAQ ============
  faq: {
    list: publicProcedure
      .input(z.object({ locale: z.enum(["es", "en"]) }))
      .query(async () => {}),

    create: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(faqCreateSchema)
      .mutation(async ({ input }) => {}),

    update: protectedProcedure.meta({ roles: ["ADMIN", "MARKETING"] }).input(faqUpdateSchema).mutation(async ({ input }) => {}),

    reorder: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(z.object({ ids: z.array(z.string()) }))
      .mutation(async ({ input }) => {}),

    delete: protectedProcedure.meta({ roles: ["ADMIN", "MARKETING"] }).input(z.object({ id: z.string() })).mutation(async ({ input }) => {}),
  },

  // ============ TESTIMONIALS ============
  testimonials: {
    list: publicProcedure.query(async () => {
      // Solo approved + featured
    }),

    adminList: protectedProcedure.meta({ roles: ["ADMIN", "MARKETING"] }).query(async () => {}),

    approve: protectedProcedure
      .meta({ roles: ["ADMIN", "MARKETING"] })
      .input(z.object({ id: z.string(), isApproved: z.boolean() }))
      .mutation(async ({ input }) => {}),
  },
});
```

### 3.7 Occupancy Router

```typescript
// src/server/trpc/routers/occupancy.ts

export const occupancyRouter = router({
  // Calendario de ocupación
  calendar: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES", "MARKETING"] })
    .input(z.object({
      month: z.number().min(1).max(12),
      year: z.number(),
      tourId: z.string().optional(), // Filtrar por tour específico
    }))
    .query(async ({ input }) => {
      // Retorna TourDeparture[] del mes con:
      // - tour.name, departureDate, maxCapacity, bookedCount
      // - occupancyPercent calculado
      // - status (AVAILABLE, SOLD_OUT, etc.)
      // Agrupado por fecha para vista calendario
    }),

  // Alertas de ocupación
  alerts: protectedProcedure
    .meta({ roles: ["ADMIN", "SALES"] })
    .query(async () => {
      // Tours con <30% ocupación y salida en próximos 14 días
      // Tours con >90% ocupación (casi llenos)
      // Tours con 0 reservas y salida en próximos 7 días
    }),

  // Histórico
  history: protectedProcedure
    .meta({ roles: ["ADMIN"] })
    .input(z.object({
      tourId: z.string().optional(),
      dateFrom: z.date(),
      dateTo: z.date(),
    }))
    .query(async ({ input }) => {
      // Ocupación promedio por tour/periodo
    }),
});
```

### 3.8 Dashboard Router

```typescript
// src/server/trpc/routers/dashboard.ts

export const dashboardRouter = router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();

    return {
      // Cards principales
      reservationsToday: 0,       // count where createdAt = today
      pendingPayments: {
        count: 0,
        totalPen: 0,
        totalUsd: 0,
      },
      toursThisWeek: [],          // departures esta semana con occupancy
      openQuotations: {
        count: 0,
        expiringCount: 0,         // vencen en próximos 3 días
      },

      // Listas rápidas
      latestReservations: [],     // últimas 5 reservas
      occupancyBars: [],          // próximas 5 salidas con %

      // Para ADMIN solamente
      revenueToday: { pen: 0, usd: 0 },
      revenueTrend: [],           // últimos 7 días
    };
  }),
});
```

---

## 4. Webhooks

### 4.1 Culqi Webhook

```typescript
// src/app/api/webhooks/culqi/route.ts

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-culqi-signature");

  // 1. Verificar firma HMAC-SHA256
  const isValid = verifyCulqiSignature(body, signature, env.CULQI_WEBHOOK_SECRET);
  if (!isValid) return new Response("Invalid signature", { status: 401 });

  const event = JSON.parse(body);

  // 2. Procesar según tipo de evento
  switch (event.type) {
    case "charge.creation.success":
      // Buscar Payment por culqiChargeId
      // Actualizar Payment.status = COMPLETED
      // Actualizar Reservation.status = PAID (o CONFIRMED si es seña)
      // Actualizar TourDeparture.bookedCount += adults + children
      // Enviar email confirmación + voucher PDF
      // Notificar equipo admin
      break;

    case "charge.creation.failure":
      // Actualizar Payment.status = FAILED
      // Notificar equipo de pago fallido
      break;

    case "refund.creation.success":
      // Actualizar Payment.status = REFUNDED
      // Decrementar TourDeparture.bookedCount
      break;
  }

  return new Response("OK", { status: 200 });
}
```

### 4.2 PayPal Webhook

```typescript
// src/app/api/webhooks/paypal/route.ts

export async function POST(req: Request) {
  const body = await req.text();

  // 1. Verificar con PayPal API: POST /v1/notifications/verify-webhook-signature
  const isValid = await verifyPayPalWebhook(req.headers, body);
  if (!isValid) return new Response("Invalid", { status: 401 });

  const event = JSON.parse(body);

  // 2. Procesar
  switch (event.event_type) {
    case "PAYMENT.CAPTURE.COMPLETED":
      // Similar a Culqi: actualizar Payment, Reservation, Departure, emails
      break;
    case "PAYMENT.CAPTURE.DENIED":
      // Marcar como fallido
      break;
  }

  return new Response("OK", { status: 200 });
}
```

---

## 5. Motor de Precios

```typescript
// src/server/services/pricing.ts

interface PriceCalculation {
  basePrice: Decimal;
  seasonSurcharge: Decimal;
  groupDiscount: Decimal;
  promoDiscount: Decimal;
  subtotalPerPerson: Decimal;
  totalAdults: Decimal;
  totalChildren: Decimal;
  grandTotal: Decimal;
  currency: "PEN" | "USD";
  breakdown: PriceBreakdownItem[];
}

export function calculateTourPrice(params: {
  tour: TourWithPricing;    // Tour + TourPricing + TourSeason[]
  departureDate: Date;
  adults: number;
  children: number;
  currency: "PEN" | "USD";
}): PriceCalculation {
  const { tour, departureDate, adults, children, currency } = params;
  const pricing = tour.pricing!;

  // 1. Precio base según moneda
  const basePriceAdult = currency === "PEN"
    ? pricing.basePricePenAdult
    : pricing.basePriceUsdAdult;
  const basePriceChild = currency === "PEN"
    ? pricing.basePricePenChild
    : pricing.basePriceUsdChild;

  // 2. Recargo/descuento por temporada
  let seasonSurchargePercent = new Decimal(0);
  for (const season of tour.seasons) {
    if (departureDate >= season.startDate && departureDate <= season.endDate) {
      seasonSurchargePercent = season.surchargePercent;
      break;
    }
  }

  // 3. Descuento de grupo
  const totalPersons = adults + children;
  let groupDiscountPercent = new Decimal(0);
  if (pricing.groupMinPersons && totalPersons >= pricing.groupMinPersons) {
    groupDiscountPercent = pricing.groupDiscountPercent ?? new Decimal(0);
  }

  // 4. Promoción activa
  const now = new Date();
  let promoDiscountPercent = new Decimal(0);
  if (pricing.promoStartDate && pricing.promoEndDate &&
      now >= pricing.promoStartDate && now <= pricing.promoEndDate) {
    promoDiscountPercent = pricing.promoDiscountPercent ?? new Decimal(0);
  }

  // 5. Calcular
  const adultPrice = basePriceAdult
    .mul(new Decimal(1).plus(seasonSurchargePercent.div(100)))
    .mul(new Decimal(1).minus(groupDiscountPercent.div(100)))
    .mul(new Decimal(1).minus(promoDiscountPercent.div(100)));

  const childPrice = basePriceChild
    .mul(new Decimal(1).plus(seasonSurchargePercent.div(100)))
    .mul(new Decimal(1).minus(groupDiscountPercent.div(100)))
    .mul(new Decimal(1).minus(promoDiscountPercent.div(100)));

  const totalAdults = adultPrice.mul(adults);
  const totalChildren = childPrice.mul(children);
  const grandTotal = totalAdults.plus(totalChildren);

  return {
    basePrice: basePriceAdult,
    seasonSurcharge: seasonSurchargePercent,
    groupDiscount: groupDiscountPercent,
    promoDiscount: promoDiscountPercent,
    subtotalPerPerson: adultPrice,
    totalAdults,
    totalChildren,
    grandTotal,
    currency,
    breakdown: [/* desglose para UI */],
  };
}
```

---

## 6. Sistema CMS Visual — Detalle de Implementación

### 6.1 Navbar Dinámico

El componente `<Navbar>` en la web pública lee los items de la base de datos en cada request (ISR con revalidación de 60 segundos).

```typescript
// src/components/public/Navbar.tsx
// Server Component — lee NavItem[] de DB
// Renderiza <nav> con items dinámicos
// Soporta submenús (parentId → children dropdown)
// LanguageSwitcher integrado
// Mobile: hamburger menu responsive

// src/components/admin/NavbarEditor.tsx
// Client Component con drag & drop (dnd-kit)
// Operaciones:
//   - Agregar item: abre modal con campos (labelEs, labelEn, href, target)
//   - href puede ser: seleccionar de lista de páginas/tours existentes O escribir URL custom
//   - Reordenar: drag & drop
//   - Anidar: arrastrar item debajo de otro para crear submenú
//   - Toggle visibilidad
//   - Eliminar
// Cambios se guardan con botón "Guardar cambios" (no auto-save para evitar errores)
// Vista previa del navbar en la parte superior del editor
```

### 6.2 Editor de Páginas

```typescript
// src/components/admin/PageEditor.tsx
// Usa Tiptap (ProseMirror) con extensiones:
//   - StarterKit (bold, italic, headings, lists, blockquotes)
//   - Image (insertar desde MediaLibrary / Cloudinary)
//   - Link
//   - TextAlign
//   - Table
//   - Placeholder
//
// Toolbar con botones visuales estilo Word
// Contenido se guarda como Tiptap JSON (no HTML) para renderizado seguro
// Pestaña ES / EN para editar ambos idiomas
// Botón "Vista previa" abre modal con renderizado real
// Botón "Publicar" / "Despublicar"
```

### 6.3 Homepage Editor

```typescript
// src/components/admin/HomepageEditor.tsx
// La homepage se compone de secciones (HomeSection[])
// Cada tipo de sección tiene su propio mini-editor:
//
// HERO:
//   - Imagen de fondo (seleccionar de Cloudinary)
//   - Título ES/EN
//   - Subtítulo ES/EN
//   - CTA texto + URL
//
// FEATURED_TOURS:
//   - Título ES/EN
//   - Seleccionar tours marcados como isFeatured (automático)
//   - O seleccionar manualmente tours específicos
//
// DESTINATIONS:
//   - Grid de tarjetas de destino
//   - Cada una: imagen + nombre + link a catálogo filtrado
//
// TESTIMONIALS:
//   - Título ES/EN
//   - Muestra automáticamente testimonios approved + featured
//
// PROMOTIONS:
//   - Muestra tours con promo activa
//
// CTA:
//   - Imagen + texto + botón
//   - Link a WhatsApp o página
//
// CUSTOM_HTML:
//   - Editor Tiptap para contenido libre
//
// Todas las secciones son drag & drop para reordenar
// Toggle de visibilidad por sección
```

### 6.4 Flujo: Crear tour nuevo desde admin (cómo se conecta con la web)

```
ADMIN                                       WEB PÚBLICA
─────                                       ───────────

1. Marketing va a /admin/tours/nuevo
2. Llena plantilla 7 secciones
3. Sube fotos → Cloudinary
4. Configura precios y fechas
5. Status: DRAFT (no visible aún)
                                            (nada cambia en la web)

6. Clic "Vista previa"
   → Renderiza componente TourDetail
   con datos del formulario
   (sin guardar aún)

7. Clic "Publicar"
   → Status: PUBLISHED
   → Se guarda en DB                       → El tour aparece en /tours
   → slug se genera automático               dentro del catálogo
   → sortOrder se asigna                   → Ficha individual en /tours/{slug}
                                            → Si isFeatured=true, sale en homepage
                                            → Fechas de salida aparecen en checkout
                                            → Botón reservar funcional

8. Quiere agregar al navbar:
   Va a /admin/contenido/navbar
   → "Agregar item"
   → Label: "Cusco Mágico" / "Magical Cusco"
   → href: selecciona de lista → /tours/cusco-magico-4d-3n
   → Arrastra al lugar deseado
   → Guardar                               → Navbar actualizado con nuevo item
```

### 6.5 Flujo: Link de pago personalizado (técnico)

```
ADMIN                                   CLIENTE                              SISTEMA
─────                                   ───────                              ───────

1. Vendedor: POST paymentLink.create
   {
     titleEs: "Tour Cusco 5D/4N",
     descriptionEs: "Itinerario...",
     includesEs: ["Hotel", "Guía"],
     totalAmount: 4800.00,
     currency: "PEN",
     depositRequired: true,
     depositPercent: 50,
     expiresAt: "2026-04-01",
     clientName: "Carlos García",
     clientEmail: "carlos@...",
   }

2. Sistema genera token → abc123
   URL: agencia.com/pago/abc123

3. Vendedor copia URL
   Envía por WhatsApp

                                     4. Cliente abre URL
                                        GET /pago/abc123
                                        → paymentLink.getByToken
                                        → Renderiza PaymentLinkPage

                                     5. Ve:
                                        - Título, descripción, itinerario
                                        - Incluye / no incluye
                                        - Total: S/4,800
                                        - Seña (50%): S/2,400
                                        - Saldo: S/2,400
                                        - [Pagar seña S/2,400]
                                        - [Pagar total S/4,800]

                                     6. Elige "Pagar seña"
                                        → Culqi form se abre
                                        → Ingresa tarjeta
                                        → Culqi genera token

                                     7. POST paymentLink.payWithCulqi
                                        { token: "abc123",
                                          culqiToken: "tkn_xxx",
                                          payType: "deposit" }

                                                                          8. Sistema:
                                                                             - Crea Reservation
                                                                             - Crea Payment (isDeposit=true)
                                                                             - Llama Culqi API /charges
                                                                             - Actualiza PaymentLink:
                                                                               status=PARTIALLY_PAID
                                                                               amountPaid=2400
                                                                             - Email confirmación + voucher

                                                                          9. Cron/reminder:
                                                                             X días antes del viaje
                                                                             → Email recordatorio saldo
                                                                             → Link sigue activo para
                                                                               pagar el resto
```

---

## 7. Middleware de Autorización

```typescript
// src/server/trpc/trpc.ts

import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";

const t = initTRPC.context<Context>().create();

export const publicProcedure = t.procedure;

// Middleware: requiere autenticación
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.session.user } });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);

// Middleware: requiere rol específico
// Se usa en .meta({ roles: ["ADMIN", "SALES"] })
const hasRole = t.middleware(async ({ ctx, meta, next }) => {
  if (meta?.roles && !meta.roles.includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
  }
  return next({ ctx });
});

// Composición
export const protectedProcedure = t.procedure.use(isAuthenticated).use(hasRole);
```

### Tabla de Permisos por Rol (implementación)

```typescript
// src/lib/constants.ts

export const ROLE_PERMISSIONS = {
  ADMIN: {
    tours: ["create", "read", "update", "delete", "publish"],
    reservations: ["create", "read", "update", "delete", "export"],
    payments: ["read", "verify_manual", "refund"],
    quotations: ["create", "read", "update", "delete", "send", "convert"],
    paymentLinks: ["create", "read", "cancel"],
    clients: ["read", "update", "export"],
    content: ["create", "read", "update", "delete", "publish"],
    navbar: ["create", "read", "update", "delete", "reorder"],
    users: ["create", "read", "update", "delete"],
    occupancy: ["read"],
    auditLog: ["read"],
    settings: ["read", "update"],
  },
  SALES: {
    tours: ["read"],
    reservations: ["create", "read", "update", "export"],
    payments: ["read"],       // Solo lectura, no puede verificar manuales
    quotations: ["create", "read", "update", "send", "convert"],
    paymentLinks: ["create", "read", "cancel"],
    clients: ["read", "update", "export"],
    content: [],              // Sin acceso
    navbar: [],               // Sin acceso
    users: [],                // Sin acceso
    occupancy: ["read"],
    auditLog: [],
    settings: [],
  },
  MARKETING: {
    tours: ["create", "read", "update", "publish"], // No delete
    reservations: ["read"],   // Solo lectura
    payments: [],             // Sin acceso
    quotations: [],           // Sin acceso
    paymentLinks: [],         // Sin acceso
    clients: [],              // Sin acceso
    content: ["create", "read", "update", "delete", "publish"],
    navbar: ["create", "read", "update", "delete", "reorder"],
    users: [],                // Sin acceso
    occupancy: ["read"],
    auditLog: [],
    settings: [],
  },
} as const;
```

---

## 8. Variables de Entorno

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/agencia_turismo"

# NextAuth
NEXTAUTH_URL="https://agencia.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Culqi
CULQI_PUBLIC_KEY="pk_test_..."
CULQI_SECRET_KEY="sk_test_..."
CULQI_WEBHOOK_SECRET="whk_..."

# PayPal
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
PAYPAL_WEBHOOK_ID="..."
PAYPAL_MODE="sandbox"  # "sandbox" o "live"

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
CLOUDINARY_UPLOAD_PRESET="agencia_tours"

# Resend (email)
RESEND_API_KEY="re_..."
EMAIL_FROM="reservas@agencia.com"
ADMIN_NOTIFICATION_EMAIL="admin@agencia.com"

# Cloudflare R2 (backups)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="agencia-backups"

# App
NEXT_PUBLIC_BASE_URL="https://agencia.com"
NEXT_PUBLIC_WHATSAPP_NUMBER="+51999999999"
```

---

## 9. Comandos de Setup

```bash
# 1. Clonar e instalar
git clone <repo>
cd agencia-turismo
npm install

# 2. Base de datos local
docker-compose up -d    # PostgreSQL 16
npx prisma migrate dev  # Ejecutar migraciones
npx prisma db seed      # Datos iniciales (admin user, home sections, nav items, email templates)

# 3. Desarrollo
npm run dev              # Next.js en :3000

# 4. Build y deploy
npm run build
# Railway se encarga del deploy automático al push a main
```

### Seed inicial (datos mínimos requeridos)

```typescript
// prisma/seed.ts debe crear:

// 1. Usuario admin inicial
//    email: "admin@agencia.com", role: ADMIN, password: hasheado

// 2. NavItems por defecto
//    Inicio (/), Tours (/tours), Nosotros (/nosotros), Blog (/blog), Contacto (/contacto)

// 3. HomeSections por defecto (en orden)
//    HERO, FEATURED_TOURS, DESTINATIONS, TESTIMONIALS, CTA, BLOG_PREVIEW

// 4. Pages por defecto
//    nosotros, faq, terminos, politica-cancelacion

// 5. EmailTemplates
//    reservation_confirmed, reminder_pretrip_7d, reminder_pretrip_3d,
//    reminder_pretrip_1d, review_request, quotation_sent,
//    quotation_reminder, balance_reminder

// 6. Settings
//    exchange_rate_pen_usd: 3.75
//    company_name, company_phone, company_address
//    deposit_default_percent: 50
//    reminder_days_default: 3
```

---

## 10. Infraestructura y Deploy

### Railway

```
Servicios en Railway:
├── web (Next.js app)
│   ├── Build: npm run build
│   ├── Start: npm start
│   ├── Puerto: $PORT (asignado por Railway)
│   ├── Health check: /api/health
│   └── Variables de entorno: todas las de .env
│
├── db (PostgreSQL 16)
│   ├── Red privada (no expuesta a internet)
│   ├── DATABASE_URL via referencia interna
│   └── 5GB almacenamiento (Hobby)
│
└── cron-backup (servicio opcional)
    ├── Cron: 0 3 * * * (3am diario)
    ├── Script: pg_dump → gzip → upload R2
    └── Retención: 7 días
```

### Cloudflare

```
Configuración DNS:
├── A record → Railway IP (proxied, nube naranja)
├── SSL/TLS: Full (strict)
├── Auto-minify: JS + CSS + HTML
├── Brotli: ON
├── Security Level: Medium
├── WAF: managed ruleset ON
├── Rate Limiting rules:
│   ├── /api/webhooks/*: 100 req/min
│   ├── /api/auth/*: 20 req/min
│   └── /api/trpc/*: 200 req/min
├── Cache Rules:
│   ├── /tours/*: cache 60s (stale-while-revalidate)
│   ├── /_next/static/*: cache 1 año
│   └── /admin/*: no cache
└── Page Rules:
    └── /admin/* → SSL Full, Security High
```

### Cloudinary

```
Configuración:
├── Upload preset: "agencia_tours"
│   ├── Unsigned (para upload widget frontend)
│   ├── Folder: "tours/"
│   ├── Allowed formats: jpg, png, webp
│   ├── Max file size: 10MB
│   ├── Eager transformations:
│   │   ├── c_fill,w_400,h_300,q_auto,f_auto (thumbnail catálogo)
│   │   ├── c_fill,w_800,h_600,q_auto,f_auto (card mediana)
│   │   └── c_limit,w_1920,q_auto,f_auto (full size)
│   └── Auto-tagging: off
└── Folders: tours/, blog/, pages/, general/
```

---

## 11. Costos de Producción

| Servicio | Plan | Costo |
|---|---|---|
| Railway | Hobby | $5/mes |
| Cloudflare | Free | $0 |
| Cloudinary | Free (25 créditos) | $0 |
| Cloudflare R2 | Free (10GB) | $0 |
| Resend | Free (100 emails/día) | $0 |
| GitHub | Free | $0 |
| Dominio | Existente | $0 |
| Microsoft 365 | Existente | $0 |
| **Total** | | **$5/mes (~$60/año)** |

| Pasarela | Comisión |
|---|---|
| Culqi (nacional) | 3.44% + IGV |
| Culqi (internacional) | 3.99% + $0.20 + IGV |
| PayPal | ~5.4% |

---

*Documento de especificación técnica para implementación directa con Claude Code. Todas las decisiones de arquitectura, modelos de datos, endpoints y flujos están definidos. El desarrollador (Claude Code) debe seguir esta especificación como referencia principal.*
