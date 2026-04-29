"use client";

import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ─── Paleta de marca (alineada con el sitio) ─────────────────────────────────
const c = {
  orange:      "#e8411d",
  orangeSoft:  "#fdece6",
  darkRed:     "#1C0D0C",
  teal:        "#2a6f6f",
  tealLight:   "#f0f7f7",
  tealSoft:    "#e0eded",
  cream:       "#f5efe7",
  creamLight:  "#faf7f2",
  white:       "#ffffff",
  text:        "#1a1a1a",
  textSoft:    "#3a3a3a",
  muted:       "#6b7280",
  mutedSoft:   "#9ca3af",
  border:      "#e5ddd3",
  borderLight: "#f0ebe4",
  success:     "#10b981",
  warning:     "#d97706",
};

const S = StyleSheet.create({
  page: {
    backgroundColor: c.white,
    fontFamily: "Helvetica",
    paddingBottom: 90, // espacio reservado para footer
  },

  // ── Barra superior naranja ──────────────────────────────────────────────────
  topBar: {
    height: 6,
    backgroundColor: c.orange,
  },

  // ── Header (logo + badge comprobante) ───────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 26,
    paddingBottom: 18,
  },
  logoImg: {
    width: 64,
    height: 64,
    objectFit: "contain",
  },
  badge: {
    alignItems: "flex-end",
    backgroundColor: c.creamLight,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderLeft: `3 solid ${c.orange}`,
    minWidth: 180,
  },
  badgeLabel: {
    fontSize: 7.5,
    color: c.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  badgeCode: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: c.orange,
    letterSpacing: 0.5,
  },
  badgeDate: {
    fontSize: 7.5,
    color: c.muted,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: c.borderLight,
    marginHorizontal: 40,
  },
  dividerStrong: {
    height: 1.5,
    backgroundColor: c.orange,
    marginHorizontal: 40,
    opacity: 0.55,
  },

  body: {
    paddingHorizontal: 40,
    paddingTop: 22,
  },

  // ── Sección 1: Cliente + Estado ─────────────────────────────────────────────
  twoCol: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },
  card: {
    borderRadius: 10,
    padding: 16,
    flex: 1,
  },
  cardOrange: {
    backgroundColor: c.cream,
    borderLeft: `4 solid ${c.orange}`,
  },
  cardTeal: {
    backgroundColor: c.tealLight,
    borderLeft: `4 solid ${c.teal}`,
  },
  cardTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: c.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "flex-start",
  },
  cardLabel: {
    width: 64,
    fontSize: 8,
    color: c.muted,
  },
  cardValue: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: c.text,
  },

  // Estado pill
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  statusPillPaid: {
    backgroundColor: "#dcfce7",
  },
  statusPillPending: {
    backgroundColor: "#fef3c7",
  },
  statusPillText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },

  // ── Sección 2: Encabezado de servicio ──────────────────────────────────────
  sectionLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: c.orange,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },

  serviceHero: {
    flexDirection: "row",
    backgroundColor: c.cream,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
  },
  serviceImg: {
    width: 130,
    height: "100%",
    objectFit: "cover",
  },
  serviceBody: {
    flex: 1,
    padding: 18,
    justifyContent: "center",
  },
  serviceName: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: c.darkRed,
    marginBottom: 6,
    lineHeight: 1.15,
  },
  serviceDesc: {
    fontSize: 8.5,
    color: c.textSoft,
    lineHeight: 1.4,
    marginBottom: 10,
  },

  // Pills de meta info
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    backgroundColor: c.white,
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pillIcon: {
    fontSize: 8,
    color: c.orange,
  },
  pillLabel: {
    fontSize: 6.5,
    color: c.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginRight: 4,
  },
  pillValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: c.darkRed,
  },

  // ── ¿Qué incluye? ──────────────────────────────────────────────────────────
  includesBox: {
    backgroundColor: c.creamLight,
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
    border: `1 solid ${c.borderLight}`,
  },
  includesTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: c.darkRed,
    marginBottom: 8,
  },
  includesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  includesItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingRight: 10,
    marginBottom: 5,
  },
  includesCheck: {
    fontSize: 9,
    color: c.teal,
    fontFamily: "Helvetica-Bold",
  },
  includesText: {
    flex: 1,
    fontSize: 8.5,
    color: c.textSoft,
    lineHeight: 1.3,
  },

  // ── Resumen de pago ────────────────────────────────────────────────────────
  paymentBox: {
    backgroundColor: c.white,
    borderRadius: 12,
    padding: 18,
    border: `1 solid ${c.border}`,
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentLabel: { fontSize: 9, color: c.muted },
  paymentValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: c.text },
  paymentDivider: {
    height: 1,
    backgroundColor: c.borderLight,
    marginVertical: 10,
  },
  totalBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: c.cream,
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: c.darkRed,
  },
  totalValue: {
    fontSize: 19,
    fontFamily: "Helvetica-Bold",
    color: c.orange,
  },
  pendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fffbf0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    border: `1 solid #f5e4a0`,
  },
  pendingLabel: { fontSize: 8.5, color: c.warning, fontFamily: "Helvetica-Bold" },
  pendingValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: c.warning },

  // ── Nota ───────────────────────────────────────────────────────────────────
  noteBox: {
    backgroundColor: c.tealLight,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    border: `1 solid ${c.tealSoft}`,
    marginBottom: 12,
    flexDirection: "row",
    gap: 10,
  },
  noteIcon: {
    fontSize: 14,
    color: c.teal,
    fontFamily: "Helvetica-Bold",
  },
  noteText: {
    flex: 1,
    fontSize: 8,
    color: c.textSoft,
    lineHeight: 1.5,
  },

  // ── Footer (ancla absoluta abajo) ──────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerInner: {
    backgroundColor: c.darkRed,
    paddingHorizontal: 40,
    paddingTop: 16,
    paddingBottom: 14,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  footerCompany: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: c.white,
    marginBottom: 3,
  },
  footerSub: {
    fontSize: 7,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.4,
    maxWidth: 240,
  },
  footerContacts: {
    alignItems: "flex-end",
    gap: 3,
  },
  footerContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerLabel: {
    fontSize: 7,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  footerValue: {
    fontSize: 8,
    color: c.white,
    fontFamily: "Helvetica-Bold",
  },
  footerWeb: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: c.orange,
  },
  footerLegal: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1 solid rgba(255,255,255,0.1)",
    fontSize: 6.5,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
  },
  footerBar: { height: 4, backgroundColor: c.orange },
});

