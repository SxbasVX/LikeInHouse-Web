"use client";

import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ─── Paleta de marca ─────────────────────────────────────────────────────────
const c = {
  orange:      "#e8411d",
  darkRed:     "#1C0D0C",
  teal:        "#2a6f6f",
  tealLight:   "#f0f7f7",
  cream:       "#f5efe7",
  creamLight:  "#faf7f2",
  white:       "#ffffff",
  text:        "#1a1a1a",
  muted:       "#6b7280",
  border:      "#e5ddd3",
  borderLight: "#f0ebe4",
};

const S = StyleSheet.create({
  page: {
    backgroundColor: c.white,
    fontFamily: "Helvetica",
    position: "relative",
  },

  // ── Barra superior ──────────────────────────────────────────────────────────
  topBar: {
    height: 8,
    backgroundColor: c.orange,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 44,
    paddingTop: 28,
    paddingBottom: 22,
  },

  // Logo imagen
  logoImg: {
    width: 64,
    height: 64,
    objectFit: "contain",
  },

  // Badge del comprobante
  badge: {
    alignItems: "flex-end",
    backgroundColor: c.creamLight,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderLeft: `3 solid ${c.orange}`,
  },
  badgeLabel: {
    fontSize: 8,
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
    fontSize: 8,
    color: c.muted,
    marginTop: 3,
  },

  // ── Divider ─────────────────────────────────────────────────────────────────
  divider: {
    height: 1.5,
    backgroundColor: c.orange,
    marginHorizontal: 44,
    opacity: 0.6,
  },

  // ── Cuerpo ──────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 44,
    paddingTop: 28,
  },

  // ── Fila de 2 columnas ──────────────────────────────────────────────────────
  twoCol: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 28,
  },
  col: { flex: 1 },

  // Tarjeta de info
  card: {
    borderRadius: 10,
    padding: 18,
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
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: c.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    marginBottom: 7,
    alignItems: "flex-start",
  },
  cardLabel: {
    width: 72,
    fontSize: 8.5,
    color: c.muted,
  },
  cardValue: {
    flex: 1,
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: c.text,
  },

  // ── Servicio ─────────────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: c.orange,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  serviceBox: {
    backgroundColor: c.cream,
    borderRadius: 12,
    padding: 22,
    marginBottom: 20,
  },
  serviceName: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: c.darkRed,
    marginBottom: 16,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 12,
  },
  pill: {
    backgroundColor: c.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  pillLabel: {
    fontSize: 7,
    color: c.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  pillValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: c.darkRed,
  },

  // ── Resumen de pago ──────────────────────────────────────────────────────────
  paymentBox: {
    backgroundColor: c.creamLight,
    borderRadius: 12,
    padding: 22,
    border: `1 solid ${c.borderLight}`,
    marginBottom: 28,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  paymentLabel: { fontSize: 9.5, color: c.muted },
  paymentValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: c.text },
  paymentDivider: {
    height: 1,
    backgroundColor: c.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: c.darkRed,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: c.orange,
  },
  pendingLabel: { fontSize: 8.5, color: c.muted },
  pendingValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: c.teal },

  // ── Nota de confirmación ─────────────────────────────────────────────────────
  noteBox: {
    backgroundColor: "#fffbf0",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    border: `1 solid #f5e4a0`,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 8,
    color: "#7c6a00",
    lineHeight: 1.5,
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 44,
    paddingVertical: 14,
    backgroundColor: c.darkRed,
  },
  footerCompany: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: c.white,
  },
  footerSub: {
    fontSize: 7,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  footerRight: { alignItems: "flex-end" },
  footerWeb: { fontSize: 8, fontFamily: "Helvetica-Bold", color: c.orange },
  footerEmail: { fontSize: 7, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  footerBar: { height: 5, backgroundColor: c.orange },
});

// ─── Props ────────────────────────────────────────────────────────────────────
interface VoucherProps {
  referenceCode: string;
  serviceName: string;
  clientName: string;
  clientEmail?: string;
  amountPaid: number;
  totalAmount: number;
  currency: string;
  dateStr: string;
  adults?: number;
  children?: number;
  isEs: boolean;
  type: "RESERVATION" | "PAYMENT_LINK";
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function VoucherPDF({ data }: { data: VoucherProps }) {
  const { isEs } = data;
  const currSym = data.currency === "PEN" ? "S/" : "$";
  const isPaid  = data.amountPaid >= data.totalAmount;
  const pending = Math.max(0, data.totalAmount - data.amountPaid);
  const totalPax = (data.adults || 0) + (data.children || 0);

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* Barra naranja superior */}
        <View style={S.topBar} />

        {/* Header: logo + badge */}
        <View style={S.header}>
          {/* Logo imagen */}
          <PdfImage
            src={`${process.env.NEXT_PUBLIC_BASE_URL || "https://likeinhouse.com"}/Logo-Cuadrado.png`}
            style={S.logoImg}
          />

