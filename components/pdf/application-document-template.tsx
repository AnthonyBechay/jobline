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
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    padding: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingLeft: 10,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#4b5563',
  },
  value: {
    width: '60%',
    color: '#1f2937',
  },
  statusBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
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

type ApplicationData = {
  id: string;
  status: string;
  type: string;
  shareableLink: string;
  finalFeeAmount: string | null;
  lawyerServiceRequested: boolean;
  lawyerFeeCost: string | null;
  lawyerFeeCharge: string | null;
  permitExpiryDate: Date | null;
  exactArrivalDate: Date | null;
  laborPermitDate: Date | null;
  residencyPermitDate: Date | null;
  createdAt: Date;
  candidate: {
    firstName: string;
    lastName: string;
    nationality: string | null;
  } | null;
  client: {
    name: string;
  } | null;
  broker: {
    name: string;
  } | null;
};

interface ApplicationDocumentTemplateProps {
  application: ApplicationData;
  companyName?: string;
}

export function ApplicationDocumentTemplate({
  application,
  companyName = 'Jobline',
}: ApplicationDocumentTemplateProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return 'N/A';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Application Document</Text>
          <Text style={styles.subtitle}>Reference: {application.id.slice(0, 8)}</Text>
        </View>

        {/* Application Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{formatStatus(application.status)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>{formatStatus(application.type)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Created Date:</Text>
            <Text style={styles.value}>{formatDate(application.createdAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Shareable Link:</Text>
            <Text style={styles.value}>{application.shareableLink}</Text>
          </View>
        </View>

        {/* Candidate Information */}
        {application.candidate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Candidate Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>
                {application.candidate.firstName} {application.candidate.lastName}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Nationality:</Text>
              <Text style={styles.value}>{application.candidate.nationality || 'N/A'}</Text>
            </View>
          </View>
        )}

        {/* Client Information */}
        {application.client && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Client Name:</Text>
              <Text style={styles.value}>{application.client.name}</Text>
            </View>
          </View>
        )}

        {/* Broker Information */}
        {application.broker && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Broker Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Broker Name:</Text>
              <Text style={styles.value}>{application.broker.name}</Text>
            </View>
          </View>
        )}

        {/* Financial Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Final Fee Amount:</Text>
            <Text style={styles.value}>{formatCurrency(application.finalFeeAmount)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Lawyer Service:</Text>
            <Text style={styles.value}>
              {application.lawyerServiceRequested ? 'Requested' : 'Not Requested'}
            </Text>
          </View>
          {application.lawyerServiceRequested && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Lawyer Fee Cost:</Text>
                <Text style={styles.value}>{formatCurrency(application.lawyerFeeCost)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Lawyer Fee Charge:</Text>
                <Text style={styles.value}>{formatCurrency(application.lawyerFeeCharge)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Important Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Dates</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Exact Arrival Date:</Text>
            <Text style={styles.value}>{formatDate(application.exactArrivalDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Labor Permit Date:</Text>
            <Text style={styles.value}>{formatDate(application.laborPermitDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Residency Permit Date:</Text>
            <Text style={styles.value}>{formatDate(application.residencyPermitDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Permit Expiry Date:</Text>
            <Text style={styles.value}>{formatDate(application.permitExpiryDate)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated by {companyName} on {formatDate(new Date())}
          </Text>
          <Text>This document is confidential and intended for authorized use only.</Text>
        </View>
      </Page>
    </Document>
  );
}
