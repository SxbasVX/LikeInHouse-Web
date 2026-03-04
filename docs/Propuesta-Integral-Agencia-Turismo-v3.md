# Propuesta Técnica Integral: Plataforma Web + Sistema Administrativo para Agencia de Turismo

**Cliente:** Agencia de Turismo — MYPE constituida en Perú  
**Fecha:** Marzo 2026  
**Versión:** 3.0 (Definitiva Unificada)

---

## 1. Resumen Ejecutivo

Se propone desarrollar una **plataforma integral** que unifica la web pública y el sistema de gestión en un solo producto. No son dos sistemas separados: son dos interfaces del mismo sistema, conectadas por la misma base de datos y la misma lógica de negocio.

```
┌──────────────────────────────────────────────────────────┐
│                   UN SOLO SISTEMA                         │
│                                                           │
│   WEB PÚBLICA                    PANEL ADMIN              │
│   (lo que ve el cliente)         (lo que ve el equipo)    │
│                                                           │
│   • Catálogo de tours     ←→    • Gestión de tours        │
│   • Reservar y pagar      ←→    • Ver reservas y pagos    │
│   • Ver precios           ←→    • Editar precios          │
│   • Ver fotos             ←→    • Subir/ordenar fotos     │
│   • Blog y contenido      ←→    • Editor de contenido     │
│   • Link de pago          ←→    • Generar link de pago    │
│   • Cotización online     ←→    • Crear cotizaciones      │
│                                                           │
│              MISMA BASE DE DATOS (PostgreSQL)              │
│              MISMO SERVIDOR (Railway)                      │
│              MISMA SEGURIDAD (Cloudflare)                  │
└──────────────────────────────────────────────────────────┘
```

Cuando el equipo edita un tour en el admin, se refleja inmediatamente en la web. Cuando un cliente paga en la web, aparece al instante en el panel del vendedor. Todo está interconectado.

### ¿Qué puede hacer cada parte?

| Web Pública (Cliente) | Panel Admin (Equipo) |
|---|---|
| Ver catálogo de tours con filtros | Crear, editar y publicar tours |
| Reservar y pagar online | Verificar reservas y pagos |
| Solicitar cotización personalizada | Crear cotizaciones y links de pago |
| Pagar con link personalizado | Generar links de pago personalizados |
| Ver blog y contenido | Escribir y editar contenido |
| Cambiar idioma (ES/EN) | Gestionar traducciones |
| Contactar por WhatsApp | Ver datos de clientes |

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama General

```
                         INTERNET
                            │
                    ┌───────▼────────┐
                    │   CLOUDFLARE    │  ← Escudo de seguridad (GRATIS)
                    │  DDoS + WAF    │     SSL, CDN, filtrado de tráfico
                    │  SSL + CDN     │
                    └───────┬────────┘
                            │ Solo tráfico legítimo
                    ┌───────▼────────┐
                    │    RAILWAY     │  ← Hosting (Plan Hobby $5/mes)
                    │   (Hobby)      │
                    │                │
                    │  ┌──────────┐  │
                    │  │ Next.js  │  │  ← App única: web pública + admin
                    │  │ App      │  │     Frontend + Backend + API
                    │  └────┬─────┘  │
                    │       │ red    │
                    │       │interna │  ← Comunicación privada (no sale a internet)
                    │  ┌────▼─────┐  │
                    │  │PostgreSQL│  │  ← Base de datos (tours, reservas, clientes,
                    │  │   DB     │  │     pagos, cotizaciones, contenido)
                    │  └──────────┘  │
                    └────────────────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
      ┌───────▼──────┐ ┌───▼────┐  ┌──────▼──────┐
      │   CULQI      │ │ PAYPAL │  │ CLOUDINARY  │
      │ Pagos PEN    │ │Pagos   │  │ Imágenes    │
      │ Tarjetas     │ │USD/EUR │  │ Fotos tours │
      │ Yape/Plin    │ │        │  │ CDN global  │
      └──────────────┘ └────────┘  └─────────────┘
```

### 2.2 ¿Por qué todo en un solo sistema?