          {/* Badge comprobante */}
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

        <View style={S.divider} />

        {/* Cuerpo */}
        <View style={S.body}>

          {/* Tarjetas cliente + estado */}
          <View style={S.twoCol}>
            <View style={[S.card, S.cardOrange]}>
              <Text style={S.cardTitle}>
                {isEs ? "Datos del Cliente" : "Client Details"}
              </Text>
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
            </View>

            <View style={[S.card, S.cardTeal]}>
              <Text style={S.cardTitle}>
                {isEs ? "Estado" : "Status"}
              </Text>
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
              <View style={S.cardRow}>
                <Text style={S.cardLabel}>{isEs ? "Estado:" : "Status:"}</Text>
                <Text style={[S.cardValue, { color: isPaid ? c.teal : c.orange }]}>
                  {isPaid
                    ? (isEs ? "✓ Confirmado" : "✓ Confirmed")
                    : (isEs ? "Pendiente de pago" : "Pending payment")}
                </Text>
              </View>
            </View>
          </View>

          {/* Servicio */}
          <Text style={S.sectionLabel}>
            {isEs ? "● Servicio Contratado" : "● Contracted Service"}
          </Text>
          <View style={S.serviceBox}>
            <Text style={S.serviceName}>{data.serviceName}</Text>
            <View style={S.pillsRow}>
              {data.dateStr ? (
                <View style={S.pill}>
                  <Text style={S.pillLabel}>{isEs ? "Fecha" : "Date"}</Text>
                  <Text style={S.pillValue}>{data.dateStr}</Text>
                </View>
              ) : (
                <View style={S.pill}>
                  <Text style={S.pillLabel}>{isEs ? "Fecha" : "Date"}</Text>
                  <Text style={S.pillValue}>{isEs ? "A coordinar" : "To be set"}</Text>
                </View>
              )}
              {(data.adults || 0) > 0 && (
                <View style={S.pill}>
                  <Text style={S.pillLabel}>{isEs ? "Adultos" : "Adults"}</Text>
                  <Text style={S.pillValue}>{data.adults}</Text>
                </View>
              )}
              {(data.children || 0) > 0 && (
                <View style={S.pill}>
                  <Text style={S.pillLabel}>{isEs ? "Niños" : "Children"}</Text>
                  <Text style={S.pillValue}>{data.children}</Text>
                </View>
              )}
              <View style={S.pill}>
                <Text style={S.pillLabel}>{isEs ? "Pasajeros" : "Passengers"}</Text>
                <Text style={S.pillValue}>{totalPax || (data.adults || 1)}</Text>
              </View>
            </View>
          </View>

          {/* Resumen de pago */}
          <Text style={S.sectionLabel}>
            {isEs ? "● Resumen de Pago" : "● Payment Summary"}
          </Text>
          <View style={S.paymentBox}>
            <View style={S.paymentRow}>
              <Text style={S.paymentLabel}>{data.serviceName}</Text>
              <Text style={S.paymentValue}>{currSym} {data.totalAmount.toFixed(2)}</Text>
            </View>

            <View style={S.paymentDivider} />

            <View style={S.paymentRow}>
              <Text style={S.totalLabel}>{isEs ? "Total Pagado" : "Total Paid"}</Text>
              <Text style={S.totalValue}>{currSym} {data.amountPaid.toFixed(2)}</Text>
            </View>

            {pending > 0.01 && (
              <View style={[S.paymentRow, { marginTop: 4, marginBottom: 0 }]}>
                <Text style={S.pendingLabel}>{isEs ? "Saldo Pendiente" : "Pending Balance"}</Text>
                <Text style={S.pendingValue}>{currSym} {pending.toFixed(2)}</Text>
              </View>
            )}
          </View>

          {/* Nota */}
          <View style={S.noteBox}>
            <Text style={S.noteText}>
              {isEs
                ? "Este comprobante es generado electrónicamente. Preséntalo al inicio de tu tour. Para consultas, escríbenos por WhatsApp."
                : "This voucher is electronically generated. Present it at the start of your tour. For inquiries, contact us via WhatsApp."}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={S.footer}>
          <View style={S.footerContent}>
            <View>
              <Text style={S.footerCompany}>LikeInHouse Travel Agency</Text>
              <Text style={S.footerSub}>
                {isEs ? "Agencia de viajes y turismo · Perú" : "Travel & tourism agency · Peru"}
              </Text>
            </View>
            <View style={S.footerRight}>
              <Text style={S.footerWeb}>www.likeinhouse.com</Text>
              <Text style={S.footerEmail}>+51 913 406 888</Text>
            </View>
          </View>
          <View style={S.footerBar} />
        </View>

      </Page>
    </Document>
  );
}
