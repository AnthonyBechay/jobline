import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Divider,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as PendingIcon,
  HourglassEmpty as WaitingIcon,
  Description as DocumentIcon,
  Flight as FlightIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { 
  Application, 
  ApplicationStatus, 
  DocumentChecklistItem,
  DocumentStatus,
  Payment,
} from '../shared/types'
import { publicApi } from '../services/api'

// Status workflow mapping for client view
const statusWorkflow = {
  [ApplicationStatus.PENDING_MOL]: {
    label: 'Ministry of Labour Pre-Authorization',
    description: 'Your application is being prepared for submission to the Ministry of Labour.',
    icon: <DocumentIcon />,
    color: 'warning' as const,
  },
  [ApplicationStatus.MOL_AUTH_RECEIVED]: {
    label: 'Authorization Received',
    description: 'Great news! The Ministry of Labour has approved your application.',
    icon: <CheckIcon />,
    color: 'success' as const,
  },
  [ApplicationStatus.VISA_PROCESSING]: {
    label: 'Visa Processing',
    description: 'Your worker\'s visa is being processed.',
    icon: <DocumentIcon />,
    color: 'info' as const,
  },
  [ApplicationStatus.VISA_RECEIVED]: {
    label: 'Visa Approved',
    description: 'The visa has been approved! Preparing for worker arrival.',
    icon: <FlightIcon />,
    color: 'success' as const,
  },
  [ApplicationStatus.WORKER_ARRIVED]: {
    label: 'Worker Arrived',
    description: 'Your worker has arrived in Lebanon. Final paperwork is being processed.',
    icon: <HomeIcon />,
    color: 'success' as const,
  },
  [ApplicationStatus.LABOUR_PERMIT_PROCESSING]: {
    label: 'Labour Permit Processing',
    description: 'Processing the labour permit with the Ministry of Labour.',
    icon: <DocumentIcon />,
    color: 'info' as const,
  },
  [ApplicationStatus.RESIDENCY_PERMIT_PROCESSING]: {
    label: 'Residency Permit Processing',
    description: 'Processing the residency permit with General Security.',
    icon: <DocumentIcon />,
    color: 'info' as const,
  },
  [ApplicationStatus.ACTIVE_EMPLOYMENT]: {
    label: 'Active Employment',
    description: 'All paperwork is complete. Your worker is legally employed.',
    icon: <CheckIcon />,
    color: 'success' as const,
  },
  [ApplicationStatus.CONTRACT_ENDED]: {
    label: 'Contract Ended',
    description: 'The employment contract has been terminated.',
    icon: <CheckIcon />,
    color: 'default' as const,
  },
  [ApplicationStatus.RENEWAL_PENDING]: {
    label: 'Renewal Required',
    description: 'Your worker\'s permits are due for renewal.',
    icon: <WarningIcon />,
    color: 'warning' as const,
  },
}