- **Consistencia:** El precio que ve el cliente en la web es exactamente el mismo que el vendedor configuró en el admin. No hay desfases ni errores.
- **Tiempo real:** Una reserva nueva aparece inmediatamente en el dashboard del admin. Un tour publicado aparece inmediatamente en la web.
- **Una sola base de datos:** Toda la información vive en un solo lugar. No hay que sincronizar datos entre sistemas diferentes.
- **Un solo despliegue:** Actualizar la web o el admin es un solo push de código. No hay que mantener dos proyectos.
- **Menor costo:** Un solo servidor, una sola base de datos, un solo hosting.

---

## 3. Infraestructura

### 3.1 Railway — Hosting (Plan Hobby $5/mes)

Railway es una plataforma full-stack donde el frontend (Next.js), el backend (API) y la base de datos (PostgreSQL) conviven en la misma red privada interna.

**Seguridad de Railway:**

- SOC 2 Type II compliant: estándar de seguridad de nivel enterprise.
- Datos encriptados en reposo.
- Certificados SSL automáticos.
- Encriptación de tráfico.
- Red privada: la base de datos no está expuesta a internet. Solo la aplicación puede comunicarse con ella.
- Deploy automático desde GitHub.

**Recursos del Plan Hobby:**

| Recurso | Disponible | Lo que necesita la agencia |
|---|---|---|
| CPU | Hasta 48 vCPU | Menos del 5% |
| RAM | Hasta 48 GB | Menos del 5% |
| Almacenamiento DB | 5 GB | Suficiente para años de operación |
| SSL | Automático | Incluido |
| Red privada | Sí | DB protegida |

### 3.2 Cloudflare — Seguridad (GRATIS)

Cloudflare se coloca delante de Railway como primera línea de defensa. Todo el tráfico pasa primero por Cloudflare antes de llegar al servidor.

**¿Qué hace?**

- **Protección DDoS ilimitada y gratuita:** Red de más de 330 centros de datos en más de 100 países, con capacidad superior a 100 Tbps. Los ataques se detectan y mitigan automáticamente en menos de 3 segundos.
- **SSL/TLS gratuito:** Certificado de seguridad (candadito verde) sin costo.
- **CDN global:** Las páginas estáticas se cachean en servidores cercanos al visitante. Carga rápida desde cualquier país.
- **WAF (Web Application Firewall):** Filtra tráfico malicioso.
- **Oculta la IP real del servidor:** Los atacantes nunca ven la IP de Railway.

### 3.3 Cloudinary — Imágenes (GRATIS)

Plataforma de gestión de medios que almacena y optimiza las fotos automáticamente.

Cuando el equipo sube una foto de 5MB desde el panel admin, Cloudinary automáticamente la comprime sin perder calidad visible (baja a ~200KB), la convierte al formato más eficiente según el navegador (WebP, AVIF), genera versiones de diferentes tamaños (thumbnail, tarjeta, pantalla completa), y la sirve desde un CDN global.

Tier gratuito: 25 créditos/mes (equivalente a ~25GB). Suficiente para una MYPE con 500-2000 fotos.

### 3.4 Seguridad de Pagos

**Los datos de tarjetas NUNCA tocan el servidor de la agencia.**

1. El cliente ingresa su tarjeta en un formulario de Culqi o PayPal, alojado en servidores de ellos.
2. Culqi/PayPal procesan el pago en su infraestructura con certificación PCI DSS.
3. El servidor solo recibe un token de confirmación.
4. La agencia nunca ve, guarda ni procesa números de tarjeta.

Los webhooks de Culqi y PayPal se verifican con firma criptográfica para impedir que alguien simule un pago falso.

### 3.5 Seguridad a Nivel de Código

- Autenticación segura con NextAuth.js (sesiones encriptadas, JWT).
- Rate limiting contra ataques de fuerza bruta.
- Validación de datos con Zod en cada formulario y API.
- Protección CSRF en todos los formularios.
- Webhooks verificados con firma criptográfica.
- Roles y permisos estrictos.
- Headers de seguridad (HSTS, CSP, X-Frame-Options).

---

## 4. Copias de Seguridad

| Qué se respalda | Método | Frecuencia | Dónde | Costo |
|---|---|---|---|---|
| Base de datos | Template automático de Railway (dump + compresión + encriptación AES-256) | Diario | Cloudflare R2 (10GB gratis) | $0 |
| Imágenes | Cloudinary las replica automáticamente | Continuo | CDN global de Cloudinary | $0 |
| Código fuente | Git + GitHub | Cada cambio | GitHub | $0 |