// ─── Props ────────────────────────────────────────────────────────────────────
export interface VoucherCompany {
  name?: string;          // "Like In House" / razón social legal
  legalName?: string;     // "Like In House Peru S.A.C."
  ruc?: string;
  address?: string;
  phone?: string;
  email?: string;
  web?: string;           // dominio mostrado
}

export interface VoucherProps {
  referenceCode: string;
  serviceName: string;
  serviceDescription?: string | null;
  serviceImageUrl?: string | null;
  serviceDestination?: string | null;
  serviceDurationLabel?: string | null;   // "4D / 3N" o "4h"
  serviceIncludes?: string[];             // hasta 8 items
  clientName: string;
  clientEmail?: string;
  clientPhone?: string | null;
  amountPaid: number;
  totalAmount: number;
  currency: string;
  dateStr: string;
  adults?: number;
  children?: number;
  isEs: boolean;
  type: "RESERVATION" | "PAYMENT_LINK";
  company?: VoucherCompany;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function VoucherPDF({ data }: { data: VoucherProps }) {
  const { isEs } = data;
  const currSym = data.currency === "PEN" ? "S/" : "$";
  const isPaid  = data.amountPaid >= data.totalAmount - 0.01;
  const pending = Math.max(0, data.totalAmount - data.amountPaid);
  const totalPax = (data.adults || 0) + (data.children || 0);
  const includes = (data.serviceIncludes || []).filter(Boolean).slice(0, 8);

  // Datos de empresa con fallbacks razonables
  const co: VoucherCompany = {
    name: "Like In House",
    legalName: "Like In House Peru S.R.L.",
    web: "likeinhouseperu.com",
    ...(data.company || {}),
  };

  // Resolver URL del logo. Aceptamos generar desde cualquier host (panel.* o
  // dominio principal) ya que ambos sirven /public con el mismo build.
  const stripInternalSubdomain = (origin: string) =>
    origin.replace(/^(https?:\/\/)(panel|admin|app|dashboard|staging|dev)\./i, "$1");
  const rawOrigin =
    (typeof window !== "undefined" && window.location?.origin) ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://likeinhouseperu.com";
  const logoUrl = `${stripInternalSubdomain(rawOrigin).replace(/\/$/, "")}/Logo-Cuadrado.png`;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Barra superior */}
        <View style={S.topBar} fixed />

