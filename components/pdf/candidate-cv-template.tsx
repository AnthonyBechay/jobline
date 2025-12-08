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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
    color: '#4b5563',
  },
  value: {
    width: '70%',
    color: '#1f2937',
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

type CandidateData = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  passportNumber: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  maritalStatus: string | null;
  education: string | null;
  experience: string | null;
  skills: string | null;
  notes: string | null;
  createdAt: Date;
};

interface CandidateCVTemplateProps {
  candidate: CandidateData;
  companyName?: string;
}

export function CandidateCVTemplate({ candidate, companyName = 'Jobline' }: CandidateCVTemplateProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {candidate.firstName} {candidate.lastName}
          </Text>
          <Text style={styles.subtitle}>Candidate Profile</Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{candidate.email || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{candidate.phone || 'N/A'}</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date of Birth:</Text>
            <Text style={styles.value}>{formatDate(candidate.dateOfBirth)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nationality:</Text>
            <Text style={styles.value}>{candidate.nationality || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Passport Number:</Text>
            <Text style={styles.value}>{candidate.passportNumber || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gender:</Text>
            <Text style={styles.value}>{candidate.gender || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Marital Status:</Text>
            <Text style={styles.value}>{candidate.maritalStatus || 'N/A'}</Text>
          </View>
        </View>

        {/* Education */}
        {candidate.education && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            <Text style={styles.value}>{candidate.education}</Text>
          </View>
        )}

        {/* Work Experience */}
        {candidate.experience && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            <Text style={styles.value}>{candidate.experience}</Text>
          </View>
        )}

        {/* Skills */}
        {candidate.skills && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.value}>{candidate.skills}</Text>
          </View>
        )}

        {/* Additional Notes */}
        {candidate.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.value}>{candidate.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated by {companyName} on {formatDate(new Date())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