El servicio de backup hace dump diario de la base de datos, lo comprime con gzip, opcionalmente lo encripta con AES-256-CBC, lo sube a Cloudflare R2, y limpia backups antiguos automáticamente (retención de 7 días por defecto). Si la subida falla, reintenta automáticamente.

---

## 5. Pasarelas de Pago

### 5.1 Culqi — Pagos Nacionales (RECOMENDADA)

| Aspecto | Detalle |
|---|---|
| Comisión tarjetas nacionales | 3.44% + IGV por transacción |
| Comisión tarjetas internacionales | 3.99% + $0.20 + IGV |
| Costo mensual | S/0 — sin costo fijo |
| Depósito | Al día siguiente con cuenta BCP; 4 días hábiles con otros bancos |
| Tarjetas | Visa, Mastercard |
| Billeteras digitales | Yape, Plin, BBVA Wallet, Scotiabank, Interbank, Ligo, BanBif |
| Seguridad | Certificación PCI DSS, motor antifraude con Machine Learning |
| Respaldo | Grupo Credicorp |

### 5.2 PayPal — Pagos Internacionales (RECOMENDADA)

| Aspecto | Detalle |
|---|---|
| Comisión | ~5.4% + tarifa fija (varía por país) |
| Monedas | USD, EUR y más de 25 monedas |
| Retiro en Perú | Vía Interbank (3-5 días hábiles) |
| Cobertura | +200 países |
| Protección | Seguro al vendedor incluido |

### 5.3 PagoEfectivo — Alternativo (Opcional)

Para clientes que prefieren pagar en efectivo en agentes bancarios. Aproximadamente el 14% de compradores online en Perú usa este método.

### 5.4 Estrategia de Pagos

| Mercado | Pasarela | Métodos |
|---|---|---|
| Clientes peruanos | Culqi | Tarjetas Visa/MC + Yape + Plin + billeteras digitales |
| Turistas extranjeros | PayPal | USD, EUR + más de 25 monedas |
| Pago alternativo | PagoEfectivo | Agentes bancarios, efectivo |

---

## 6. Web Pública — Lo que ve el cliente

### 6.1 Páginas y Secciones

**Homepage:**
- Hero con imagen/video principal y buscador de tours.
- Tours destacados (los marcados como "destacados" en el admin).
- Ofertas y promociones vigentes.
- Testimonios verificados.
- Destinos populares.
- Call to action de contacto por WhatsApp.

**Catálogo de Tours:**
- Listado con filtros: destino, duración, precio, categoría (aventura, cultural, relax, familiar).
- Ordenar por precio, popularidad, duración, fecha de salida.
- Vista en tarjetas con foto principal, nombre, precio y duración.
- Buscador con autocompletado.

**Ficha de Tour (una por cada tour):**
- Galería de fotos inmersiva con lightbox fullscreen (PhotoSwipe): zoom, swipe entre fotos, pinch-to-zoom en móvil, captions dinámicos.
- Descripción completa.
- Itinerario día a día.
- Qué incluye / qué no incluye.
- Precios por persona (adulto/niño).
- Fechas de salida disponibles con cupos.
- Botón de reservar.
- Mapa del destino.
- Tours relacionados.

**Reserva y Checkout:**
- Selector de fecha de salida, número de personas, extras.
- Cotizador en tiempo real (precio se actualiza al modificar opciones).
- Selector de moneda: PEN / USD.
- Pasarela Culqi para pagos nacionales.
- PayPal para pagos internacionales.
- Opción de pago parcial: seña (%) + saldo antes del viaje.
- Confirmación inmediata por email con voucher PDF.

**Página de Pago Personalizado (generada por el vendedor):**
- Página profesional con marca de la agencia.
- Descripción completa del servicio personalizado.
- Itinerario, incluye/no incluye.
- Monto a pagar (con opción de seña).
- Botones de pago: Culqi, PayPal, Yape/Plin.
- Fecha de vencimiento del link.
- Confirmación automática tras el pago.

**Formulario de Tour Personalizado:**
- Destinos preferidos, fechas, número de personas, actividades.
- Presupuesto aproximado.
- Comentarios y solicitudes especiales.
- Se notifica al equipo y se crea una cotización en el admin.

