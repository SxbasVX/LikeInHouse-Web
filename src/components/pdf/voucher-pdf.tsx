"use client";

import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        borderBottom: '2 solid #ea580c',
        paddingBottom: 20,
    },
    logoContainer: {
        width: 120,
    },
    headerText: {
        textAlign: 'right',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 12,
        color: '#64748b',
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
        backgroundColor: '#f1f5f9',
        padding: 8,
        marginBottom: 10,
        borderRadius: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    label: {
        width: 140,
        fontSize: 10,
        color: '#64748b',
        fontWeight: 'bold',
    },
    value: {
        flex: 1,
        fontSize: 11,
        color: '#0f172a',
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottom: '1 solid #e2e8f0',
        paddingBottom: 5,
        marginBottom: 10,
    },
    tableHeaderText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748b',
    },
    tableRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    tableCell: {
        fontSize: 11,
        color: '#0f172a',
    },
    col1: { width: '60%' },
    col2: { width: '20%', textAlign: 'right' },
    col3: { width: '20%', textAlign: 'right' },
    totalRow: {
        flexDirection: 'row',
        borderTop: '1 solid #e2e8f0',
        paddingTop: 10,
        marginTop: 10,
    },
    totalLabel: {
        width: '80%',
        textAlign: 'right',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
        paddingRight: 20,
    },
    totalValue: {
        width: '20%',
        textAlign: 'right',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#ea580c',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        borderTop: '1 solid #e2e8f0',
        paddingTop: 15,
    },
    footerText: {
        fontSize: 9,
        color: '#94a3b8',
        marginBottom: 3,
    }
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
    const currencySymbol = "$";

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ea580c' }}>LikeInHouse</Text>
                        <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Travel Agency</Text>
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>{isEs ? "Comprobante" : "Voucher"}</Text>
                        <Text style={styles.subtitle}>{isEs ? "Código:" : "Code:"} {data.referenceCode}</Text>
                        <Text style={styles.subtitle}>{isEs ? "Fecha:" : "Date:"} {format(new Date(), "dd MMM yyyy HH:mm", { locale: isEs ? es : undefined })}</Text>
                    </View>
                </View>

                {/* Client details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{isEs ? "Detalles del Cliente" : "Client Details"}</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>{isEs ? "Nombre:" : "Name:"}</Text>
                        <Text style={styles.value}>{data.clientName}</Text>
                    </View>
                    {data.clientEmail && (
                        <View style={styles.row}>
                            <Text style={styles.label}>{isEs ? "Correo:" : "Email:"}</Text>
                            <Text style={styles.value}>{data.clientEmail}</Text>
                        </View>
                    )}
                </View>

                {/* Service details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{isEs ? "Detalles del Servicio" : "Service Details"}</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>{isEs ? "Servicio:" : "Service:"}</Text>
                        <Text style={styles.value}>{data.serviceName}</Text>
                    </View>
                    {data.dateStr && (
                        <View style={styles.row}>
                            <Text style={styles.label}>{isEs ? "Fecha programada:" : "Scheduled Date:"}</Text>
                            <Text style={styles.value}>{data.dateStr}</Text>
                        </View>
                    )}
                    {(data.adults !== undefined || data.children !== undefined) && (
                        <View style={styles.row}>
                            <Text style={styles.label}>{isEs ? "Pasajeros:" : "Passengers:"}</Text>
                            <Text style={styles.value}>
                                {data.adults} {isEs ? "Adultos" : "Adults"}
                                {((data.children || 0) > 0) ? `, ${data.children} ${isEs ? "Niños" : "Children"}` : ""}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Payment Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{isEs ? "Resumen de Pago" : "Payment Summary"}</Text>

                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderText, styles.col1]}>{isEs ? "Descripción" : "Description"}</Text>
                            <Text style={[styles.tableHeaderText, styles.col3]}>{isEs ? "Monto" : "Amount"}</Text>
                        </View>

                        <View style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.col1]}>{data.serviceName}</Text>
                            <Text style={[styles.tableCell, styles.col3]}>{currencySymbol} {data.totalAmount.toFixed(2)}</Text>
                        </View>

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>{isEs ? "Total Pagado:" : "Total Paid:"}</Text>
                            <Text style={styles.totalValue}>{currencySymbol} {data.amountPaid.toFixed(2)}</Text>
                        </View>

                        {data.totalAmount > data.amountPaid && (
                            <View style={[styles.totalRow, { borderTop: 'none', paddingTop: 0, marginTop: 5 }]}>
                                <Text style={[styles.totalLabel, { color: '#64748b', fontSize: 11 }]}>{isEs ? "Saldo Pendiente:" : "Pending Balance:"}</Text>
                                <Text style={[styles.totalValue, { color: '#64748b', fontSize: 11 }]}>{currencySymbol} {(data.totalAmount - data.amountPaid).toFixed(2)}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {isEs
                            ? "Gracias por su preferencia. Este documento es un comprobante de pago electrónico."
                            : "Thank you for your business. This document is an electronic payment receipt."}
                    </Text>
                    <Text style={styles.footerText}>www.likeinhouse.com | contacto@likeinhouse.com</Text>
                </View>
            </Page>
        </Document>
    );
}
