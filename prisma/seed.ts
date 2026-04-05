import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Production guard: prevent accidental data wipe
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "🚫 SEED CANNOT RUN IN PRODUCTION. This script deletes ALL data. " +
      "If you really need to seed production, set NODE_ENV=development first."
    );
  }

  console.log("🌱 Iniciando seed...");

  // ============================================================
  // LIMPIAR DATOS EXISTENTES (orden inverso de dependencias)
  // ============================================================
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.paymentLink.deleteMany();
  await prisma.client.deleteMany();
  await prisma.tourDeparture.deleteMany();
  await prisma.tourSeason.deleteMany();
  await prisma.tourInclude.deleteMany();
  await prisma.tourPricing.deleteMany();
  await prisma.itineraryDay.deleteMany();
  await prisma.tourImage.deleteMany();
  await prisma.tour.deleteMany();
  await prisma.homeSection.deleteMany();
  await prisma.navItem.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.page.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("  Datos anteriores eliminados");

  // ============================================================
  // 1. USUARIOS
  // ============================================================
  const passwordAdmin = await hash("admin123", 12);
  const passwordVendedor = await hash("vendedor123", 12);
  const passwordMarketing = await hash("marketing123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@agencia.com",
      passwordHash: passwordAdmin,
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      name: "Carlos Vendedor",
      email: "vendedor@agencia.com",
      passwordHash: passwordVendedor,
      role: "SALES",
    },
  });

  await prisma.user.create({
    data: {
      name: "Maria Marketing",
      email: "marketing@agencia.com",
      passwordHash: passwordMarketing,
      role: "MARKETING",
    },
  });

  console.log("  3 usuarios creados");

  // ============================================================
  // 2. TOUR: Cusco Magico 4D/3N
  // ============================================================
  const tour = await prisma.tour.create({
    data: {
      slug: "cusco-magico-4d-3n",
      status: "PUBLISHED",
      isFeatured: true,
      category: "Cultural",
      difficulty: "MODERATE",
      durationDays: 4,
      durationNights: 3,
      destination: "Cusco",
      nameEs: "Cusco Magico 4D/3N",
      nameEn: "Magical Cusco 4D/3N",
      shortDescEs:
        "Descubre la magia del imperio incaico en un viaje inolvidable por Cusco, el Valle Sagrado y Machu Picchu.",
      shortDescEn:
        "Discover the magic of the Inca empire on an unforgettable journey through Cusco, the Sacred Valley and Machu Picchu.",
      longDescEs:
        "Sumérgete en la rica historia y cultura del Perú con nuestro tour Cusco Mágico. Durante 4 días y 3 noches, explorarás la ciudad imperial de Cusco con su impresionante arquitectura colonial e incaica, recorrerás el místico Valle Sagrado visitando Pisac y Ollantaytambo, y culminarás con la maravilla del mundo: Machu Picchu. Incluye guías bilingües expertos, transporte turístico de primera clase y alojamiento en hoteles seleccionados.",
      longDescEn:
        "Immerse yourself in Peru's rich history and culture with our Magical Cusco tour. Over 4 days and 3 nights, you'll explore the imperial city of Cusco with its stunning colonial and Inca architecture, traverse the mystical Sacred Valley visiting Pisac and Ollantaytambo, and culminate with the world wonder: Machu Picchu. Includes expert bilingual guides, first-class tourist transport and accommodation in selected hotels.",
      metaTitleEs: "Tour Cusco Magico 4 Dias 3 Noches | Agencia Peru Tours",
      metaDescEs:
        "Explora Cusco, Sacsayhuaman, Valle Sagrado y Machu Picchu en 4 dias. Tour todo incluido con guia bilingue.",
      metaTitleEn: "Magical Cusco Tour 4 Days 3 Nights | Peru Tours Agency",
      metaDescEn:
        "Explore Cusco, Sacsayhuaman, Sacred Valley and Machu Picchu in 4 days. All-inclusive tour with bilingual guide.",
    },
  });

  // Imagenes del tour
  await prisma.tourImage.createMany({
    data: [
      {
        tourId: tour.id,
        cloudinaryId: "tours/cusco-magico-1",
        url: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80",
        altEs: "Vista panoramica de Cusco",
        altEn: "Panoramic view of Cusco",
        isPrimary: true,
        sortOrder: 0,
      },
      {
        tourId: tour.id,
        cloudinaryId: "tours/cusco-magico-2",
        url: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80",
        altEs: "Machu Picchu al amanecer",
        altEn: "Machu Picchu at sunrise",
        isPrimary: false,
        sortOrder: 1,
      },
      {
        tourId: tour.id,
        cloudinaryId: "tours/cusco-magico-3",
        url: "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=800&q=80",
        altEs: "Valle Sagrado de los Incas",
        altEn: "Sacred Valley of the Incas",
        isPrimary: false,
        sortOrder: 2,
      },
      {
        tourId: tour.id,
        cloudinaryId: "tours/cusco-magico-4",
        url: "https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?w=800&q=80",
        altEs: "Sacsayhuaman fortaleza",
        altEn: "Sacsayhuaman fortress",
        isPrimary: false,
        sortOrder: 3,
      },
    ],
  });

  // Itinerario 4 dias
  await prisma.itineraryDay.createMany({
    data: [
      {
        tourId: tour.id,
        dayNumber: 1,
        titleEs: "Llegada a Cusco - City Tour",
        titleEn: "Arrival in Cusco - City Tour",
        descriptionEs:
          "Recepcion en el aeropuerto Alejandro Velasco Astete y traslado al hotel. Por la tarde, City Tour visitando la Plaza de Armas, la Catedral, el Templo del Sol (Qoricancha), y las ruinas cercanas de Sacsayhuaman, Qenqo, Puca Pucara y Tambomachay. Cena de bienvenida con show de danzas tipicas.",
        descriptionEn:
          "Airport pickup at Alejandro Velasco Astete and transfer to hotel. In the afternoon, City Tour visiting the Plaza de Armas, the Cathedral, the Temple of the Sun (Qoricancha), and nearby ruins of Sacsayhuaman, Qenqo, Puca Pucara and Tambomachay. Welcome dinner with traditional dance show.",
      },
      {
        tourId: tour.id,
        dayNumber: 2,
        titleEs: "Valle Sagrado - Pisac y Ollantaytambo",
        titleEn: "Sacred Valley - Pisac and Ollantaytambo",
        descriptionEs:
          "Salida temprana hacia el Valle Sagrado. Visita al mercado artesanal y las ruinas de Pisac con sus impresionantes terrazas agricolas. Almuerzo buffet en Urubamba. Por la tarde, exploracion de la fortaleza de Ollantaytambo, uno de los pocos lugares donde los incas derrotaron a los espanoles. Noche en Ollantaytambo.",
        descriptionEn:
          "Early departure to the Sacred Valley. Visit to the artisan market and Pisac ruins with their impressive agricultural terraces. Buffet lunch in Urubamba. In the afternoon, exploration of the Ollantaytambo fortress, one of the few places where the Incas defeated the Spanish. Overnight in Ollantaytambo.",
      },
      {
        tourId: tour.id,
        dayNumber: 3,
        titleEs: "Machu Picchu - Maravilla del Mundo",
        titleEn: "Machu Picchu - World Wonder",
        descriptionEs:
          "Tren panoramico de Ollantaytambo a Aguas Calientes. Ascenso en bus a la ciudadela de Machu Picchu. Tour guiado de 2.5 horas por el Templo del Sol, el Intihuatana, el Templo de las Tres Ventanas y mas. Tiempo libre para explorar y tomar fotos. Retorno en tren a Cusco.",
        descriptionEn:
          "Panoramic train from Ollantaytambo to Aguas Calientes. Bus ascent to the Machu Picchu citadel. 2.5-hour guided tour of the Temple of the Sun, Intihuatana, Temple of the Three Windows and more. Free time to explore and take photos. Return by train to Cusco.",
      },
      {
        tourId: tour.id,
        dayNumber: 4,
        titleEs: "Retorno - Despedida",
        titleEn: "Return - Farewell",
        descriptionEs:
          "Desayuno en el hotel. Manana libre para compras en el mercado de San Pedro o visitar museos. Traslado al aeropuerto segun horario de vuelo. Fin de nuestros servicios.",
        descriptionEn:
          "Breakfast at the hotel. Free morning for shopping at San Pedro market or visiting museums. Airport transfer according to flight schedule. End of our services.",
      },
    ],
  });

  // Pricing
  await prisma.tourPricing.create({
    data: {
      tourId: tour.id,
      basePriceUsdAdult: 499.0,
      basePriceUsdChild: 349.0,
      groupDiscountPercent: 10,
      groupMinPersons: 4,
    },
  });

  // Incluye / Excluye
  await prisma.tourInclude.createMany({
    data: [
      { tourId: tour.id, type: "INCLUDE", textEs: "Transporte turistico privado", textEn: "Private tourist transport", sortOrder: 0 },
      { tourId: tour.id, type: "INCLUDE", textEs: "Guia profesional bilingue (espanol/ingles)", textEn: "Bilingual professional guide (Spanish/English)", sortOrder: 1 },
      { tourId: tour.id, type: "INCLUDE", textEs: "Entradas a todos los sitios arqueologicos", textEn: "Entrance fees to all archaeological sites", sortOrder: 2 },
      { tourId: tour.id, type: "INCLUDE", textEs: "Alojamiento 3 noches en hotel 3 estrellas", textEn: "3-night accommodation in 3-star hotel", sortOrder: 3 },
      { tourId: tour.id, type: "INCLUDE", textEs: "Desayunos diarios + 1 cena de bienvenida", textEn: "Daily breakfasts + 1 welcome dinner", sortOrder: 4 },
      { tourId: tour.id, type: "EXCLUDE", textEs: "Vuelos domesticos e internacionales", textEn: "Domestic and international flights", sortOrder: 0 },
      { tourId: tour.id, type: "EXCLUDE", textEs: "Almuerzos y cenas no mencionados", textEn: "Lunches and dinners not mentioned", sortOrder: 1 },
      { tourId: tour.id, type: "EXCLUDE", textEs: "Seguro de viaje personal", textEn: "Personal travel insurance", sortOrder: 2 },
    ],
  });

  // Fechas de salida
  await prisma.tourDeparture.createMany({
    data: [
      { tourId: tour.id, departureDate: new Date("2026-04-15"), maxCapacity: 16, bookedCount: 4, status: "AVAILABLE" },
      { tourId: tour.id, departureDate: new Date("2026-05-10"), maxCapacity: 16, bookedCount: 0, status: "AVAILABLE" },
      { tourId: tour.id, departureDate: new Date("2026-06-20"), maxCapacity: 16, bookedCount: 12, status: "AVAILABLE" },
    ],
  });

  // Temporada alta
  await prisma.tourSeason.create({
    data: {
      tourId: tour.id,
      name: "Temporada Alta",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-09-30"),
      surchargePercent: 15,
    },
  });

  console.log("  Tour 'Cusco Magico 4D/3N' creado con todos los datos");

  // ============================================================
  // 3. FAQs
  // ============================================================
  await prisma.fAQ.createMany({
    data: [
      {
        questionEs: "¿Cual es la mejor epoca para visitar Machu Picchu?",
        questionEn: "What is the best time to visit Machu Picchu?",
        answerEs: "La temporada seca (mayo a octubre) es ideal para visitar Machu Picchu, con cielos despejados y menos lluvia. Sin embargo, Machu Picchu es hermoso todo el año. La temporada de lluvias (noviembre a abril) tiene menos turistas y precios mas bajos.",
        answerEn: "The dry season (May to October) is ideal for visiting Machu Picchu, with clear skies and less rain. However, Machu Picchu is beautiful year-round. The rainy season (November to April) has fewer tourists and lower prices.",
        category: "Destinos",
        sortOrder: 0,
      },
      {
        questionEs: "¿Necesito vacunas para viajar a Peru?",
        questionEn: "Do I need vaccines to travel to Peru?",
        answerEs: "No se requieren vacunas obligatorias para ingresar a Peru. Sin embargo, se recomienda la vacuna contra la fiebre amarilla si planea visitar la selva amazonica. Consulte con su medico sobre vacunas contra hepatitis A/B y tetanos.",
        answerEn: "No mandatory vaccines are required to enter Peru. However, yellow fever vaccine is recommended if you plan to visit the Amazon jungle. Consult your doctor about hepatitis A/B and tetanus vaccines.",
        category: "Salud",
        sortOrder: 1,
      },
      {
        questionEs: "¿Como es el mal de altura y como prevenirlo?",
        questionEn: "What is altitude sickness and how to prevent it?",
        answerEs: "El mal de altura (soroche) puede afectar a visitantes en Cusco (3,400 m). Recomendamos: descansar el primer dia, beber mucho liquido, comer ligero, tomar mate de coca y evitar el alcohol. Si los sintomas persisten, tenemos oxigeno disponible.",
        answerEn: "Altitude sickness (soroche) can affect visitors in Cusco (3,400m). We recommend: resting on the first day, drinking plenty of fluids, eating light, drinking coca tea and avoiding alcohol. If symptoms persist, we have oxygen available.",
        category: "Salud",
        sortOrder: 2,
      },
      {
        questionEs: "¿Que formas de pago aceptan?",
        questionEn: "What payment methods do you accept?",
        answerEs: "Aceptamos tarjetas de credito/debito (Visa, Mastercard) a traves de Culqi, pagos con Yape, PayPal para pagos internacionales en dolares, transferencia bancaria y efectivo en nuestras oficinas. Puede pagar una sena del 30% para reservar y el saldo antes del viaje.",
        answerEn: "We accept credit/debit cards (Visa, Mastercard) through Culqi, Yape payments, PayPal for international payments in dollars, bank transfer and cash at our offices. You can pay a 30% deposit to book and the balance before the trip.",
        category: "Pagos",
        sortOrder: 3,
      },
      {
        questionEs: "¿Cual es la politica de cancelacion?",
        questionEn: "What is the cancellation policy?",
        answerEs: "Cancelacion gratuita hasta 15 dias antes de la fecha de salida (reembolso completo menos gastos bancarios). Entre 14 y 7 dias: reembolso del 50%. Menos de 7 dias: no hay reembolso. En caso de fuerza mayor, reprogramamos sin costo adicional.",
        answerEn: "Free cancellation up to 15 days before departure date (full refund minus bank fees). Between 14 and 7 days: 50% refund. Less than 7 days: no refund. In case of force majeure, we reschedule at no additional cost.",
        category: "Politicas",
        sortOrder: 4,
      },
    ],
  });

  console.log("  5 FAQs creadas");

  // ============================================================
  // 4. TESTIMONIOS
  // ============================================================
  await prisma.testimonial.createMany({
    data: [
      {
        clientName: "Zhenia Chacaltana",
        country: "Peru",
        tourName: "Cusco Tour",
        rating: 5,
        textEs: "La mejor experiencia de conocer Cusco con un servicio de calidad. Desde que llegamos a Cusco la atencion fue de primera, seguros y los guias excelentes. Gracias por hacernos sentir como familia apoyandonos en todo.",
        textEn: "The best experience discovering Cusco with quality service. From the moment we arrived, the attention was first-class, safe and the guides were excellent. Thank you for making us feel like family.",
        isApproved: true,
        isFeatured: true,
      },
      {
        clientName: "Solange",
        country: "Peru",
        tourName: "Choquequirao",
        rating: 5,
        textEs: "La agencia fue la mejor, cuido de mi persona y todos los detalles de mi viaje a Choquequirao. Fueron muy cuidadosos siempre atentos en todo momento. Volveria a contratarlos si o si para mi siguiente destino.",
        textEn: "The agency was the best, they took care of me and all the details of my trip to Choquequirao. Always very careful and attentive. I would definitely hire them again for my next destination.",
        isApproved: true,
        isFeatured: true,
      },
      {
        clientName: "Christiane West",
        country: "United States",
        tourName: "Palccoyo",
        rating: 5,
        textEs: "Reservamos un tour de ultimo minuto a Palccoyo con Like in House para nuestro grupo de seis (dos adultos y cuatro ninos), y salio muy bien. El equipo fue atento y nos apoyo en todo momento.",
        textEn: "We booked a last-minute Palccoyo tour with Like in House for our group of six (two adults and four kids), and it worked out very well. The team was attentive and supportive throughout.",
        isApproved: true,
        isFeatured: true,
      },
      {
        clientName: "Jonathan Bonilla",
        country: "Peru",
        rating: 5,
        textEs: "Excelente servicio y atencion prestada, cuidan los detalles de tu viaje y estan en constante comunicacion! Especial mencion a Eddy y a Fernando por estar al pendiente, altamente recomendable esta agencia.",
        textEn: "Excellent service and attention, they take care of every detail of your trip and are in constant communication! Special mention to Eddy and Fernando. Highly recommended agency.",
        isApproved: true,
        isFeatured: true,
      },
      {
        clientName: "Daryl Sandoval",
        country: "Peru",
        rating: 5,
        textEs: "El servicio es de calidad. Personal capacitado y profesional. Tengo el gusto de conocer a alguno de sus colaboradores y conozco la vocacion de servicio e innovaciones de la empresa. Sin duda, de los mejores.",
        textEn: "Quality service. Trained and professional staff. I know the service vocation and innovations of the company. Without a doubt, one of the best.",
        isApproved: true,
        isFeatured: false,
      },
      {
        clientName: "Elvia Rosa Villegas",
        country: "Peru",
        rating: 5,
        textEs: "Muy buena la atencion desde que llegamos hasta nuestro regreso. La verdad recomiendo esta agencia.",
        textEn: "Very good attention from arrival until our return. I truly recommend this agency.",
        isApproved: true,
        isFeatured: false,
      },
      {
        clientName: "Catalina Vargas",
        country: "Peru",
        rating: 5,
        textEs: "Muy buena experiencia, todo el tour perfecto desde la llegada hasta el termino.",
        textEn: "Very good experience, the entire tour was perfect from arrival to the end.",
        isApproved: true,
        isFeatured: false,
      },
    ],
  });

  console.log("  7 testimonios reales (Google Reviews) creados");

  // ============================================================
  // 5. NAV ITEMS
  // ============================================================
  await prisma.navItem.createMany({
    data: [
      { labelEs: "Inicio", labelEn: "Home", href: "/", sortOrder: 0 },
      { labelEs: "Tours", labelEn: "Tours", href: "/tours", sortOrder: 1 },
      { labelEs: "Nosotros", labelEn: "About Us", href: "/nosotros", sortOrder: 2 },
      { labelEs: "Blog", labelEn: "Blog", href: "/blog", sortOrder: 3 },
      { labelEs: "FAQ", labelEn: "FAQ", href: "/faq", sortOrder: 4 },
      { labelEs: "Contacto", labelEn: "Contact", href: "/contacto", sortOrder: 5 },
    ],
  });

  console.log("  6 NavItems creados");

  // ============================================================
  // 6. HOME SECTIONS
  // ============================================================
  await prisma.homeSection.createMany({
    data: [
      {
        type: "HERO",
        titleEs: "Descubre el Peru Autentico",
        titleEn: "Discover Authentic Peru",
        subtitleEs: "Tours personalizados con guias expertos locales",
        subtitleEn: "Personalized tours with local expert guides",
        sortOrder: 0,
      },
      {
        type: "FEATURED_TOURS",
        titleEs: "Tours Destacados",
        titleEn: "Featured Tours",
        subtitleEs: "Nuestras experiencias mas populares",
        subtitleEn: "Our most popular experiences",
        sortOrder: 1,
      },
      {
        type: "TESTIMONIALS",
        titleEs: "Lo que dicen nuestros viajeros",
        titleEn: "What our travelers say",
        sortOrder: 2,
      },
      {
        type: "CTA",
        titleEs: "¿Listo para tu proxima aventura?",
        titleEn: "Ready for your next adventure?",
        subtitleEs: "Contactanos y disenaremos el viaje perfecto para ti",
        subtitleEn: "Contact us and we'll design the perfect trip for you",
        sortOrder: 3,
      },
    ],
  });

  console.log("  4 HomeSections creadas");

  // ============================================================
  // 7. BLOG POST
  // ============================================================
  await prisma.blogPost.create({
    data: {
      slug: "10-consejos-viajar-cusco",
      titleEs: "10 Consejos Esenciales para Viajar a Cusco",
      titleEn: "10 Essential Tips for Traveling to Cusco",
      excerptEs: "Prepara tu viaje a la ciudad imperial con estos consejos practicos sobre altitud, clima, transporte y mas.",
      excerptEn: "Prepare your trip to the imperial city with these practical tips about altitude, weather, transport and more.",
      contentEs: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Cusco es una de las ciudades mas visitadas de Sudamerica..." }] }] },
      contentEn: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Cusco is one of the most visited cities in South America..." }] }] },
      category: "Guias de Viaje",
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  console.log("  1 BlogPost creado");

  // ============================================================
  // 8. CLIENTES EJEMPLO
  // ============================================================
  await prisma.client.createMany({
    data: [
      {
        email: "sofia.martinez@gmail.com",
        firstName: "Sofia",
        lastName: "Martinez",
        phone: "+54 11 5555-1234",
        country: "Argentina",
        language: "es",
      },
      {
        email: "john.smith@gmail.com",
        firstName: "John",
        lastName: "Smith",
        phone: "+1 555-987-6543",
        country: "United States",
        language: "en",
      },
    ],
  });

  console.log("  2 clientes creados");

  // ============================================================
  // 9. SETTINGS
  // ============================================================
  const settings = [
    { key: "siteName", value: "Peru Tours Agency" },
    { key: "contactEmail", value: "info@perutours.com" },
    { key: "contactPhone", value: "+51 84 123 456" },
    { key: "whatsappNumber", value: "+51984123456" },
    { key: "address", value: "Av. El Sol 456, Cusco, Peru" },
    { key: "defaultCurrency", value: "USD" },
    { key: "depositPercent", value: 30 },
    { key: "socialFacebook", value: "https://facebook.com/perutours" },
    { key: "socialInstagram", value: "https://instagram.com/perutours" },
  ];

  for (const setting of settings) {
    await prisma.setting.create({
      data: { key: setting.key, value: setting.value as any },
    });
  }

  console.log("  9 settings creados");

  // ============================================================
  console.log("\n✅ Seed completado exitosamente!");
  console.log("  Usuarios:");
  console.log("    admin@agencia.com / admin123 (ADMIN)");
  console.log("    vendedor@agencia.com / vendedor123 (SALES)");
  console.log("    marketing@agencia.com / marketing123 (MARKETING)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    prisma.$disconnect();
    process.exit(1);
  });