**Blog:**
- Guías de viaje optimizadas para SEO.
- Tips para viajeros.
- Cada post tiene: título, imagen, contenido, categoría, autor.

**Páginas Informativas:**
- Sobre Nosotros (equipo, certificaciones MINCETUR, historia).
- Preguntas Frecuentes (FAQ).
- Términos y Condiciones.
- Política de Cancelación.
- Contacto.

**Elementos Globales:**
- Menú de navegación (editable desde el admin).
- Footer con datos de contacto, redes sociales, certificaciones.
- Botón de WhatsApp flotante.
- Selector de idioma (español/inglés).
- Diseño 100% responsive (móvil, tablet, desktop).

### 6.2 SEO

- Server-Side Rendering (SSR) con Next.js para que Google indexe todo el contenido.
- Meta tags personalizables por tour y página desde el admin.
- Sitemap XML generado automáticamente.
- Schema markup para tours (Google muestra precios, reviews, disponibilidad en resultados).
- URLs amigables por idioma: /es/tours/cusco-magico, /en/tours/magical-cusco.
- Imágenes optimizadas automáticamente (Cloudinary) para carga rápida.

---

## 7. Panel de Administración — Lo que ve el equipo

### 7.1 Dashboard Principal

Al entrar al admin, el equipo ve un resumen en tiempo real de la operación:

- Reservas de hoy (nuevas, pendientes, confirmadas).
- Pagos pendientes de verificación (monto total).
- Tours de esta semana (con porcentaje de ocupación).
- Cotizaciones abiertas (cuántas por vencer).
- Últimas reservas (lista rápida con estado).
- Barras de ocupación por tour/fecha.

### 7.2 Módulo: Gestión de Reservas

Centraliza todas las reservas, tanto las que llegan de la web como las que el vendedor crea manualmente.

- Lista de reservas con filtros: fecha, tour, estado, cliente, vendedor.
- Estados: Pendiente → Confirmada → Pagada → Completada / Cancelada.
- Detalle: datos del cliente, tour, fecha, personas, monto, método de pago, vendedor.
- Cambiar estado manualmente (ej: confirmar tras verificar transferencia).
- Notas internas por reserva (visibles solo para el equipo).
- Exportar a Excel/CSV.
- Historial de cambios (quién modificó qué y cuándo).

Dos tipos de reservas:

| Tipo | Origen | Pago |
|---|---|---|
| Reserva directa | Cliente reserva y paga desde la web | Automático vía Culqi/PayPal |
| Reserva personalizada | Vendedor la crea tras cotización | Link de pago personalizado |

### 7.3 Módulo: Verificación de Pagos

- Panel de pagos con estado en tiempo real (Culqi y PayPal).
- Pagos automáticos: se confirman solos cuando la pasarela notifica éxito.
- Pagos manuales: marcar como pagado tras verificar transferencia/depósito.
- Alertas de pagos fallidos o pendientes por más de 24 horas.
- Historial de transacciones por cliente.
- Conciliación: qué pagos coinciden con qué reservas.
- Resumen diario de ingresos por pasarela.

### 7.4 Módulo: Cotizaciones

- Crear cotización seleccionando: tour, fechas, personas, extras.
- Precio calculado automáticamente según reglas del tour. Editable manualmente si hay acuerdo especial.
- Generar PDF profesional: logo, itinerario, precios, condiciones.
- Enviar por email directamente desde el panel.
- Estados: Borrador → Enviada → Aceptada → Convertida en Reserva → Vencida.
- Seguimiento: recordatorio automático si no responden en X días.
- Convertir cotización aceptada en reserva con un clic.

### 7.5 Módulo: Links de Pago Personalizados

Cuando el vendedor cierra una venta personalizada (por WhatsApp, email, teléfono o presencial), genera un link de pago único que incluye toda la información del servicio.

**El vendedor genera el link así:**

1. Va a "Cotizaciones" o "Reservas" → "Generar Link de Pago".
2. Completa: nombre del servicio, descripción detallada (itinerario, incluye/no incluye, fechas), monto total en PEN o USD, opción de pago parcial (seña), fecha de vencimiento del link, datos del cliente.
3. El sistema genera un link único (ej: agencia.com/pago/abc123xyz).
4. El vendedor lo envía por WhatsApp, email o cualquier medio.

**Lo que ve el cliente al abrir el link:**

