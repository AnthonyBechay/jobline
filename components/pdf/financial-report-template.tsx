import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    padding: 6,
  },
  summaryCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
    border: 1,
    borderColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  table: {
    display: 'flex',
    width: '100%',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
    borderBottom: 1,
    borderBottomColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    fontSize: 9,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
  },
  colDate: { width: '20%' },
  colType: { width: '25%' },
  colDescription: { width: '35%' },
  colAmount: { width: '20%', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
});

type PaymentData = {
  id: string;
  amount: string;
  currency: string;
  paymentDate: Date;
  paymentType: string;
  isRefundable: boolean;
  notes: string | null;
  application?: {
    candidate?: {
      firstName: string;
      lastName: string;
    };
  };
};

type CostData = {
  id: string;
  amount: string;
  currency: string;
  costDate: Date;
  costType: string;
  description: string | null;
  application?: {
    candidate?: {
      firstName: string;
      lastName: string;
    };
  };
};

interface FinancialReportTemplateProps {
  payments: PaymentData[];
  costs: CostData[];
  startDate?: Date;
  endDate?: Date;
  companyName?: string;
}

export function FinancialReportTemplate({
  payments,
  costs,
  startDate,
  endDate,
  companyName = 'Jobline',
}: FinancialReportTemplateProps) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: string, currency: string = 'USD') => {
    return `${parseFloat(amount).toFixed(2)} ${currency}`;
  };

  // Calculate totals
  const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalCosts = costs.reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const netProfit = totalRevenue - totalCosts;
  const refundableAmount = payments
    .filter((p) => p.isRefundable)
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const reportPeriod = startDate && endDate
    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
    : 'All Time';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Financial Report</Text>
          <Text style={styles.subtitle}>{reportPeriod}</Text>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[styles.summaryCard, { flex: 1 }]}>
              <Text style={styles.summaryLabel}>Total Revenue</Text>
              <Text style={styles.summaryValue}>${totalRevenue.toFixed(2)}</Text>
            </View>

            <View style={[styles.summaryCard, { flex: 1 }]}>
              <Text style={styles.summaryLabel}>Total Costs</Text>
              <Text style={styles.summaryValue}>${totalCosts.toFixed(2)}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <View style={[styles.summaryCard, { flex: 1 }]}>
              <Text style={styles.summaryLabel}>Net Profit</Text>
              <Text style={[styles.summaryValue, { color: netProfit >= 0 ? '#059669' : '#dc2626' }]}>
                ${netProfit.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.summaryCard, { flex: 1 }]}>
              <Text style={styles.summaryLabel}>Refundable Amount</Text>
              <Text style={styles.summaryValue}>${refundableAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Payments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payments ({payments.length})</Text>

          {payments.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.colDate}>Date</Text>
                <Text style={styles.colType}>Type</Text>
                <Text style={styles.colDescription}>Description</Text>
                <Text style={styles.colAmount}>Amount</Text>
              </View>

              {payments.slice(0, 15).map((payment) => (
                <View key={payment.id} style={styles.tableRow}>
                  <Text style={styles.colDate}>{formatDate(payment.paymentDate)}</Text>
                  <Text style={styles.colType}>{payment.paymentType}</Text>
                  <Text style={styles.colDescription}>
                    {payment.application?.candidate
                      ? `${payment.application.candidate.firstName} ${payment.application.candidate.lastName}`
                      : payment.notes || 'N/A'}
                  </Text>
                  <Text style={styles.colAmount}>
                    {formatCurrency(payment.amount, payment.currency)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 10 }}>
              No payments recorded for this period.
            </Text>
          )}
        </View>

        {/* Costs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Costs ({costs.length})</Text>

          {costs.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.colDate}>Date</Text>
                <Text style={styles.colType}>Type</Text>
                <Text style={styles.colDescription}>Description</Text>
                <Text style={styles.colAmount}>Amount</Text>
              </View>

              {costs.slice(0, 15).map((cost) => (
                <View key={cost.id} style={styles.tableRow}>
                  <Text style={styles.colDate}>{formatDate(cost.costDate)}</Text>
                  <Text style={styles.colType}>{cost.costType}</Text>
                  <Text style={styles.colDescription}>
                    {cost.application?.candidate
                      ? `${cost.application.candidate.firstName} ${cost.application.candidate.lastName}`
                      : cost.description || 'N/A'}
                  </Text>
                  <Text style={styles.colAmount}>
                    {formatCurrency(cost.amount, cost.currency)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 10 }}>
              No costs recorded for this period.
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated by {companyName} on {formatDate(new Date())}
          </Text>
          <Text>This report is confidential and intended for authorized use only.</Text>
        </View>
      </Page>
    </Document>
  );
}
