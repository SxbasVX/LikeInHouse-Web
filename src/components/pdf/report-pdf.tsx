"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    borderBottom: "2 solid #ea580c",
    paddingBottom: 15,
  },
  logoContainer: {
    width: 120,
  },
  headerText: {
    textAlign: "right",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
  },
  kpiRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 12,
    border: "1 solid #e2e8f0",
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 3,
  },
  kpiLabel: {
    fontSize: 8,
    color: "#64748b",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    backgroundColor: "#f1f5f9",
    padding: 8,
    marginBottom: 8,
    marginTop: 10,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #cbd5e1",
    paddingBottom: 5,
    marginBottom: 6,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#64748b",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottom: "0.5 solid #f1f5f9",
  },
  tableCell: {
    fontSize: 9,
    color: "#0f172a",
  },
  // Column widths for reservations table
  colCode: { width: "12%" },
  colClient: { width: "18%" },
  colTour: { width: "20%" },
  colPeople: { width: "10%", textAlign: "center" },
  colAmount: { width: "15%", textAlign: "right" },
  colStatus: { width: "12%", textAlign: "center" },
  colDate: { width: "13%", textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTop: "1 solid #e2e8f0",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
    marginBottom: 2,
  },
});

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  PAID: "Pagada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

interface ReportReservation {
  referenceCode: string;
  client: string;
  tour: string;
  destination: string;
  adults: number;
  children: number;
  totalAmount: number;
  currency: string;
  status: string;
  origin: string;
  date: string;
}

interface MonthlyReportData {
  period: string;
  periodLabel: string;
  totalRevenue: number;
  totalBookings: number;
  totalPeople: number;
  avgBookingValue: number;
  paidCount: number;
  pendingCount: number;
  topTours: { name: string; destination: string; bookings: number; revenue: number }[];
  reservations: ReportReservation[];
}

interface TourReportData {
  tourName: string;
  destination: string;
  totalRevenue: number;
  totalBookings: number;
  totalPeople: number;
  paidCount: number;
  conversionRate: number;
  reservations: ReportReservation[];
}

export function MonthlyReportPDF({ data }: { data: MonthlyReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#ea580c" }}>LikeInHouse</Text>
            <Text style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>Travel Agency</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Reporte Mensual</Text>
            <Text style={styles.subtitle}>{data.periodLabel}</Text>
            <Text style={styles.subtitle}>Generado: {new Date().toLocaleDateString("es-PE")}</Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>USD ${data.totalRevenue.toFixed(0)}</Text>
            <Text style={styles.kpiLabel}>Revenue Total</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{data.totalBookings}</Text>
            <Text style={styles.kpiLabel}>Reservas</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{data.totalPeople}</Text>
            <Text style={styles.kpiLabel}>Pasajeros</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>USD ${data.avgBookingValue.toFixed(0)}</Text>
            <Text style={styles.kpiLabel}>Valor Promedio</Text>
          </View>
        </View>

        {/* Top Tours */}
        {data.topTours.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Top Tours</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: "50%" }]}>Tour</Text>
              <Text style={[styles.tableHeaderText, { width: "25%", textAlign: "center" }]}>Reservas</Text>
              <Text style={[styles.tableHeaderText, { width: "25%", textAlign: "right" }]}>Revenue</Text>
            </View>
            {data.topTours.map((t, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "50%" }]}>{t.name}</Text>
                <Text style={[styles.tableCell, { width: "25%", textAlign: "center" }]}>{t.bookings}</Text>
                <Text style={[styles.tableCell, { width: "25%", textAlign: "right" }]}>${t.revenue.toFixed(0)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Reservations Table */}
        <Text style={styles.sectionTitle}>
          Reservas ({data.paidCount} pagadas, {data.pendingCount} pendientes)
        </Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colCode]}>Codigo</Text>
          <Text style={[styles.tableHeaderText, styles.colClient]}>Cliente</Text>
          <Text style={[styles.tableHeaderText, styles.colTour]}>Tour</Text>
          <Text style={[styles.tableHeaderText, styles.colPeople]}>Pers.</Text>
          <Text style={[styles.tableHeaderText, styles.colAmount]}>Monto</Text>
          <Text style={[styles.tableHeaderText, styles.colStatus]}>Estado</Text>
          <Text style={[styles.tableHeaderText, styles.colDate]}>Fecha</Text>
        </View>
        {data.reservations.slice(0, 30).map((r, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colCode]}>{r.referenceCode.slice(0, 10)}</Text>
            <Text style={[styles.tableCell, styles.colClient]}>{r.client.slice(0, 18)}</Text>
            <Text style={[styles.tableCell, styles.colTour]}>{r.tour.slice(0, 20)}</Text>
            <Text style={[styles.tableCell, styles.colPeople]}>{r.adults + r.children}</Text>
            <Text style={[styles.tableCell, styles.colAmount]}>{r.currency} ${r.totalAmount.toFixed(0)}</Text>
            <Text style={[styles.tableCell, styles.colStatus]}>{statusLabels[r.status] || r.status}</Text>
            <Text style={[styles.tableCell, styles.colDate]}>{r.date}</Text>
          </View>
        ))}
        {data.reservations.length > 30 && (
          <Text style={{ fontSize: 8, color: "#94a3b8", marginTop: 5 }}>
            ... y {data.reservations.length - 30} reservas mas (ver CSV para listado completo)
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Reporte generado automaticamente - LikeInHouse Travel Agency</Text>
          <Text style={styles.footerText}>www.likeinhouse.com</Text>
        </View>
      </Page>
    </Document>
  );
}