Página profesional con marca de la agencia mostrando: nombre del servicio, descripción completa, itinerario día a día, qué incluye y qué no incluye, monto total y desglose de seña/saldo, botones de pago (Culqi, PayPal, Yape/Plin), condiciones de pago y cancelación, y fecha de vencimiento del link.

**Después del pago:**

- Se confirma automáticamente (mismo flujo que una reserva normal).
- Cliente recibe email con voucher PDF.
- Reserva aparece en el panel como "Pagada".
- Si se configuró seña, el sistema queda pendiente del saldo y envía recordatorio automático antes del viaje.

**Beneficios:**

| Beneficio | Detalle |
|---|---|
| Profesionalismo | Página de pago con marca de la agencia, no un número de cuenta |
| Seguridad | Pago pasa por Culqi/PayPal, no por transferencia informal |
| Trazabilidad | Todo queda registrado: quién generó el link, cuándo se pagó, qué se vendió |
| Automatización | Confirmación, voucher y registro se hacen solos |
| Flexibilidad | Funciona para cualquier servicio, no solo tours del catálogo |
| Pagos parciales | Seña + saldo en fechas diferentes |

### 7.6 Módulo: Ocupación de Tours

- Calendario visual con todas las salidas programadas.
- Barra de ocupación por salida: cupos vendidos vs disponibles.
- Código de colores: verde (>70%), amarillo (30-70%), rojo (<30%).
- Alerta cuando un tour está por llenarse.
- Alerta cuando un tour tiene baja ocupación cerca de la fecha.
- Histórico de ocupación por tour y temporada.

### 7.7 Módulo: Gestión de Tours

- CRUD completo: crear, editar, duplicar, eliminar tours.
- Cada tour sigue la plantilla fija (ver sección 8).
- Precios dinámicos: temporada alta/baja, adulto/niño, grupo.
- Fechas de salida con cupos máximos por fecha.
- Activar/desactivar tours sin eliminarlos.
- Duplicar un tour existente para crear variantes rápido.
- Multi-idioma: versión español e inglés de cada tour.

### 7.8 Módulo: Editor de Contenido Web

- Crear y editar tours siguiendo la plantilla fija.
- Subir fotos con drag & drop (se optimizan automáticamente vía Cloudinary).
- Ordenar fotos arrastrándolas en la galería.
- Editar textos de cualquier página (inicio, nosotros, FAQ, términos).
- Agregar, quitar o reordenar ítems del menú de navegación (navbar).
- Publicar/despublicar contenido (no se ve en la web hasta que se publique).
- Vista previa antes de publicar.
- Blog: crear y editar posts con editor visual tipo Word.
- Gestionar testimonios y reviews.

**Regla fundamental:** El equipo rellena campos en una plantilla. El diseño es siempre el mismo. No pueden "romper" el diseño porque no tienen acceso al código ni al layout, solo al contenido.

### 7.9 Módulo: Clientes

- Base de datos: nombre, email, teléfono, país, idioma.
- Historial: tours comprados, cotizaciones, pagos realizados.
- Notas internas por cliente.
- Búsqueda y filtros.
- Exportar a Excel.
- Se crea automáticamente al reservar o recibir cotización.

### 7.10 Módulo: Notificaciones y Emails

Emails automáticos configurables:

| Email | Cuándo se envía | Contenido |
|---|---|---|
| Confirmación de reserva | Al confirmar pago | Voucher PDF + detalles del tour + contacto de la agencia |
| Recordatorio pre-viaje | 7, 3 y 1 día antes (configurable) | Detalles del tour, punto de encuentro, qué llevar |
| Solicitud de review | 2 días después del tour | Link para dejar opinión |
| Cotización enviada | Al enviar cotización | PDF con itinerario y precios |
| Recordatorio cotización | Si no responde en X días | Recordatorio amable con link a la cotización |
| Recordatorio saldo | X días antes del viaje | Para pagos parciales, recordar el saldo pendiente |

Otras funcionalidades: plantillas de email editables desde el panel (logo, colores, textos), notificación interna al equipo cuando hay nueva reserva o pago, e integración con Microsoft 365 Business Basic (correo corporativo existente).

---

## 8. Sistema de Plantillas para Tours

Cada tour sigue una plantilla fija con 7 secciones. Esto garantiza que todos los tours tengan el mismo diseño profesional, sin importar quién del equipo lo cree.