        {/* Header */}
        <View style={S.header}>
          <PdfImage src={logoUrl} style={S.logoImg} />
          <View style={S.badge}>
            <Text style={S.badgeLabel}>{isEs ? "Comprobante" : "Voucher"}</Text>
            <Text style={S.badgeCode}>{data.referenceCode}</Text>
            <Text style={S.badgeDate}>
              {format(new Date(), isEs ? "dd 'de' MMM yyyy · HH:mm" : "MMM dd, yyyy · HH:mm", {
                locale: isEs ? es : undefined,
              })}
            </Text>
          </View>
        </View>

        <View style={S.dividerStrong} />

        <View style={S.body}>
          {/* Cliente + Estado */}
          <View style={S.twoCol}>
            <View style={[S.card, S.cardOrange]}>
              <Text style={S.cardTitle}>{isEs ? "Datos del Cliente" : "Client Details"}</Text>
              <View style={S.cardRow}>
                <Text style={S.cardLabel}>{isEs ? "Nombre:" : "Name:"}</Text>
                <Text style={S.cardValue}>{data.clientName}</Text>
              </View>
              {data.clientEmail && (
                <View style={S.cardRow}>
                  <Text style={S.cardLabel}>Email:</Text>
                  <Text style={S.cardValue}>{data.clientEmail}</Text>
                </View>
              )}
              {data.clientPhone && (
                <View style={S.cardRow}>
                  <Text style={S.cardLabel}>{isEs ? "Teléfono:" : "Phone:"}</Text>
                  <Text style={S.cardValue}>{data.clientPhone}</Text>
                </View>
              )}
            </View>

            <View style={[S.card, S.cardTeal]}>
              <Text style={S.cardTitle}>{isEs ? "Estado del Pago" : "Payment Status"}</Text>
              <View style={S.cardRow}>
                <Text style={S.cardLabel}>{isEs ? "Tipo:" : "Type:"}</Text>
                <Text style={S.cardValue}>
                  {data.type === "RESERVATION"
                    ? (isEs ? "Reserva" : "Reservation")
                    : (isEs ? "Link de Pago" : "Payment Link")}
                </Text>
              </View>
              <View style={S.cardRow}>
                <Text style={S.cardLabel}>{isEs ? "Moneda:" : "Currency:"}</Text>
                <Text style={S.cardValue}>{data.currency || "USD"}</Text>
              </View>
              <View
                style={[
                  S.statusPill,
                  isPaid ? S.statusPillPaid : S.statusPillPending,
                ]}
              >
                <Text
                  style={[
                    S.statusPillText,
                    { color: isPaid ? "#15803d" : "#a16207" },
                  ]}
                >
                  {isPaid
                    ? (isEs ? "✓  CONFIRMADO" : "✓  CONFIRMED")
                    : (isEs ? "⏱  PENDIENTE" : "⏱  PENDING")}
                </Text>
              </View>
            </View>
          </View>

          {/* Servicio contratado */}
          <Text style={S.sectionLabel}>
            {isEs ? "Servicio Contratado" : "Contracted Service"}
          </Text>
          <View style={S.serviceHero}>
            {data.serviceImageUrl ? (
              <PdfImage src={data.serviceImageUrl} style={S.serviceImg} />
            ) : null}
            <View style={S.serviceBody}>
              <Text style={S.serviceName}>{data.serviceName}</Text>
              {data.serviceDescription ? (
                <Text style={S.serviceDesc}>{data.serviceDescription}</Text>
              ) : null}

