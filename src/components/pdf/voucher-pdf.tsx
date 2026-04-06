"use client";

import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Brand colors
const brand = {
  orange: "#e8411d",
  darkRed: "#1C0D0C",
  teal: "#2a6f6f",
  cream: "#f5efe7",
  creamLight: "#faf7f2",
  gold: "#d4a574",
  text: "#1a1a1a",
  textLight: "#6b7280",
  border: "#e5ddd3",
};

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  // Top accent bar
  accentBar: {
    height: 6,
    backgroundColor: brand.orange,
  },
  // Header section
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 20,
  },
  logoSection: {
    flexDirection: "column",
  },
  logoText: {
    fontSize: 26,
    fontWeight: "bold",
    color: brand.orange,
    letterSpacing: -0.5,
  },
  logoSubtext: {
    fontSize: 8,
    color: brand.textLight,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: 2,
  },
  voucherBadge: {
    backgroundColor: brand.cream,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "flex-end",
  },
  voucherTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: brand.darkRed,
    marginBottom: 3,
  },
  voucherCode: {
    fontSize: 11,
    color: brand.orange,
    fontWeight: "bold",
    fontFamily: "Courier",
  },
  voucherDate: {
    fontSize: 8,
    color: brand.textLight,
    marginTop: 2,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: brand.border,
    marginHorizontal: 40,
  },
  dividerAccent: {
    height: 2,
    backgroundColor: brand.orange,
    marginHorizontal: 40,
  },
  // Content area
  content: {
    paddingHorizontal: 40,
    paddingTop: 24,
  },
  // Two column layout
  twoCol: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 24,
  },
  colHalf: {
    flex: 1,
  },
  // Info card
  infoCard: {
    backgroundColor: brand.creamLight,
    borderRadius: 8,
    padding: 16,
    borderLeft: `3 solid ${brand.orange}`,
  },
  infoCardTeal: {
    backgroundColor: "#f0f7f7",
    borderRadius: 8,
    padding: 16,
    borderLeft: `3 solid ${brand.teal}`,
  },
  cardTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: brand.textLight,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  cardLabel: {
    width: 90,
    fontSize: 9,
    color: brand.textLight,
  },
  cardValue: {
    flex: 1,
    fontSize: 10,
    color: brand.text,
    fontWeight: "bold",
  },
  // Service section
  serviceSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brand.orange,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: brand.darkRed,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  // Service detail box
  serviceBox: {
    backgroundColor: brand.cream,
    borderRadius: 10,
    padding: 20,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: brand.darkRed,
    marginBottom: 12,
  },
  serviceDetails: {
    flexDirection: "row",
    gap: 30,
  },
  serviceDetail: {
    flexDirection: "column",
  },
  serviceDetailLabel: {
    fontSize: 8,
    color: brand.textLight,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  serviceDetailValue: {
    fontSize: 11,
    color: brand.text,
    fontWeight: "bold",
  },
  // Payment section
  paymentBox: {
    backgroundColor: brand.darkRed,
    borderRadius: 10,
    padding: 20,
    marginBottom: 24,
  },
  paymentTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
  },
  paymentValue: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "bold",
  },
  paymentDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 10,
  },
  paymentTotalLabel: {
    fontSize: 11,
    color: "#ffffff",
    fontWeight: "bold",
  },
  paymentTotalValue: {
    fontSize: 16,
    color: brand.orange,
    fontWeight: "bold",
  },
  balanceLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.5)",
  },
  balanceValue: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
  },
  // Footer
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
    paddingHorizontal: 40,
    paddingVertical: 16,
    backgroundColor: brand.cream,
  },
  footerLeft: {
    flexDirection: "column",
  },
  footerCompany: {
    fontSize: 9,
    fontWeight: "bold",
    color: brand.darkRed,
  },
  footerInfo: {
    fontSize: 7,
    color: brand.textLight,
    marginTop: 2,
  },
  footerRight: {
    alignItems: "flex-end",
  },
  footerWeb: {
    fontSize: 8,
    color: brand.orange,
    fontWeight: "bold",
  },
  footerEmail: {
    fontSize: 7,
    color: brand.textLight,
    marginTop: 2,
  },
  footerBar: {
    height: 4,
    backgroundColor: brand.orange,
  },
});

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