const ClientStatus = () => {
  const { shareableLink } = useParams()
  const [application, setApplication] = useState<Application | null>(null)
  const [documents, setDocuments] = useState<DocumentChecklistItem[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (shareableLink) {
      fetchApplicationStatus()
    }
  }, [shareableLink])

  const fetchApplicationStatus = async () => {
    try {
      // Use public endpoint that doesn't require authentication
      const response = await publicApi.get(`/public/status/${shareableLink}`)
      setApplication(response.data?.application || null)
      setDocuments(response.data?.documents || [])
      setPayments(response.data?.payments || [])
    } catch (err: any) {
      setError('Unable to load application status. Please check your link or contact the office.')
      setDocuments([])
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusSteps = () => {
    const steps = [
      ApplicationStatus.PENDING_MOL,
      ApplicationStatus.MOL_AUTH_RECEIVED,
      ApplicationStatus.VISA_PROCESSING,
      ApplicationStatus.VISA_RECEIVED,
      ApplicationStatus.WORKER_ARRIVED,
      ApplicationStatus.LABOUR_PERMIT_PROCESSING,
      ApplicationStatus.RESIDENCY_PERMIT_PROCESSING,
      ApplicationStatus.ACTIVE_EMPLOYMENT,
    ]
    return steps
  }

  const getDocumentIcon = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.SUBMITTED:
        return <CheckIcon color="success" />
      case DocumentStatus.RECEIVED:
        return <WaitingIcon color="info" />
      default:
        return <PendingIcon color="action" />
    }
  }

  const getDocumentStatusText = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.SUBMITTED:
        return 'Submitted to authorities'
      case DocumentStatus.RECEIVED:
        return 'Received by office'
      default:
        return 'Pending - Please provide'
    }
  }

  const calculateBalance = () => {
    if (!application) return 0
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    // In a real app, you'd have the total amount due from the application
    // For now, we'll use a placeholder
    const totalDue = 5000 // This should come from the application
    return totalDue - totalPaid
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error || !application) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Alert severity="error">
          {error || 'Application not found'}
        </Alert>
      </Container>
    )
  }

  const statusInfo = statusWorkflow[application.status]
  const steps = getStatusSteps()
  const activeStep = steps.indexOf(application.status)
  const pendingDocuments = documents.filter(d => d.status === DocumentStatus.PENDING)

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h3" gutterBottom>
          Application Status
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Welcome, {application.client?.name}
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, opacity: 0.8 }}>
          Application ID: #{application.id.substring(0, 8).toUpperCase()}
        </Typography>
      </Paper>

      {/* Current Status Alert */}
      <Alert 
        severity={statusInfo.color === 'warning' ? 'warning' : statusInfo.color === 'success' ? 'success' : 'info'}
        icon={statusInfo.icon}
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" gutterBottom>{statusInfo.label}</Typography>
        <Typography>{statusInfo.description}</Typography>
      </Alert>

      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Application Progress</Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step) => (
            <Step key={step}>
              <StepLabel>
                <Typography variant="caption">
                  {statusWorkflow[step].label.split(' ').slice(0, 2).join(' ')}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Grid container spacing={3}>
        {/* Application Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Worker Name"
                    secondary={`${application.candidate?.firstName} ${application.candidate?.lastName}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Nationality"
                    secondary={application.candidate?.nationality}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Application Type"
                    secondary={application.type.replace(/_/g, ' ')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Started Date"
                    secondary={new Date(application.createdAt).toLocaleDateString()}
                  />
                </ListItem>
                {application.permitExpiryDate && (
                  <ListItem>
                    <ListItemText
                      primary="Permit Expiry"
                      secondary={new Date(application.permitExpiryDate).toLocaleDateString()}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Required Documents */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Required Documents
                {pendingDocuments.length > 0 && (
                  <Chip 
                    label={`${pendingDocuments.length} Pending`} 
                    color="warning" 
                    size="small" 
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
              {documents.length === 0 ? (
                <Typography color="textSecondary">
                  No documents required at this stage.
                </Typography>
              ) : (
                <List dense>
                  {documents.map((doc) => (
                    <ListItem key={doc.id}>
                      <ListItemIcon>
                        {getDocumentIcon(doc.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.documentName}
                        secondary={getDocumentStatusText(doc.status)}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              {pendingDocuments.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Please provide the pending documents to the office as soon as possible.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <MoneyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Payment Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  {payments.length === 0 ? (
                    <Typography color="textSecondary">
                      No payments recorded yet.
                    </Typography>
                  ) : (
                    <List dense>
                      {payments.map((payment) => (
                        <ListItem key={payment.id}>
                          <ListItemText
                            primary={`Payment on ${new Date(payment.paymentDate).toLocaleDateString()}`}
                            secondary={payment.notes || 'Payment received'}
                          />
                          <Typography variant="h6" color="success.main">
                            ${payment.amount}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.100', textAlign: 'center' }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Outstanding Balance
                    </Typography>
                    <Typography variant="h4" color={calculateBalance() > 0 ? 'error.main' : 'success.main'}>
                      ${calculateBalance()}
                    </Typography>
                    {calculateBalance() > 0 && (
                      <Typography variant="caption" color="textSecondary">
                        Please contact the office for payment details
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Need Help?
              </Typography>
              <Typography variant="body1" paragraph>
                If you have any questions about your application status or need to provide documents,
                please contact our office:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2">Phone</Typography>
                  <Typography>+961 1 234 567</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography>info@jobline.lb</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2">Office Hours</Typography>
                  <Typography>Mon-Fri: 9:00 AM - 5:00 PM</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default ClientStatus