### Sección 1: Información Básica

| Campo | Ejemplo |
|---|---|
| Nombre del tour | "Cusco Mágico 4 Días / 3 Noches" |
| Descripción corta | "Descubre la ciudad imperial y sus alrededores" |
| Descripción larga | Párrafo detallado para la ficha del tour |
| Categoría | Aventura, cultural, relax, familiar |
| Duración | 4D/3N |
| Destino | Cusco |
| Dificultad | Fácil, moderado, exigente |

### Sección 2: Galería de Fotos

| Campo | Detalle |
|---|---|
| Imagen principal | La que aparece en el catálogo (se marca con estrella) |
| Galería | Múltiples fotos, se ordenan arrastrando |
| Optimización | Automática vía Cloudinary |

### Sección 3: Itinerario Día a Día

| Campo | Detalle |
|---|---|
| Día N — Título | Nombre corto (ej: "Llegada a Cusco") |
| Día N — Descripción | Detalle de actividades |
| Botón "Agregar día" | Tantos días como dure el tour |

### Sección 4: Precios

| Campo | Detalle |
|---|---|
| Precio base adulto | En PEN y USD |
| Precio niño | Porcentaje o monto fijo |
| Temporada alta | Recargo + fechas de vigencia |
| Descuento grupo | A partir de X personas |
| Promoción | Descuento con fecha de vencimiento (opcional) |

### Sección 5: Incluye / No Incluye

| Campo | Detalle |
|---|---|
| Incluye | Lista de ítems (transporte, hotel, guía, comidas, entradas) |
| No incluye | Lista de ítems (vuelos, propinas, seguro de viaje) |

### Sección 6: Fechas de Salida

| Campo | Detalle |
|---|---|
| Fecha de salida | Seleccionar del calendario |
| Cupo máximo | Número de personas |
| Estado | Disponible / Agotado / Cancelado |

### Sección 7: Configuración

| Campo | Detalle |
|---|---|
| Estado | Borrador / Publicado / Archivado |
| Destacado | Sí/No (aparece en la homepage) |
| SEO — Meta título | Para Google (con sugerencia automática) |
| SEO — Meta descripción | Para Google (con sugerencia automática) |
| Idioma | Versión español e inglés |

---

## 9. Roles y Permisos

### 9.1 Tabla de Permisos (3-5 usuarios)

| Módulo | Administrador (Dueño) | Vendedor / Operaciones | Marketing / Contenido |
|---|---|---|---|
| Dashboard | Completo | Métricas básicas | Métricas básicas |
| Reservas | Total | Total | Solo lectura |
| Pagos | Total | Solo lectura | Sin acceso |
| Cotizaciones | Total | Total | Sin acceso |
| Links de pago | Total | Total | Sin acceso |
| Gestión de tours | Total | Solo lectura | Edición (no puede eliminar) |
| Editor de la web | Total | Sin acceso | Total |
| Navbar / Menú | Total | Sin acceso | Total |
| Clientes | Total | Total | Sin acceso |
| Ocupación | Total | Solo lectura | Solo lectura |
| Emails / Notificaciones | Total | Sus cotizaciones | Sin acceso |
| Usuarios y roles | Total | Sin acceso | Sin acceso |

### 9.2 Seguridad del Panel

| Medida | Detalle |
|---|---|
| Login | Email + contraseña con JWT. Opción de login con Microsoft 365 corporativa. |
| Rate limiting | Bloqueo tras 5 intentos fallidos por 15 minutos. |
| Registro de actividad | Quién editó qué tour, cambió qué precio, confirmó qué pago. |
| Sesiones | Cierre automático por inactividad (configurable). |
| URL protegida | /admin con autenticación obligatoria. |
| Permisos granulares | Cada rol ve solo lo que necesita. |

---

## 10. Flujos de Trabajo Principales

### 10.1 Cliente reserva y paga online (automático)

1. Cliente elige tour en la web. Selecciona fecha, personas, extras. Ve precio en tiempo real.
2. Cliente paga con Culqi o PayPal. Datos de tarjeta van directo a la pasarela.
3. Pago confirmado automáticamente. Webhook notifica al servidor. Reserva pasa a "Pagada".
4. Cliente recibe email de confirmación con voucher PDF.
5. Equipo ve la reserva en el panel. Notificación interna al equipo.