export function VoucherPDF({ data }: { data: VoucherProps }) {
  const { isEs } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Orange accent bar at top */}
        <View style={styles.accentBar} />

        {/* Header with logo and voucher info */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.logoText}>LikeInHouse</Text>
            <Text style={styles.logoSubtext}>Travel Agency</Text>
          </View>
          <View style={styles.voucherBadge}>
            <Text style={styles.voucherTitle}>
              {isEs ? "Comprobante" : "Voucher"}
            </Text>
            <Text style={styles.voucherCode}>{data.referenceCode}</Text>
            <Text style={styles.voucherDate}>
              {format(new Date(), "dd MMM yyyy · HH:mm", {
                locale: isEs ? es : undefined,
              })}
            </Text>
          </View>
        </View>

        <View style={styles.dividerAccent} />

        {/* Content */}
        <View style={styles.content}>
          {/* Client & Status cards */}
          <View style={styles.twoCol}>
            <View style={styles.colHalf}>
              <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>
                  {isEs ? "Datos del Cliente" : "Client Details"}
                </Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>
                    {isEs ? "Nombre:" : "Name:"}
                  </Text>
                  <Text style={styles.cardValue}>{data.clientName}</Text>
                </View>
                {data.clientEmail && (
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>
                      {isEs ? "Email:" : "Email:"}
                    </Text>
                    <Text style={styles.cardValue}>{data.clientEmail}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.colHalf}>
              <View style={styles.infoCardTeal}>
                <Text style={styles.cardTitle}>
                  {isEs ? "Estado" : "Status"}
                </Text>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>
                    {isEs ? "Tipo:" : "Type:"}
                  </Text>
                  <Text style={styles.cardValue}>
                    {data.type === "RESERVATION"
                      ? isEs
                        ? "Reserva"
                        : "Reservation"
                      : isEs
                      ? "Link de Pago"
                      : "Payment Link"}
                  </Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>
                    {isEs ? "Moneda:" : "Currency:"}
                  </Text>
                  <Text style={styles.cardValue}>USD</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Service section */}
          <View style={styles.serviceSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>
                {isEs ? "Servicio Contratado" : "Contracted Service"}
              </Text>
            </View>
            <View style={styles.serviceBox}>
              <Text style={styles.serviceName}>{data.serviceName}</Text>
              <View style={styles.serviceDetails}>
                {data.dateStr && (
                  <View style={styles.serviceDetail}>
                    <Text style={styles.serviceDetailLabel}>
                      {isEs ? "Fecha" : "Date"}
                    </Text>
                    <Text style={styles.serviceDetailValue}>
                      {data.dateStr}
                    </Text>
                  </View>
                )}
                {data.adults !== undefined && (
                  <View style={styles.serviceDetail}>
                    <Text style={styles.serviceDetailLabel}>
                      {isEs ? "Adultos" : "Adults"}
                    </Text>
                    <Text style={styles.serviceDetailValue}>{data.adults}</Text>
                  </View>
                )}
                {(data.children || 0) > 0 && (
                  <View style={styles.serviceDetail}>
                    <Text style={styles.serviceDetailLabel}>
                      {isEs ? "Ninos" : "Children"}
                    </Text>
                    <Text style={styles.serviceDetailValue}>
                      {data.children}
                    </Text>
                  </View>
                )}
                <View style={styles.serviceDetail}>
                  <Text style={styles.serviceDetailLabel}>
                    {isEs ? "Pasajeros" : "Passengers"}
                  </Text>
                  <Text style={styles.serviceDetailValue}>
                    {(data.adults || 0) + (data.children || 0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Payment section - dark card */}
          <View style={styles.paymentBox}>
            <Text style={styles.paymentTitle}>
              {isEs ? "Resumen de Pago" : "Payment Summary"}
            </Text>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{data.serviceName}</Text>
              <Text style={styles.paymentValue}>
                $ {data.totalAmount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.paymentDivider} />

            <View style={styles.paymentRow}>
              <Text style={styles.paymentTotalLabel}>
                {isEs ? "Total Pagado" : "Total Paid"}
              </Text>
              <Text style={styles.paymentTotalValue}>
                $ {data.amountPaid.toFixed(2)}
              </Text>
            </View>

            {data.totalAmount > data.amountPaid && (
              <View style={[styles.paymentRow, { marginTop: 4, marginBottom: 0 }]}>
                <Text style={styles.balanceLabel}>
                  {isEs ? "Saldo Pendiente" : "Pending Balance"}
                </Text>
                <Text style={styles.balanceValue}>
                  $ {(data.totalAmount - data.amountPaid).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerCompany}>LikeInHouse Travel Agency</Text>
              <Text style={styles.footerInfo}>
                Bellavista B-9-A, Cusco 08000, Peru
              </Text>
              <Text style={styles.footerInfo}>
                {isEs
                  ? "Este documento es un comprobante electronico valido."
                  : "This document is a valid electronic receipt."}
              </Text>
            </View>
            <View style={styles.footerRight}>
              <Text style={styles.footerWeb}>www.likeinhouse.com</Text>
              <Text style={styles.footerEmail}>contacto@likeinhouse.com</Text>
              <Text style={styles.footerEmail}>+51 913 406 888</Text>
            </View>
          </View>
          <View style={styles.footerBar} />
        </View>
      </Page>
    </Document>
  );
}