export function TourReportPDF({ data }: { data: TourReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#ea580c" }}>LikeInHouse</Text>
            <Text style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>Travel Agency</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Reporte de Tour</Text>
            <Text style={styles.subtitle}>{data.tourName}</Text>
            <Text style={styles.subtitle}>{data.destination}</Text>
            <Text style={styles.subtitle}>Generado: {new Date().toLocaleDateString("es-PE")}</Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>USD ${data.totalRevenue.toFixed(0)}</Text>
            <Text style={styles.kpiLabel}>Revenue Total</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{data.totalBookings}</Text>
            <Text style={styles.kpiLabel}>Reservas</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{data.totalPeople}</Text>
            <Text style={styles.kpiLabel}>Pasajeros</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{data.paidCount}</Text>
            <Text style={styles.kpiLabel}>Pagados</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>{data.conversionRate}%</Text>
            <Text style={styles.kpiLabel}>Conversion</Text>
          </View>
        </View>

        {/* Reservations Table */}
        <Text style={styles.sectionTitle}>Reservas</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colCode]}>Codigo</Text>
          <Text style={[styles.tableHeaderText, styles.colClient]}>Cliente</Text>
          <Text style={[styles.tableHeaderText, { width: "15%" }]}>Personas</Text>
          <Text style={[styles.tableHeaderText, styles.colAmount]}>Monto</Text>
          <Text style={[styles.tableHeaderText, styles.colStatus]}>Estado</Text>
          <Text style={[styles.tableHeaderText, { width: "13%" }]}>Origen</Text>
          <Text style={[styles.tableHeaderText, styles.colDate]}>Fecha</Text>
        </View>
        {data.reservations.slice(0, 35).map((r, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colCode]}>{r.referenceCode.slice(0, 10)}</Text>
            <Text style={[styles.tableCell, styles.colClient]}>{r.client.slice(0, 18)}</Text>
            <Text style={[styles.tableCell, { width: "15%", textAlign: "center" }]}>{r.adults}A + {r.children}N</Text>
            <Text style={[styles.tableCell, styles.colAmount]}>${r.totalAmount.toFixed(0)}</Text>
            <Text style={[styles.tableCell, styles.colStatus]}>{statusLabels[r.status] || r.status}</Text>
            <Text style={[styles.tableCell, { width: "13%" }]}>{r.origin}</Text>
            <Text style={[styles.tableCell, styles.colDate]}>{r.date}</Text>
          </View>
        ))}
        {data.reservations.length > 35 && (
          <Text style={{ fontSize: 8, color: "#94a3b8", marginTop: 5 }}>
            ... y {data.reservations.length - 35} reservas mas
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Reporte generado automaticamente - LikeInHouse Travel Agency</Text>
          <Text style={styles.footerText}>www.likeinhouse.com</Text>
        </View>
      </Page>
    </Document>
  );
}