**Este flujo es 100% automático.**

### 10.2 Cotización personalizada → Link de pago

1. Cliente solicita cotización (web, WhatsApp, email, teléfono, presencial).
2. Vendedor crea cotización en el panel. Precio automático o editado manualmente.
3. Se genera PDF profesional y se envía por email.
4. Seguimiento automático si no responden en X días.
5. Cliente acepta. Vendedor convierte en reserva con un clic.
6. Vendedor genera link de pago personalizado con toda la información del servicio.
7. Vendedor envía el link por WhatsApp o email.
8. Cliente abre el link, ve toda la información y paga.
9. Pago se confirma automáticamente. Voucher PDF enviado. Reserva marcada como pagada.
10. Si se configuró seña, el sistema queda pendiente del saldo con recordatorio automático.

### 10.3 Agregar tour nuevo a la web

1. Ir a Tours → Nuevo Tour (o duplicar uno existente).
2. Llenar la plantilla: info básica, itinerario, incluye/no incluye.
3. Subir fotos (se optimizan automáticamente). Ordenarlas arrastrando.
4. Configurar precios y fechas de salida con cupos.
5. Vista previa → Publicar.
6. El tour aparece automáticamente en el catálogo con el mismo diseño que todos los demás.

### 10.4 Editar el menú de navegación (navbar)

1. Ir a Configuración → Menú de Navegación.
2. Clic en "Agregar ítem". Nombre, URL, posición (arrastrando).
3. Guardar. El nuevo ítem aparece inmediatamente en la web.

---

## 11. Stack Tecnológico

| Capa | Tecnología | Rol en el sistema |
|---|---|---|
| Frontend + Backend | Next.js 14 + React + Tailwind CSS | App única: web pública + panel admin + API |
| Tipado | tRPC | Comunicación segura y tipada entre frontend y backend |
| Base de Datos | PostgreSQL + Prisma ORM | Almacena todo: tours, reservas, pagos, clientes, contenido |
| Autenticación | NextAuth.js | Login seguro + roles + sesiones para el admin |
| Imágenes | Cloudinary | Almacenamiento + optimización + CDN de fotos |
| Pagos nacionales | Culqi SDK | Tarjetas + Yape/Plin para clientes peruanos |
| Pagos internacionales | PayPal REST API | USD/EUR para turistas extranjeros |
| Hosting | Railway (Hobby) | App + DB en red privada ($5/mes) |
| Seguridad | Cloudflare (gratis) | DDoS + WAF + SSL + CDN |
| Backups | Template Railway → Cloudflare R2 | Backup diario automático encriptado |
| Email transaccional | Resend | Confirmaciones, vouchers, recordatorios |
| Email corporativo | Microsoft 365 (existente) | Comunicación interna y con clientes |
| Repositorio | GitHub | Control de versiones + historial |
| PDFs | React-PDF o jsPDF | Vouchers y cotizaciones en PDF |

---

## 12. Fases de Desarrollo

### Fase 1 — Fundamentos y Diseño (Semanas 1-3)

- Diseño UI/UX completo en Figma (web pública + panel admin).
- Diseño de la base de datos (tours, reservas, pagos, clientes, cotizaciones, contenido).
- Setup del proyecto (Next.js, PostgreSQL, GitHub, Railway).
- Identidad visual web (colores, tipografía, componentes).
- Mapa del sitio y flujos de usuario definitivos.

### Fase 2 — Panel Admin: Base + Tours + Editor (Semanas 4-7)

- Login seguro con NextAuth.js (opción Microsoft 365).
- Sistema de roles (admin, vendedor, marketing).
- Dashboard principal con métricas en tiempo real.
- CRUD de tours con plantilla completa (7 secciones).
- Subida y gestión de fotos con Cloudinary.
- Precios dinámicos y temporadas.
- Fechas de salida con cupos.
- Editor de contenido (páginas, textos, FAQ, blog).
- Gestión del navbar.
- Multi-idioma (español/inglés).
- Vista previa antes de publicar.

### Fase 3 — Web Pública + Pagos + Cotizaciones (Semanas 8-11)

