import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

type LineItem = { description: string; quantity: number; unitPrice: number };
type InvoicePdfData = {
  number: string;
  status: string;
  issueDate: string;
  dueDate?: string;
  client: { name: string; company?: string; email: string };
  items: LineItem[];
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  studio: { name: string; email: string; location?: string };
};

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    color: "#0A0A0A",
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },
  hairline: { height: 1, backgroundColor: "#E5E5E5", marginVertical: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 24, height: 24, backgroundColor: "#D62828", transform: "rotate(45deg)" },
  brandWord: { fontSize: 14, fontWeight: 700, letterSpacing: -0.3 },
  invoiceMeta: { textAlign: "right" },
  bigLabel: { fontSize: 9, letterSpacing: 2, color: "#666", textTransform: "uppercase", marginBottom: 4 },
  invoiceNumber: { fontSize: 22, fontWeight: 700, color: "#0A0A0A", letterSpacing: -0.5 },
  statusPill: {
    alignSelf: "flex-end",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: 700,
  },
  twoCols: { flexDirection: "row", gap: 48, marginBottom: 36 },
  col: { flex: 1 },
  colLabel: { fontSize: 8, letterSpacing: 1.8, color: "#999", textTransform: "uppercase", marginBottom: 6 },
  recipientName: { fontSize: 12, fontWeight: 700, marginBottom: 2 },
  recipientLine: { fontSize: 10, color: "#444", marginBottom: 2 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#0A0A0A",
    paddingBottom: 6,
    marginBottom: 8,
  },
  th: { fontSize: 8, letterSpacing: 1.5, color: "#666", textTransform: "uppercase", fontWeight: 700 },
  thDescription: { flex: 1 },
  thQty: { width: 50, textAlign: "right" },
  thRate: { width: 80, textAlign: "right" },
  thAmount: { width: 80, textAlign: "right" },
  row: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  td: { fontSize: 10 },
  tdDescription: { flex: 1 },
  tdQty: { width: 50, textAlign: "right", color: "#666" },
  tdRate: { width: 80, textAlign: "right", color: "#666" },
  tdAmount: { width: 80, textAlign: "right", fontWeight: 700 },
  totalsBlock: { marginTop: 24, alignItems: "flex-end" },
  totalsRow: { flexDirection: "row", width: 240, paddingVertical: 4 },
  totalsLabel: { flex: 1, fontSize: 10, color: "#666" },
  totalsValue: { fontSize: 10, fontWeight: 700, textAlign: "right" },
  grandTotalRow: {
    flexDirection: "row",
    width: 240,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#0A0A0A",
    marginTop: 8,
  },
  grandTotalLabel: { flex: 1, fontSize: 11, fontWeight: 700 },
  grandTotalValue: { fontSize: 16, fontWeight: 700, textAlign: "right", color: "#D62828" },
  notesBlock: {
    marginTop: 48,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  notesText: { fontSize: 10, color: "#444", lineHeight: 1.5, fontStyle: "italic" },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#999",
    textAlign: "center",
  },
});

export function InvoicePdf({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.brand}>
            <View style={styles.brandMark} />
            <Text style={styles.brandWord}>{data.studio.name}</Text>
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.bigLabel}>Invoice</Text>
            <Text style={styles.invoiceNumber}>{data.number}</Text>
            <View style={[styles.statusPill, statusStyle(data.status)]}>
              <Text>{data.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Bill to + Dates */}
        <View style={styles.twoCols}>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Bill To</Text>
            <Text style={styles.recipientName}>{data.client.name}</Text>
            {data.client.company && <Text style={styles.recipientLine}>{data.client.company}</Text>}
            <Text style={styles.recipientLine}>{data.client.email}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>From</Text>
            <Text style={styles.recipientName}>{data.studio.name}</Text>
            <Text style={styles.recipientLine}>{data.studio.email}</Text>
            {data.studio.location && <Text style={styles.recipientLine}>{data.studio.location}</Text>}
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Dates</Text>
            <Text style={styles.recipientLine}>
              <Text style={{ color: "#999" }}>Issued · </Text>
              {data.issueDate}
            </Text>
            {data.dueDate && (
              <Text style={styles.recipientLine}>
                <Text style={{ color: "#999" }}>Due · </Text>
                {data.dueDate}
              </Text>
            )}
          </View>
        </View>

        {/* Items */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.thDescription]}>Description</Text>
          <Text style={[styles.th, styles.thQty]}>Qty</Text>
          <Text style={[styles.th, styles.thRate]}>Rate</Text>
          <Text style={[styles.th, styles.thAmount]}>Amount</Text>
        </View>
        {data.items.map((it, i) => (
          <View key={i} style={styles.row}>
            <Text style={[styles.td, styles.tdDescription]}>{it.description}</Text>
            <Text style={[styles.td, styles.tdQty]}>{it.quantity}</Text>
            <Text style={[styles.td, styles.tdRate]}>
              {data.currency} {it.unitPrice.toFixed(2)}
            </Text>
            <Text style={[styles.td, styles.tdAmount]}>
              {data.currency} {(it.quantity * it.unitPrice).toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>
              {data.currency} {data.subtotal.toFixed(2)}
            </Text>
          </View>
          {data.taxAmount > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax ({data.taxRate}%)</Text>
              <Text style={styles.totalsValue}>
                {data.currency} {data.taxAmount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {data.currency} {data.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.colLabel}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>{data.studio.name} · {data.studio.email}</Text>
      </Page>
    </Document>
  );
}

function statusStyle(status: string) {
  switch (status) {
    case "paid":
      return { backgroundColor: "#E8F5E9", color: "#1B5E20" };
    case "overdue":
      return { backgroundColor: "#FFEBEE", color: "#B71C1C" };
    case "sent":
      return { backgroundColor: "#FFF3E0", color: "#E65100" };
    case "cancelled":
      return { backgroundColor: "#F5F5F5", color: "#666" };
    default:
      return { backgroundColor: "#F5F5F5", color: "#444" };
  }
}