              <View style={S.pillsRow}>
                <View style={S.pill}>
                  <Text style={S.pillLabel}>{isEs ? "Fecha" : "Date"}</Text>
                  <Text style={S.pillValue}>{data.dateStr || (isEs ? "A coordinar" : "TBD")}</Text>
                </View>
                {totalPax > 0 && (
                  <View style={S.pill}>
                    <Text style={S.pillLabel}>{isEs ? "Pasajeros" : "Passengers"}</Text>
                    <Text style={S.pillValue}>{totalPax}</Text>
                  </View>
                )}
                {data.serviceDurationLabel && (
                  <View style={S.pill}>
                    <Text style={S.pillLabel}>{isEs ? "Duración" : "Duration"}</Text>
                    <Text style={S.pillValue}>{data.serviceDurationLabel}</Text>
                  </View>
                )}
                {data.serviceDestination && (
                  <View style={S.pill}>
                    <Text style={S.pillLabel}>{isEs ? "Destino" : "Destination"}</Text>
                    <Text style={S.pillValue}>{data.serviceDestination}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Qué incluye */}
          {includes.length > 0 && (
            <View style={S.includesBox}>
              <Text style={S.includesTitle}>
                {isEs ? "✓  Qué incluye tu experiencia" : "✓  What your experience includes"}
              </Text>
              <View style={S.includesGrid}>
                {includes.map((item, i) => (
                  <View key={i} style={S.includesItem}>
                    <Text style={S.includesCheck}>✓</Text>
                    <Text style={S.includesText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Resumen de pago */}
          <Text style={S.sectionLabel}>
            {isEs ? "Resumen de Pago" : "Payment Summary"}
          </Text>
          <View style={S.paymentBox}>
            <View style={S.paymentRow}>
              <Text style={S.paymentLabel}>{data.serviceName}</Text>
              <Text style={S.paymentValue}>{currSym} {data.totalAmount.toFixed(2)}</Text>
            </View>

            <View style={S.paymentDivider} />

            <View style={S.totalBlock}>
              <Text style={S.totalLabel}>
                {isPaid
                  ? (isEs ? "Total Pagado" : "Total Paid")
                  : (isEs ? "Pagado a Cuenta" : "Paid So Far")}
              </Text>
              <Text style={S.totalValue}>{currSym} {data.amountPaid.toFixed(2)}</Text>
            </View>

            {pending > 0.01 && (
              <View style={S.pendingRow}>
                <Text style={S.pendingLabel}>
                  {isEs ? "Saldo Pendiente" : "Pending Balance"}
                </Text>
                <Text style={S.pendingValue}>{currSym} {pending.toFixed(2)}</Text>
              </View>
            )}
          </View>

          {/* Nota */}
          <View style={S.noteBox}>
            <Text style={S.noteIcon}>i</Text>
            <Text style={S.noteText}>
              {isEs
                ? `Este comprobante es generado electrónicamente y tiene validez como constancia de tu reserva. Preséntalo al inicio de tu tour. Para cualquier consulta, escríbenos por WhatsApp${co.phone ? ` al ${co.phone}` : ""}.`
                : `This voucher is electronically generated and serves as proof of your reservation. Present it at the start of your tour. For any inquiry, contact us via WhatsApp${co.phone ? ` at ${co.phone}` : ""}.`}
            </Text>
          </View>
        </View>

        {/* Footer fijo abajo */}
        <View style={S.footer} fixed>
          <View style={S.footerInner}>
            <View style={S.footerRow}>
              <View>
                <Text style={S.footerCompany}>{co.legalName || co.name}</Text>
                <Text style={S.footerSub}>
                  {isEs ? "Agencia de viajes y turismo · Perú" : "Travel & tourism agency · Peru"}
                  {co.ruc ? ` · RUC ${co.ruc}` : ""}
                  {co.address ? `\n${co.address}` : ""}
                </Text>
              </View>

              <View style={S.footerContacts}>
                {co.web && <Text style={S.footerWeb}>{co.web}</Text>}
                {co.email && <Text style={S.footerValue}>{co.email}</Text>}
                {co.phone && <Text style={S.footerValue}>{co.phone}</Text>}
              </View>
            </View>

            <Text style={S.footerLegal}>
              {isEs
                ? `© ${new Date().getFullYear()} ${co.name || "Like In House"}. Todos los derechos reservados.`
                : `© ${new Date().getFullYear()} ${co.name || "Like In House"}. All rights reserved.`}
            </Text>
          </View>
          <View style={S.footerBar} />
        </View>
      </Page>
    </Document>
  );
}