- Homepage, catálogo, fichas de tour, páginas informativas.
- Sistema de reservas con calendario y selector de opciones.
- Integración Culqi (tarjetas + Yape/Plin).
- Integración PayPal.
- Checkout completo con confirmación por email.
- Sistema de cotizaciones (crear, PDF, enviar, seguimiento).
- Generador de links de pago personalizados.
- Página de pago personalizada (lo que ve el cliente).
- Pagos parciales (seña + saldo).
- Panel de reservas con verificación de pagos.
- Base de datos de clientes con historial.
- Emails automáticos (confirmación, voucher PDF, recordatorios).
- Formulario de tour personalizado.
- Multi-idioma en la web pública.

### Fase 4 — Seguridad, Ocupación y Lanzamiento (Semanas 12-14)

- Reporte de ocupación (calendario + barras + alertas).
- Configuración de Cloudflare (DDoS, WAF, SSL, CDN).
- Configuración de backups automáticos.
- Exportación a Excel/CSV.
- Testing completo (pagos, reservas, admin, responsive, multi-idioma).
- Optimización SEO (meta tags, sitemap, schema markup).
- Configuración de dominio y hosting en producción.
- Capacitación al equipo de la agencia.
- Documentación del sistema.

### Fase 5 — Post-Lanzamiento (Semanas 15-16+)

- Monitoreo y corrección de bugs.
- Ajustes basados en feedback real del equipo y clientes.
- Google Analytics y Search Console.
- Plan de mantenimiento mensual.

**Tiempo total estimado: 14-16 semanas para MVP en producción.**

---

## 13. Costos

### Costos Fijos Mensuales

| Servicio | Costo |
|---|---|
| Railway Hobby (App + DB) | $5/mes |
| Cloudflare (DDoS + SSL + CDN) | $0 |
| Cloudinary (imágenes, tier gratuito) | $0 |
| Cloudflare R2 (backups, 10GB gratis) | $0 |
| Dominio | Ya lo tienen |
| Email corporativo (Microsoft 365) | Ya lo tienen |
| **Total fijo mensual** | **~$5/mes (~$60/año)** |

### Costos Variables (solo cuando hay ventas)

| Pasarela | Comisión |
|---|---|
| Culqi (tarjetas nacionales) | 3.44% + IGV por venta |
| Culqi (tarjetas internacionales) | 3.99% + $0.20 + IGV por venta |
| PayPal (pagos internacionales) | ~5.4% por venta |

Las pasarelas solo cobran cuando hay ventas. Si no hay ingresos, no hay gasto.

---

## 14. Entregables

- Web pública responsive en español e inglés.
- Panel de administración completo con todos los módulos.
- Sistema de plantillas para tours.
- Generador de links de pago personalizados.
- Sistema de cotizaciones con PDF.
- Integración Culqi + PayPal funcional.
- Sistema de reservas con verificación de pagos.
- Reporte de ocupación de tours.
- Configuración de Cloudflare (seguridad).
- Backups automáticos configurados.
- Emails transaccionales configurados.
- Documentación técnica del sistema.
- Manual de usuario del panel admin.
- Capacitación al equipo de la agencia.
- 30 días de soporte post-lanzamiento incluidos.

---

## 15. Próximos Pasos

1. Validar esta propuesta y resolver dudas pendientes.
2. Definir alcance exacto del MVP: funcionalidades prioritarias para el lanzamiento.
3. Iniciar diseño UI/UX en Figma con la identidad de marca de la agencia.
4. Afiliación a pasarelas de pago: Culqi (requiere RUC activo + web con SSL) y PayPal Business.
5. Configurar Cloudflare con el dominio existente.
6. Kickoff de desarrollo.

---

## 16. Futuras Mejoras (Post-Lanzamiento)

Funcionalidades que se pueden agregar conforme el negocio crezca:

- Control de gastos y proveedores (hoteles, transporte, guías).
- Cálculo de ganancias reales por tour (ingresos - costos).
- Comisiones de vendedores.
- Facturación electrónica SUNAT.
- Flujo de caja (dinero que entra y sale).
- Integración con WhatsApp Business API.
- App móvil para el equipo.
- Reportes financieros avanzados con proyecciones.
- CRM avanzado con pipeline de ventas.
- Sistema de reviews automatizado.

---

*Propuesta elaborada en Marzo 2026. Datos de pasarelas de pago son referenciales y pueden variar. Consultar directamente con cada proveedor para tarifas actualizadas.*
