import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Checkbox,
  FormControlLabel,
  Switch,
  ListItemIcon,
  Avatar,
  Snackbar,
  LinearProgress,
  Badge,
  Stack,
  CardActions,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Link as LinkIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Flight as FlightIcon,
  Home as HomeIcon,
  AttachMoney as MoneyIcon,
  Description as DocumentIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  AccountBalance as AccountBalanceIcon,
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Height as HeightIcon,
  FitnessCenter as WeightIcon,
  Cake as AgeIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  CloudUpload as CloudUploadIcon,
  SwapHoriz as SwapHorizIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  ErrorOutline as ErrorIcon,
  HourglassEmpty as PendingIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import {
  Application,
  ApplicationStatus,
  DocumentChecklistItem,
  DocumentStatus,
  Payment,
  Cost,
  UserRole,
} from '../shared/types'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import FileUpload, { UploadedFile } from './FileUpload'
import ApplicationCancellationDialog from './ApplicationCancellationDialog'
import ApplicationActionDialog from './ApplicationActionDialog'

// Status workflow mapping with enhanced styling
const statusWorkflow = {
  [ApplicationStatus.PENDING_MOL]: {
    next: ApplicationStatus.MOL_AUTH_RECEIVED,
    label: 'MoL Pre-Authorization',
    shortLabel: 'MoL Auth',
    icon: <DocumentIcon />,
    color: 'warning' as const,
    description: 'Awaiting Ministry of Labour authorization'
  },
  [ApplicationStatus.MOL_AUTH_RECEIVED]: {
    next: ApplicationStatus.VISA_PROCESSING,
    label: 'MoL Authorization Received',
    shortLabel: 'MoL Done',
    icon: <CheckIcon />,
    color: 'success' as const,
    description: 'Authorization received, ready for visa processing'
  },
  [ApplicationStatus.VISA_PROCESSING]: {
    next: ApplicationStatus.VISA_RECEIVED,
    label: 'Visa Processing',
    shortLabel: 'Visa Process',
    icon: <DocumentIcon />,
    color: 'info' as const,
    description: 'Visa application in progress'
  },
  [ApplicationStatus.VISA_RECEIVED]: {
    next: ApplicationStatus.WORKER_ARRIVED,
    label: 'Visa Received',
    shortLabel: 'Visa Done',
    icon: <FlightIcon />,
    color: 'success' as const,
    description: 'Visa approved, awaiting worker arrival'
  },
  [ApplicationStatus.WORKER_ARRIVED]: {
    next: ApplicationStatus.LABOUR_PERMIT_PROCESSING,
    label: 'Worker Arrived',
    shortLabel: 'Arrived',
    icon: <HomeIcon />,
    color: 'success' as const,
    description: 'Worker has arrived in Lebanon'
  },
  [ApplicationStatus.LABOUR_PERMIT_PROCESSING]: {
    next: ApplicationStatus.RESIDENCY_PERMIT_PROCESSING,
    label: 'Labour Permit Processing',
    shortLabel: 'Labour Permit',
    icon: <DocumentIcon />,
    color: 'info' as const,
    description: 'Processing labour permit documentation'
  },
  [ApplicationStatus.RESIDENCY_PERMIT_PROCESSING]: {
    next: ApplicationStatus.ACTIVE_EMPLOYMENT,
    label: 'Residency Permit Processing',
    shortLabel: 'Residency',
    icon: <DocumentIcon />,
    color: 'info' as const,
    description: 'Processing residency permit documentation'
  },
  [ApplicationStatus.ACTIVE_EMPLOYMENT]: {
    next: null,
    label: 'Active Employment',
    shortLabel: 'Active',
    icon: <CheckIcon />,
    color: 'success' as const,
    description: 'Employment contract active'
  },
  [ApplicationStatus.CONTRACT_ENDED]: {
    next: null,
    label: 'Contract Ended',
    shortLabel: 'Ended',
    icon: <CheckIcon />,
    color: 'default' as const,
    description: 'Employment contract has ended'
  },
  [ApplicationStatus.RENEWAL_PENDING]: {
    next: ApplicationStatus.ACTIVE_EMPLOYMENT,
    label: 'Renewal Pending',
    shortLabel: 'Renewal',
    icon: <WarningIcon />,
    color: 'warning' as const,
    description: 'Renewal documents required'
  },
  [ApplicationStatus.CANCELLED_PRE_ARRIVAL]: {
    next: null,
    label: 'Cancelled (Pre-Arrival)',
    shortLabel: 'Cancelled',
    icon: <CancelIcon />,
    color: 'error' as const,
    description: 'Application cancelled before worker arrival'
  },
  [ApplicationStatus.CANCELLED_POST_ARRIVAL]: {
    next: null,
    label: 'Cancelled (Post-Arrival)',
    shortLabel: 'Cancelled',
    icon: <CancelIcon />,
    color: 'error' as const,
    description: 'Application cancelled after worker arrival'
  },
  [ApplicationStatus.CANCELLED_CANDIDATE]: {
    next: null,
    label: 'Cancelled (Candidate)',
    shortLabel: 'Cancelled',
    icon: <CancelIcon />,
    color: 'error' as const,
    description: 'Application cancelled by candidate'
  },
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  )
}

const ApplicationDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const theme = useTheme()
  const [application, setApplication] = useState<Application | null>(null)
  const [documents, setDocuments] = useState<DocumentChecklistItem[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [costs, setCosts] = useState<Cost[]>([])
  const [feeTemplates, setFeeTemplates] = useState<any[]>([])
  const [costTypes, setCostTypes] = useState<any[]>([])
  const [paymentTypes, setPaymentTypes] = useState<any[]>([])
  const [brokers, setBrokers] = useState<any[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  
  // Dialog states
  const [updateStatusDialog, setUpdateStatusDialog] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [costDialog, setCostDialog] = useState(false)
  const [feeDialog, setFeeDialog] = useState(false)
  const [editClientDialog, setEditClientDialog] = useState(false)
  const [editCandidateDialog, setEditCandidateDialog] = useState(false)
  const [editBrokerDialog, setEditBrokerDialog] = useState(false)
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false)
  const [applicationActionDialogOpen, setApplicationActionDialogOpen] = useState(false)
  const [arrivalDateDialog, setArrivalDateDialog] = useState(false)
  const [arrivalDate, setArrivalDate] = useState('')
  const [laborPermitDateDialog, setLaborPermitDateDialog] = useState(false)
  const [laborPermitDate, setLaborPermitDate] = useState('')
  const [residencyPermitDateDialog, setResidencyPermitDateDialog] = useState(false)
  const [residencyPermitDate, setResidencyPermitDate] = useState('')
  const [validationError, setValidationError] = useState<string>('')
  
  // Form controls for dialogs
  const paymentForm = useForm<any>()
  const costForm = useForm<any>()
  const feeForm = useForm<any>()
  const brokerForm = useForm<any>()

  useEffect(() => {
    if (id) {
      fetchApplicationDetails()
      fetchFeeTemplates()
      fetchPaymentTypes()
      fetchBrokers()
      if (user?.role === UserRole.SUPER_ADMIN) {
        fetchCostTypes()
      }
    }
  }, [id, user])

  const fetchApplicationDetails = async () => {
    try {
      const [appRes, docsRes, paymentsRes, filesRes] = await Promise.all([
        api.get<Application>(`/applications/${id}`),
        api.get<DocumentChecklistItem[]>(`/applications/${id}/documents`),
        api.get<Payment[]>(`/applications/${id}/payments`),
        api.get<UploadedFile[]>(`/files?entityType=application&entityId=${id}`),
      ])
      
      setApplication(appRes.data)
      setDocuments(docsRes.data || [])
      setPayments(paymentsRes.data || [])
      setUploadedFiles(filesRes.data || [])
      
      if (user?.role === UserRole.SUPER_ADMIN) {
        try {
          const costsRes = await api.get<Cost[]>(`/applications/${id}/costs`)
          setCosts(costsRes.data || [])
        } catch {
          setCosts([])
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch application details')
    } finally {
      setLoading(false)
    }
  }

  const fetchFeeTemplates = async () => {
    try {
      const response = await api.get('/fee-templates')
      setFeeTemplates(response.data || [])
    } catch (err) {
      console.error('Failed to fetch fee templates:', err)
      setFeeTemplates([])
    }
  }

  const fetchCostTypes = async () => {
    try {
      const response = await api.get('/cost-types')
      setCostTypes(response.data || [])
    } catch (err) {
      console.error('Failed to fetch cost types:', err)
      setCostTypes([
        { id: '1', name: 'Agent Fee', active: true },
        { id: '2', name: 'Broker Fee', active: true },
        { id: '3', name: 'Government Fee', active: true },
        { id: '4', name: 'Ticket', active: true },
        { id: '5', name: 'Expedited Fee', active: true },
        { id: '6', name: 'Attorney Fee', active: true },
        { id: '7', name: 'Other', active: true },
      ])
    }
  }

  const fetchPaymentTypes = async () => {
    try {
      const response = await api.get('/payments/types')
      setPaymentTypes(response.data || [])
    } catch (err) {
      console.error('Failed to fetch payment types:', err)
      // Fallback to predefined types if API fails
      setPaymentTypes([
        { id: 'fee', name: 'Application Fee', isRefundable: true },
        { id: 'insurance', name: 'Insurance', isRefundable: false },
        { id: 'visa', name: 'Visa Fee', isRefundable: false },
        { id: 'medical', name: 'Medical Checkup', isRefundable: false },
        { id: 'transport', name: 'Transportation', isRefundable: false },
        { id: 'other', name: 'Other', isRefundable: true }
      ])
    }
  }

  const fetchBrokers = async () => {
    try {
      const response = await api.get('/brokers')
      setBrokers(response.data || [])
    } catch (err) {
      console.error('Failed to fetch brokers:', err)
    }
  }

  const handleUpdateDocumentStatus = async (documentId: string, status: DocumentStatus) => {
    try {
      await api.patch(`/document-items/${documentId}`, { status })
      await fetchApplicationDetails()
      setSnackbarMessage('Document status updated')
      setSnackbarOpen(true)
    } catch (err) {
      console.error('Failed to update document status:', err)
    }
  }

  const handleUploadDocument = async (doc: DocumentChecklistItem) => {
    try {
      // Create a file input element
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        // Get upload URL from backend
        const uploadResponse = await api.post('/files/upload-url', {
          fileName: file.name,
          fileType: file.type,
          entityType: 'application',
          entityId: id,
          documentType: doc.documentName,
          stage: doc.stage
        })

        const { uploadUrl, fileKey } = uploadResponse.data

        // Upload file to Backblaze
        const uploadResult = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        })

        if (!uploadResult.ok) {
          throw new Error('Failed to upload file')
        }

        // Update document status to received
        await api.patch(`/document-items/${doc.id}`, { 
          status: DocumentStatus.RECEIVED 
        })

        // Refresh application details
        await fetchApplicationDetails()
        
        setSnackbarMessage('Document uploaded successfully')
        setSnackbarOpen(true)
      }
      input.click()
    } catch (error) {
      console.error('Failed to upload document:', error)
      setSnackbarMessage('Failed to upload document')
      setSnackbarOpen(true)
    }
  }

  const handleFileUploadComplete = (files: UploadedFile[]) => {
    setUploadedFiles(files)
    setSnackbarMessage('Files uploaded successfully')
    setSnackbarOpen(true)
  }

  const handleGuarantorChangeSuccess = (message: string) => {
    setSnackbarMessage(message)
    setSnackbarOpen(true)
    fetchApplicationDetails() // Refresh application details
  }

  const handleGuarantorChangeError = (message: string) => {
    setSnackbarMessage(message)
    setSnackbarOpen(true)
  }

  const handleUpdateApplicationStatus = async (newStatus: ApplicationStatus) => {
    try {
      setValidationError('')
      
      // Check if moving to WORKER_ARRIVED status
      if (newStatus === ApplicationStatus.WORKER_ARRIVED) {
        setUpdateStatusDialog(false)
        setArrivalDateDialog(true)
        return
      }
      
      // Check if moving to LABOUR_PERMIT_PROCESSING status
      if (newStatus === ApplicationStatus.LABOUR_PERMIT_PROCESSING) {
        setUpdateStatusDialog(false)
        setLaborPermitDateDialog(true)
        return
      }
      
      // Check if moving to RESIDENCY_PERMIT_PROCESSING status
      if (newStatus === ApplicationStatus.RESIDENCY_PERMIT_PROCESSING) {
        setUpdateStatusDialog(false)
        setResidencyPermitDateDialog(true)
        return
      }
      
      await api.patch(`/applications/${id}`, { status: newStatus })
      setUpdateStatusDialog(false)
      await fetchApplicationDetails()
      setSnackbarMessage('Application status updated successfully')
      setSnackbarOpen(true)
    } catch (err: any) {
      const errorData = err.response?.data
      if (errorData?.userFriendly && errorData?.scrollToDocuments) {
        // User-friendly validation error - show in yellow alert at top
        setValidationError(errorData.message || errorData.error)
        setUpdateStatusDialog(false)
        // Switch to documents tab
        setTabValue(0)
        // Scroll to top to show the error
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setError(err.response?.data?.error || 'Failed to update status')
      }
    }
  }

  const handleConfirmArrivalDate = async () => {
    if (!arrivalDate) {
      setSnackbarMessage('Please select an arrival date')
      setSnackbarOpen(true)
      return
    }
    
    try {
      await api.patch(`/applications/${id}/status`, {
        status: ApplicationStatus.WORKER_ARRIVED,
        exactArrivalDate: arrivalDate
      })
      setArrivalDateDialog(false)
      setArrivalDate('')
      await fetchApplicationDetails()
      setSnackbarMessage('Application status updated with arrival date')
      setSnackbarOpen(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status')
    }
  }

  const handleConfirmLaborPermitDate = async () => {
    if (!laborPermitDate) {
      setSnackbarMessage('Please select a labor permit date')
      setSnackbarOpen(true)
      return
    }
    
    try {
      await api.patch(`/applications/${id}/status`, {
        status: ApplicationStatus.LABOUR_PERMIT_PROCESSING,
        laborPermitDate: laborPermitDate
      })
      setLaborPermitDateDialog(false)
      setLaborPermitDate('')
      await fetchApplicationDetails()
      setSnackbarMessage('Application status updated with labor permit date')
      setSnackbarOpen(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status')
    }
  }

  const handleConfirmResidencyPermitDate = async () => {
    if (!residencyPermitDate) {
      setSnackbarMessage('Please select a residency permit date')
      setSnackbarOpen(true)
      return
    }
    
    try {
      await api.patch(`/applications/${id}/status`, {
        status: ApplicationStatus.RESIDENCY_PERMIT_PROCESSING,
        residencyPermitDate: residencyPermitDate
      })
      setResidencyPermitDateDialog(false)
      setResidencyPermitDate('')
      await fetchApplicationDetails()
      setSnackbarMessage('Application status updated with residency permit date')
      setSnackbarOpen(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status')
    }
  }

  const handleAddPayment = async (data: any) => {
    try {
      const paymentType = paymentTypes.find(pt => pt.id === data.paymentType)
      await api.post('/payments', {
        ...data,
        applicationId: id,
        clientId: application?.clientId,
        isRefundable: paymentType?.isRefundable ?? true
      })
      setPaymentDialog(false)
      paymentForm.reset()
      await fetchApplicationDetails()
      setSnackbarMessage('Payment added successfully')
      setSnackbarOpen(true)
    } catch (err: any) {
      console.error('Failed to add payment:', err)
    }
  }

  const handleAddCost = async (data: any) => {
    try {
      await api.post('/costs', {
        ...data,
        applicationId: id,
      })
      setCostDialog(false)
      costForm.reset()
      await fetchApplicationDetails()
      setSnackbarMessage('Cost added successfully')
      setSnackbarOpen(true)
    } catch (err: any) {
      console.error('Failed to add cost:', err)
    }
  }

  const handleSetFee = async (data: any) => {
    try {
      await api.patch(`/applications/${id}`, {
        feeTemplateId: data.feeTemplateId,
        finalFeeAmount: data.finalFeeAmount,
      })
      setFeeDialog(false)
      feeForm.reset()
      await fetchApplicationDetails()
      setSnackbarMessage('Fee updated successfully')
      setSnackbarOpen(true)
    } catch (err: any) {
      console.error('Failed to set fee:', err)
    }
  }

  const handleUpdateBroker = async (data: any) => {
    try {
      await api.patch(`/applications/${id}`, {
        brokerId: data.brokerId || null,
      })
      setEditBrokerDialog(false)
      brokerForm.reset()
      await fetchApplicationDetails()
      setSnackbarMessage('Broker updated successfully')
      setSnackbarOpen(true)
    } catch (err: any) {
      console.error('Failed to update broker:', err)
    }
  }

  const handleToggleLawyerService = async (enabled: boolean) => {
    try {
      await api.patch(`/applications/${id}`, {
        lawyerServiceRequested: enabled,
        lawyerFeeCost: enabled ? 500 : 0, // Default cost
        lawyerFeeCharge: enabled ? 750 : 0, // Default charge
      })
      await fetchApplicationDetails()
      setSnackbarMessage(`Lawyer service ${enabled ? 'enabled' : 'disabled'} successfully`)
      setSnackbarOpen(true)
    } catch (err: any) {
      console.error('Failed to toggle lawyer service:', err)
    }
  }

  const handleCopyShareableLink = () => {
    if (application?.shareableLink) {
      const fullUrl = `${window.location.origin}/status/${application.shareableLink}`
      navigator.clipboard.writeText(fullUrl)
      setSnackbarMessage('Client link copied to clipboard')
      setSnackbarOpen(true)
    }
  }

  const handleDownloadPdf = async () => {
    if (!application) return
    
    setDownloadingPdf(true)
    try {
      const response = await api.get(`/applications/${id}/pdf`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `application_${application.id.substring(0, 8)}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      setSnackbarMessage('PDF downloaded successfully')
      setSnackbarOpen(true)
    } catch (err) {
      console.error('Failed to download PDF:', err)
      setSnackbarMessage('Failed to download PDF')
      setSnackbarOpen(true)
    } finally {
      setDownloadingPdf(false)
    }
  }

  const getStatusSteps = () => {
    return [
      ApplicationStatus.PENDING_MOL,
      ApplicationStatus.MOL_AUTH_RECEIVED,
      ApplicationStatus.VISA_PROCESSING,
      ApplicationStatus.VISA_RECEIVED,
      ApplicationStatus.WORKER_ARRIVED,
      ApplicationStatus.LABOUR_PERMIT_PROCESSING,
      ApplicationStatus.RESIDENCY_PERMIT_PROCESSING,
      ApplicationStatus.ACTIVE_EMPLOYMENT,
    ]
  }

  const calculateAge = (birthDate: string | Date) => {
    const today = new Date()
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  if (loading) return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <LinearProgress />
    </Box>
  )
  
  if (error && !validationError) return <Alert severity="error">{error}</Alert>
  if (!application) return <Alert severity="info">Application not found</Alert>

  const statusInfo = statusWorkflow[application.status as keyof typeof statusWorkflow]
  const steps = getStatusSteps()
  const activeStep = steps.indexOf(application.status)

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0)
  const profit = totalRevenue - totalCosts

  // Separate documents by required from
  const officeDocuments = documents.filter(doc => doc.requiredFrom === 'office')
  const clientDocuments = documents.filter(doc => doc.requiredFrom === 'client')
  
  // Count pending documents
  const pendingOfficeDocsCount = officeDocuments.filter(d => d.status === DocumentStatus.PENDING).length
  const pendingClientDocsCount = clientDocuments.filter(d => d.status === DocumentStatus.PENDING).length

  // Auto-select fee template based on nationality
  const candidateNationality = application.candidate?.nationality
  const matchingFeeTemplate = feeTemplates.find(
    template => template.nationality === candidateNationality
  )

  return (
    <Box>
      {/* Validation Error Alert - Shown at the top in yellow */}
      {validationError && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setValidationError('')}
          icon={<WarningIcon />}
        >
          <Typography variant="subtitle1" fontWeight="medium">
            Documents Required
          </Typography>
          <Typography variant="body2">
            {validationError}
          </Typography>
        </Alert>
      )}

      {/* Header Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          borderRadius: 3,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary.dark">
              Application #{application.id.substring(0, 8).toUpperCase()}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Created on {new Date(application.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            {application && !['CONTRACT_ENDED', 'CANCELLED_PRE_ARRIVAL', 'CANCELLED_POST_ARRIVAL', 'CANCELLED_CANDIDATE'].includes(application.status) && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<SwapHorizIcon />}
                onClick={() => setCancellationDialogOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Cancel/Change
              </Button>
            )}
            <Tooltip title="Download Application PDF">
              <Button
                variant="outlined"
                startIcon={downloadingPdf ? <LinearProgress sx={{ width: 20 }} /> : <PdfIcon />}
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
              >
                PDF
              </Button>
            </Tooltip>
            <Tooltip title="Copy shareable link for client">
              <Button
                variant="outlined"
                startIcon={<CopyIcon />}
                onClick={handleCopyShareableLink}
              >
                Copy Link
              </Button>
            </Tooltip>
            <Button 
              variant="contained" 
              onClick={() => navigate('/applications')}
              sx={{ borderRadius: 2 }}
            >
              Back to List
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Status Progress Card */}
      <Card sx={{ mb: 3, borderRadius: 3, overflow: 'visible' }}>
        <CardContent sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="medium">
              Application Progress
            </Typography>
          </Box>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 1 }}>
            {steps.map((step) => (
              <Step key={step}>
                <StepLabel>{statusWorkflow[step as keyof typeof statusWorkflow]?.shortLabel || step}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
        <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Chip
            label={statusInfo.label}
            color={statusInfo.color}
            icon={statusInfo.icon}
            sx={{ px: 2, py: 2.5, fontSize: '0.9rem' }}
          />
          {statusInfo.next && (
            <Button
              variant="contained"
              size="small"
              onClick={() => setUpdateStatusDialog(true)}
              sx={{ ml: 2, borderRadius: 2 }}
            >
              Move to Next Stage
            </Button>
          )}
        </CardActions>
        <Box sx={{ px: 3, pb: 2 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            {statusInfo.description}
          </Typography>
        </Box>
      </Card>

      <Grid container spacing={3}>
        {/* Enhanced Client & Candidate Cards */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', borderRadius: 3, position: 'relative', overflow: 'visible' }}>
            <Box 
              sx={{ 
                position: 'absolute',
                top: -10,
                left: 20,
                bgcolor: 'background.paper',
                px: 2,
                py: 0.5,
                borderRadius: 2,
                boxShadow: 2,
              }}
            >
              <Typography variant="caption" fontWeight="bold" color="primary.main">
                CLIENT
              </Typography>
            </Box>
            <CardContent sx={{ pt: 4 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.light', mr: 2, width: 56, height: 56 }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {application.client?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Client ID: {application.client?.id.substring(0, 8).toUpperCase()}
                    </Typography>
                  </Box>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={() => navigate(`/clients/edit/${application.clientId}`)}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Stack spacing={2}>
                <Box display="flex" alignItems="center">
                  <PhoneIcon sx={{ mr: 2, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">
                    {typeof application.client?.phone === 'string' 
                      ? application.client.phone 
                      : (application.client?.phone as any)?.phone || 'No phone'}
                  </Typography>
                </Box>
                {(application.client as any)?.email && (
                  <Box display="flex" alignItems="center">
                    <EmailIcon sx={{ mr: 2, color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2">{(application.client as any).email}</Typography>
                  </Box>
                )}
                <Box display="flex" alignItems="flex-start">
                  <LocationIcon sx={{ mr: 2, color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2">
                    {typeof application.client?.address === 'string' 
                      ? application.client.address 
                      : (application.client?.address as any)?.address || 'No address'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Broker Information Card */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', borderRadius: 3, position: 'relative', overflow: 'visible' }}>
            <Box 
              sx={{ 
                position: 'absolute',
                top: -10,
                left: 20,
                bgcolor: 'background.paper',
                px: 2,
                py: 0.5,
                borderRadius: 2,
                boxShadow: 2,
              }}
            >
              <Typography variant="caption" color="primary" fontWeight="bold">
                BROKER INFORMATION
              </Typography>
            </Box>
            <CardContent sx={{ pt: 4 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'secondary.light', mr: 2, width: 56, height: 56 }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {application.broker?.name || 'No Broker Assigned'}
                    </Typography>
                    {application.broker && (
                      <Typography variant="body2" color="text.secondary">
                        Broker ID: {application.broker.id.substring(0, 8).toUpperCase()}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={() => setEditBrokerDialog(true)}
                  sx={{ 
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.2) }
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Box>
              
              {application.broker && (
                <Stack spacing={2}>
                  <Box display="flex" alignItems="center">
                    <PhoneIcon sx={{ mr: 2, color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2">
                      {typeof application.broker.contactDetails === 'string' 
                        ? application.broker.contactDetails 
                        : application.broker.contactDetails?.phone || 'No contact details'}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', borderRadius: 3, position: 'relative', overflow: 'visible' }}>
            <Box 
              sx={{ 
                position: 'absolute',
                top: -10,
                left: 20,
                bgcolor: 'background.paper',
                px: 2,
                py: 0.5,
                borderRadius: 2,
                boxShadow: 2,
              }}
            >
              <Typography variant="caption" fontWeight="bold" color="secondary.main">
                CANDIDATE
              </Typography>
            </Box>
            <CardContent sx={{ pt: 4 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: 'secondary.light', mr: 2, width: 56, height: 56 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {`${application.candidate?.firstName} ${application.candidate?.lastName}`}
                    </Typography>
                    <Chip 
                      label={application.candidate?.status.replace(/_/g, ' ')} 
                      size="small" 
                      color="primary"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={() => navigate(`/candidates/edit/${application.candidateId}`)}
                  sx={{ 
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.2) }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center">
                    <FlagIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2">{application.candidate?.nationality}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center">
                    <AgeIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2">
                      {application.candidate?.dateOfBirth 
                        ? `${calculateAge(application.candidate.dateOfBirth)} years`
                        : 'Age N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center">
                    <HeightIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2">{application.candidate?.height || 'N/A'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center">
                    <WeightIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2">{application.candidate?.weight || 'N/A'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center">
                    <SchoolIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2">{application.candidate?.education || 'N/A'}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Fee Configuration Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center">
                  <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Fee Configuration</Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFeeDialog(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Set Fee
                </Button>
              </Box>
              {application.finalFeeAmount ? (
                <Box>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    ${application.finalFeeAmount}
                  </Typography>
                  {application.feeTemplate && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Template: {application.feeTemplate.name}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No fee set yet
                  {matchingFeeTemplate && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Suggested: {matchingFeeTemplate.name} (${matchingFeeTemplate.defaultPrice})
                    </Typography>
                  )}
                </Alert>
              )}
              
              {/* Lawyer Service Toggle */}
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={application.lawyerServiceRequested || false}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleToggleLawyerService(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Lawyer Service"
                />
                {application.lawyerServiceRequested && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Cost: ${application.lawyerFeeCost || 0} | Charge: ${application.lawyerFeeCharge || 0}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Summary Card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center">
                  <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Financial Summary</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<MoneyIcon />}
                    onClick={() => setPaymentDialog(true)}
                    sx={{ borderRadius: 2 }}
                  >
                    Add Payment
                  </Button>
                  {user?.role === UserRole.SUPER_ADMIN && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setCostDialog(true)}
                      sx={{ borderRadius: 2 }}
                    >
                      Add Cost
                    </Button>
                  )}
                </Stack>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={user?.role === UserRole.SUPER_ADMIN ? 4 : 12}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">Revenue</Typography>
                    <Typography variant="h5" color="success.dark" fontWeight="bold">
                      ${totalRevenue}
                    </Typography>
                  </Box>
                </Grid>
                {user?.role === UserRole.SUPER_ADMIN && (
                  <>
                    <Grid item xs={12} md={4}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">Costs</Typography>
                        <Typography variant="h5" color="error.dark" fontWeight="bold">
                          ${totalCosts}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: profit >= 0 
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.error.main, 0.1),
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">Profit</Typography>
                        <Typography 
                          variant="h5" 
                          color={profit >= 0 ? 'success.dark' : 'error.dark'} 
                          fontWeight="bold"
                        >
                          ${profit}
                        </Typography>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Documents and Financial Details Tabs */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }} id="documents-section">
            <CardContent>
              <Tabs 
                value={tabValue} 
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
              >
                <Tab 
                  label={
                    <Badge badgeContent={pendingOfficeDocsCount} color="error">
                      Office Documents
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge badgeContent={pendingClientDocsCount} color="warning">
                      Client Documents
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge badgeContent={uploadedFiles.length} color="info">
                      Uploaded Documents
                    </Badge>
                  } 
                />
                <Tab label="Payments" />
                {user?.role === UserRole.SUPER_ADMIN && <Tab label="Costs" />}
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                {officeDocuments.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No office documents required for this stage
                  </Alert>
                ) : (
                  <List>
                    {officeDocuments.map((doc) => (
                      <ListItem 
                        key={doc.id}
                        sx={{ 
                          mb: 1,
                          borderRadius: 2,
                          bgcolor: doc.status === DocumentStatus.PENDING 
                            ? alpha(theme.palette.warning.main, 0.05)
                            : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <ListItemIcon>
                          {doc.status === DocumentStatus.PENDING && <PendingIcon color="warning" />}
                          {doc.status === DocumentStatus.RECEIVED && <CheckCircleOutlineIcon color="info" />}
                          {doc.status === DocumentStatus.SUBMITTED && <CheckIcon color="success" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={doc.documentName}
                          secondary={`Stage: ${doc.stage.replace(/_/g, ' ')}`}
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleUploadDocument(doc)}
                              color="primary"
                              title="Upload Document"
                            >
                              <CloudUploadIcon />
                            </IconButton>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={doc.status}
                                onChange={(e) => handleUpdateDocumentStatus(doc.id, e.target.value as DocumentStatus)}
                                sx={{ borderRadius: 2 }}
                              >
                                <MenuItem value={DocumentStatus.PENDING}>Pending</MenuItem>
                                <MenuItem value={DocumentStatus.RECEIVED}>Received</MenuItem>
                                <MenuItem value={DocumentStatus.SUBMITTED}>Submitted</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {clientDocuments.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No client documents required for this stage
                  </Alert>
                ) : (
                  <>
                    <List>
                      {clientDocuments.map((doc) => (
                        <ListItem 
                          key={doc.id}
                          sx={{ 
                            mb: 1,
                            borderRadius: 2,
                            bgcolor: doc.status === DocumentStatus.PENDING 
                              ? alpha(theme.palette.warning.main, 0.05)
                              : alpha(theme.palette.success.main, 0.05),
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <Checkbox
                            checked={doc.status !== DocumentStatus.PENDING}
                            onChange={(e) => 
                              handleUpdateDocumentStatus(
                                doc.id, 
                                e.target.checked ? DocumentStatus.RECEIVED : DocumentStatus.PENDING
                              )
                            }
                          />
                          <ListItemText
                            primary={doc.documentName}
                            secondary={`Stage: ${doc.stage.replace(/_/g, ' ')}`}
                          />
                          <Chip
                            label={doc.status.replace(/_/g, ' ')}
                            size="small"
                            color={doc.status === DocumentStatus.PENDING ? 'warning' : 'success'}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                      These documents will be shown to the client via the shareable link
                    </Alert>
                  </>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Upload Documents
                  </Typography>
                  <FileUpload
                    entityType="application"
                    entityId={id!}
                    fileType="document"
                    maxFiles={10}
                    maxSizeMB={10}
                    onUploadComplete={handleFileUploadComplete}
                    existingFiles={uploadedFiles}
                  />
                </Box>
                
                {uploadedFiles.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Uploaded Documents ({uploadedFiles.length})
                    </Typography>
                    <List>
                      {uploadedFiles
                        .sort((a, b) => {
                          // Sort submitted documents to the end, non-submitted to the top
                          const aSubmitted = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0
                          const bSubmitted = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0
                          return aSubmitted - bSubmitted
                        })
                        .map((file) => (
                        <ListItem 
                          key={file.id}
                          sx={{ 
                            mb: 1,
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                            '&:hover': { bgcolor: 'action.selected' }
                          }}
                        >
                          <ListItemIcon>
                            <DocumentIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.originalName}
                            secondary={`Uploaded: ${new Date(file.uploadedAt).toLocaleDateString()} by ${file.uploadedBy || 'Unknown'}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton 
                              edge="end" 
                              onClick={() => window.open(file.url, '_blank')}
                              size="small"
                            >
                              <ViewIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Currency</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                          <TableCell>${payment.amount}</TableCell>
                          <TableCell>{payment.currency}</TableCell>
                          <TableCell>{payment.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {payments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No payments recorded yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {user?.role === UserRole.SUPER_ADMIN && (
                <TabPanel value={tabValue} index={4}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {costs.map((cost) => (
                          <TableRow key={cost.id}>
                            <TableCell>{new Date(cost.costDate).toLocaleDateString()}</TableCell>
                            <TableCell>{cost.costType}</TableCell>
                            <TableCell>${cost.amount}</TableCell>
                            <TableCell>{cost.description || '-'}</TableCell>
                          </TableRow>
                        ))}
                        {costs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              No costs recorded yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TabPanel>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialogs */}
      
      {/* Update Status Dialog */}
      <Dialog open={updateStatusDialog} onClose={() => setUpdateStatusDialog(false)}>
        <DialogTitle>Update Application Status</DialogTitle>
        <DialogContent>
          <Typography>
            Move application to: {statusInfo.next && statusWorkflow[statusInfo.next as keyof typeof statusWorkflow]?.label}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateStatusDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => statusInfo.next && handleUpdateApplicationStatus(statusInfo.next)} 
            variant="contained"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={paymentForm.handleSubmit(handleAddPayment)}>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="amount"
                  control={paymentForm.control}
                  rules={{ required: 'Amount is required', min: 0 }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Amount"
                      type="number"
                      error={!!paymentForm.formState.errors.amount}
                      helperText={paymentForm.formState.errors.amount?.message as string}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="paymentType"
                  control={paymentForm.control}
                  rules={{ required: 'Payment type is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Payment Type"
                      select
                      error={!!paymentForm.formState.errors.paymentType}
                      helperText={paymentForm.formState.errors.paymentType?.message as string}
                    >
                      {paymentTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.name} {!type.isRefundable && '(Non-refundable)'}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="currency"
                  control={paymentForm.control}
                  defaultValue="USD"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Currency"
                      select
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="LBP">LBP</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={paymentForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Notes"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add Payment</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Cost Dialog */}
      {user?.role === UserRole.SUPER_ADMIN && (
        <Dialog open={costDialog} onClose={() => setCostDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={costForm.handleSubmit(handleAddCost)}>
            <DialogTitle>Add Cost</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Controller
                    name="costType"
                    control={costForm.control}
                    rules={{ required: 'Cost type is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Cost Type"
                        select
                        error={!!costForm.formState.errors.costType}
                        helperText={costForm.formState.errors.costType?.message as string}
                      >
                        {costTypes.filter(ct => ct.active).map((type) => (
                          <MenuItem key={type.id} value={type.name}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="amount"
                    control={costForm.control}
                    rules={{ required: 'Amount is required', min: 0 }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Amount"
                        type="number"
                        error={!!costForm.formState.errors.amount}
                        helperText={costForm.formState.errors.amount?.message as string}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="currency"
                    control={costForm.control}
                    defaultValue="USD"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Currency"
                        select
                      >
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="LBP">LBP</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={costForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Description"
                        multiline
                        rows={2}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCostDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Add Cost</Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

      {/* Set Fee Dialog */}
      <Dialog open={feeDialog} onClose={() => setFeeDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={feeForm.handleSubmit(handleSetFee)}>
          <DialogTitle>Set Application Fee</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="feeTemplateId"
                  control={feeForm.control}
                  defaultValue={matchingFeeTemplate?.id || ''}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Fee Template"
                      select
                      onChange={(e) => {
                        field.onChange(e)
                        const template = feeTemplates.find(t => t.id === e.target.value)
                        if (template) {
                          feeForm.setValue('finalFeeAmount', template.defaultPrice)
                        }
                      }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {feeTemplates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name} - ${template.defaultPrice}
                          {template.nationality && ` (${template.nationality})`}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="finalFeeAmount"
                  control={feeForm.control}
                  defaultValue={matchingFeeTemplate?.defaultPrice || ''}
                  rules={{ required: 'Fee amount is required', min: 0 }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Final Fee Amount"
                      type="number"
                      error={!!feeForm.formState.errors.finalFeeAmount}
                      helperText={feeForm.formState.errors.finalFeeAmount?.message as string}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeeDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Set Fee</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editClientDialog} onClose={() => setEditClientDialog(false)}>
        <DialogTitle>Edit Client</DialogTitle>
        <DialogContent>
          <Typography>Redirecting to client edit page...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditClientDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => navigate(`/clients/edit/${application.clientId}`)} 
            variant="contained"
          >
            Go to Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Candidate Dialog */}
      <Dialog open={editCandidateDialog} onClose={() => setEditCandidateDialog(false)}>
        <DialogTitle>Edit Candidate</DialogTitle>
        <DialogContent>
          <Typography>Redirecting to candidate edit page...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCandidateDialog(false)}>Cancel</Button>
          <Button 
            onClick={() => navigate(`/candidates/edit/${application.candidateId}`)} 
            variant="contained"
          >
            Go to Edit
          </Button>
        </DialogActions>
      </Dialog>



      {/* Edit Broker Dialog */}
      <Dialog open={editBrokerDialog} onClose={() => setEditBrokerDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={brokerForm.handleSubmit(handleUpdateBroker)}>
          <DialogTitle>Edit Broker</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="brokerId"
                  control={brokerForm.control}
                  defaultValue={application?.brokerId || ''}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Broker"
                    >
                      <MenuItem value="">No Broker</MenuItem>
                      {brokers.map((broker) => (
                        <MenuItem key={broker.id} value={broker.id}>
                          {broker.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditBrokerDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Update Broker</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Application Cancellation Dialog */}
      {application && (
        <ApplicationCancellationDialog
          open={cancellationDialogOpen}
          onClose={() => setCancellationDialogOpen(false)}
          applicationId={application.id}
          applicationStatus={application.status}
          candidateName={`${application.candidate?.firstName} ${application.candidate?.lastName}`}
          clientName={application.client?.name || ''}
          onSuccess={(message) => {
            setCancellationDialogOpen(false)
            fetchApplicationDetails()
            setSnackbarMessage(message || 'Application cancelled successfully')
            setSnackbarOpen(true)
          }}
          onError={(error) => {
            setSnackbarMessage(error)
            setSnackbarOpen(true)
          }}
        />
      )}

      {/* Application Action Dialog */}
      {application && (
        <ApplicationActionDialog
          open={applicationActionDialogOpen}
          onClose={() => setApplicationActionDialogOpen(false)}
          applicationId={application.id}
          candidateName={`${application.candidate?.firstName} ${application.candidate?.lastName}`}
          currentClientName={application.client?.name || ''}
          applicationStatus={application.status}
          onSuccess={(message) => {
            setApplicationActionDialogOpen(false)
            fetchApplicationDetails()
            setSnackbarMessage(message || 'Action processed successfully')
            setSnackbarOpen(true)
          }}
          onError={(error) => {
            setSnackbarMessage(error)
            setSnackbarOpen(true)
          }}
        />
      )}

      {/* Arrival Date Dialog */}
      <Dialog open={arrivalDateDialog} onClose={() => setArrivalDateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <FlightIcon sx={{ mr: 1, color: 'primary.main' }} />
            Enter Exact Arrival Date
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Please enter the exact arrival date from the candidate's passport stamp.
            This date is important for calculating probation periods and refunds.
          </Alert>
          <TextField
            type="date"
            label="Arrival Date"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
            sx={{ mt: 2 }}
            inputProps={{
              max: new Date().toISOString().split('T')[0] // Can't be future date
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setArrivalDateDialog(false)
            setArrivalDate('')
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmArrivalDate}
            variant="contained"
            disabled={!arrivalDate}
            startIcon={<CheckIcon />}
          >
            Confirm Arrival
          </Button>
        </DialogActions>
      </Dialog>

      {/* Labor Permit Date Dialog */}
      <Dialog open={laborPermitDateDialog} onClose={() => setLaborPermitDateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
            Enter Labor Permit Date
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Please enter the exact date when the labor permit was issued.
            This date is important for tracking permit validity and renewal schedules.
          </Alert>
          <TextField
            type="date"
            label="Labor Permit Date"
            value={laborPermitDate}
            onChange={(e) => setLaborPermitDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
            sx={{ mt: 2 }}
            inputProps={{
              max: new Date().toISOString().split('T')[0] // Can't be future date
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setLaborPermitDateDialog(false)
            setLaborPermitDate('')
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmLaborPermitDate}
            variant="contained"
            disabled={!laborPermitDate}
            startIcon={<CheckIcon />}
          >
            Confirm Labor Permit Date
          </Button>
        </DialogActions>
      </Dialog>

      {/* Residency Permit Date Dialog */}
      <Dialog open={residencyPermitDateDialog} onClose={() => setResidencyPermitDateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
            Enter Residency Permit Date
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Please enter the exact date when the residency permit was issued.
            This date is important for tracking permit validity and renewal schedules.
          </Alert>
          <TextField
            type="date"
            label="Residency Permit Date"
            value={residencyPermitDate}
            onChange={(e) => setResidencyPermitDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
            sx={{ mt: 2 }}
            inputProps={{
              max: new Date().toISOString().split('T')[0] // Can't be future date
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setResidencyPermitDateDialog(false)
            setResidencyPermitDate('')
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmResidencyPermitDate}
            variant="contained"
            disabled={!residencyPermitDate}
            startIcon={<CheckIcon />}
          >
            Confirm Residency Permit Date
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  )
}

export default ApplicationDetails
