import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Grid,
  IconButton,
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
  ListItemIcon,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Badge,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Link as LinkIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as PendingIcon,
  Send as SendIcon,
  AttachMoney as MoneyIcon,
  Description as DocumentIcon,
  Warning as WarningIcon,
  Flight as FlightIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { 
  Application, 
  ApplicationStatus, 
  ApplicationType,
  Client,
  Candidate,
  CandidateStatus,
  DocumentChecklistItem,
  DocumentStatus,
  PaginatedResponse,
  Broker,
  Payment,
  Cost,
  UserRole
} from '../shared/types'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

// Status workflow mapping
const statusWorkflow = {
  [ApplicationStatus.PENDING_MOL]: {
    next: ApplicationStatus.MOL_AUTH_RECEIVED,
    label: 'MoL Pre-Authorization',
    icon: <DocumentIcon />,
    color: 'warning' as const,
  },
  [ApplicationStatus.MOL_AUTH_RECEIVED]: {
    next: ApplicationStatus.VISA_PROCESSING,
    label: 'MoL Authorization Received',
    icon: <CheckIcon />,
    color: 'success' as const,
  },
  [ApplicationStatus.VISA_PROCESSING]: {
    next: ApplicationStatus.VISA_RECEIVED,
    label: 'Visa Processing',
    icon: <DocumentIcon />,
    color: 'info' as const,
  },
  [ApplicationStatus.VISA_RECEIVED]: {
    next: ApplicationStatus.WORKER_ARRIVED,
    label: 'Visa Received',
    icon: <FlightIcon />,
    color: 'success' as const,
  },
  [ApplicationStatus.WORKER_ARRIVED]: {
    next: ApplicationStatus.LABOUR_PERMIT_PROCESSING,
    label: 'Worker Arrived',
    icon: <HomeIcon />,
    color: 'success' as const,
  },
  [ApplicationStatus.LABOUR_PERMIT_PROCESSING]: {
    next: ApplicationStatus.RESIDENCY_PERMIT_PROCESSING,
    label: 'Labour Permit Processing',
    icon: <DocumentIcon />,
    color: 'info' as const,
  },
  [ApplicationStatus.RESIDENCY_PERMIT_PROCESSING]: {
    next: ApplicationStatus.ACTIVE_EMPLOYMENT,
    label: 'Residency Permit Processing',
    icon: <DocumentIcon />,
    color: 'info' as const,
  },
  [ApplicationStatus.ACTIVE_EMPLOYMENT]: {
    next: null,
    label: 'Active Employment',
    icon: <CheckIcon />,
    color: 'success' as const,
  },
  [ApplicationStatus.CONTRACT_ENDED]: {
    next: null,
    label: 'Contract Ended',
    icon: <CheckIcon />,
    color: 'default' as const,
  },
  [ApplicationStatus.RENEWAL_PENDING]: {
    next: ApplicationStatus.ACTIVE_EMPLOYMENT,
    label: 'Renewal Pending',
    icon: <WarningIcon />,
    color: 'warning' as const,
  },
}

// Application List Component
const ApplicationList = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<ApplicationType | ''>('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)

  useEffect(() => {
    fetchApplications()
  }, [page, pageSize, statusFilter, typeFilter])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', (page + 1).toString())
      params.append('limit', pageSize.toString())
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('type', typeFilter)

      const response = await api.get<any>(`/applications?${params}`)
      const applications = response.data.applications || response.data.data || []
      const pagination = response.data.pagination || { total: 0 }
      
      setApplications(applications)
      setTotalRows(pagination.total)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (shareableLink: string) => {
    const fullUrl = `${window.location.origin}/status/${shareableLink}`
    navigator.clipboard.writeText(fullUrl)
  }

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 100,
      renderCell: (params) => params.value.substring(0, 8)
    },
    {
      field: 'client',
      headerName: 'Client',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => params.row.client?.name || '-'
    },
    {
      field: 'candidate',
      headerName: 'Candidate',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => 
        `${params.row.candidate?.firstName || ''} ${params.row.candidate?.lastName || ''}`
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value.replace(/_/g, ' ')}
          color={params.value === ApplicationType.NEW_CANDIDATE ? 'primary' : 'secondary'}
          size="small"
        />
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 200,
      renderCell: (params) => {
        const statusInfo = statusWorkflow[params.value as ApplicationStatus]
        return (
          <Chip
            label={statusInfo.label}
            color={statusInfo.color}
            size="small"
            icon={statusInfo.icon}
          />
        )
      }
    },
    {
      field: 'shareableLink',
      headerName: 'Client Link',
      width: 100,
      renderCell: (params) => (
        <Tooltip title="Copy client status link">
          <IconButton size="small" onClick={() => handleCopyLink(params.value)}>
            <LinkIcon />
          </IconButton>
        </Tooltip>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => navigate(`/applications/${params.row.id}`)}>
            <ViewIcon />
          </IconButton>
          <IconButton size="small" onClick={() => navigate(`/applications/edit/${params.row.id}`)}>
            <EditIcon />
          </IconButton>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Applications</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/applications/new')}
        >
          New Application
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
              >
                <MenuItem value="">All</MenuItem>
                {Object.values(ApplicationStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {statusWorkflow[status].label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Type Filter</InputLabel>
              <Select
                value={typeFilter}
                label="Type Filter"
                onChange={(e) => setTypeFilter(e.target.value as ApplicationType | '')}
              >
                <MenuItem value="">All</MenuItem>
                {Object.values(ApplicationType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button fullWidth variant="contained" onClick={fetchApplications}>
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={applications || []}
          columns={columns}
          paginationModel={{ page, pageSize }}
          pageSizeOptions={[5, 10, 25, 50]}
          onPaginationModelChange={(model) => {
            setPage(model.page)
            setPageSize(model.pageSize)
          }}
          loading={loading}
          rowCount={totalRows}
          paginationMode="server"
          disableRowSelectionOnClick
          onRowClick={(params) => navigate(`/applications/${params.row.id}`)}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        />
      </Paper>
    </Box>
  )
}

// Application Form Component
const ApplicationForm = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [feeTemplates, setFeeTemplates] = useState<any[]>([])
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>()

  const selectedType = watch('type')
  const selectedCandidateId = watch('candidateId')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Auto-select fee template based on candidate nationality
    if (selectedCandidateId && candidates.length > 0) {
      const candidate = candidates.find(c => c.id === selectedCandidateId)
      if (candidate?.nationality) {
        fetchFeeTemplates(candidate.nationality)
      }
    }
  }, [selectedCandidateId, candidates])

  const fetchData = async () => {
    try {
      const [clientsRes, candidatesRes] = await Promise.all([
        api.get<PaginatedResponse<Client>>('/clients?limit=100'),
        api.get<PaginatedResponse<Candidate>>('/candidates?limit=100&status=' + CandidateStatus.AVAILABLE_ABROAD),
      ])
      setClients(clientsRes.data?.data || [])
      setCandidates(candidatesRes.data?.data || [])
      
      if (user?.role === UserRole.SUPER_ADMIN) {
        try {
          const brokersRes = await api.get<Broker[]>('/brokers')
          setBrokers(brokersRes.data || [])
        } catch {
          setBrokers([])
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setClients([])
      setCandidates([])
      setBrokers([])
    }
  }

  const fetchFeeTemplates = async (nationality?: string) => {
    try {
      const params = nationality ? `?nationality=${nationality}` : ''
      const response = await api.get(`/applications/fee-templates/available${params}`)
      setFeeTemplates(response.data || [])
      
      // Auto-select nationality-specific template if available
      if (nationality && response.data?.length > 0) {
        const nationalityTemplate = response.data.find((t: any) => t.nationality === nationality)
        if (nationalityTemplate) {
          setValue('feeTemplateId', nationalityTemplate.id)
          setValue('finalFeeAmount', nationalityTemplate.defaultPrice)
        }
      }
    } catch (err) {
      console.error('Failed to fetch fee templates:', err)
      setFeeTemplates([])
    }
  }

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)
      // Clean up data before sending
      const cleanData = {
        ...data,
        brokerId: data.brokerId || null, // Convert empty string to null
      }
      const response = await api.post('/applications', cleanData)
      navigate(`/applications/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">New Application</Typography>
        <Button variant="outlined" onClick={() => navigate('/applications')}>
          Back to List
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="type"
                control={control}
                defaultValue={ApplicationType.NEW_CANDIDATE}
                rules={{ required: 'Application type is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Application Type"
                    error={!!errors.type}
                    helperText={errors.type?.message as string}
                  >
                    {Object.values(ApplicationType).map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="clientId"
                control={control}
                rules={{ required: 'Client is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Client"
                    error={!!errors.clientId}
                    helperText={errors.clientId?.message as string}
                  >
                    <MenuItem value="">Select a client</MenuItem>
                    {clients && clients.length > 0 && clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="candidateId"
                control={control}
                rules={{ required: 'Candidate is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Candidate"
                    error={!!errors.candidateId}
                    helperText={errors.candidateId?.message as string}
                  >
                    <MenuItem value="">Select a candidate</MenuItem>
                    {candidates && candidates.length > 0 && candidates.map((candidate) => (
                      <MenuItem key={candidate.id} value={candidate.id}>
                        {candidate.firstName} {candidate.lastName} - {candidate.nationality}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            {user?.role === UserRole.SUPER_ADMIN && (
              <Grid item xs={12} md={6}>
                <Controller
                name="brokerId"
                control={control}
                defaultValue=""
                render={({ field }) => (
                <TextField
                {...field}
                fullWidth
                select
                label="Broker (Optional)"
                value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                      >
                      <MenuItem value="">None</MenuItem>
                      {brokers && brokers.length > 0 && brokers.map((broker) => (
                        <MenuItem key={broker.id} value={broker.id}>
                          {broker.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}
            
            {/* Fee Template Selection */}
            {feeTemplates.length > 0 && (
              <>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="feeTemplateId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        select
                        label="Fee Template"
                        helperText="Auto-selected based on nationality when available"
                      >
                        <MenuItem value="">No template</MenuItem>
                        {feeTemplates.map((template) => (
                          <MenuItem key={template.id} value={template.id}>
                            {template.name} 
                            {template.nationality && ` (${template.nationality})`}
                            - ${template.defaultPrice}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="finalFeeAmount"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Final Fee Amount"
                        helperText="Adjust the fee within template limits"
                        InputProps={{
                          startAdornment: '$',
                        }}
                      />
                    )}
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => navigate('/applications')}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Application'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

// Enhanced Application Details Component
const ApplicationDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [application, setApplication] = useState<Application | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [costs, setCosts] = useState<Cost[]>([])
  const [feeTemplates, setFeeTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updateStatusDialog, setUpdateStatusDialog] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [costDialog, setCostDialog] = useState(false)
  const [feeDialog, setFeeDialog] = useState(false)
  const [documentTab, setDocumentTab] = useState(0)
  const [selectedFeeTemplate, setSelectedFeeTemplate] = useState<any>(null)
  const [finalFeeAmount, setFinalFeeAmount] = useState('')
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency: 'USD',
    notes: '',
  })
  const [costForm, setCostForm] = useState({
    amount: '',
    currency: 'USD',
    costType: 'OTHER',
    description: '',
  })

  useEffect(() => {
    if (id) {
      fetchApplicationDetails()
      fetchFeeTemplates()
      fetchUploadedFiles()
    }
  }, [id])

  const fetchApplicationDetails = async () => {
    try {
      const [appRes, docsRes, paymentsRes] = await Promise.all([
        api.get<Application>(`/applications/${id}`),
        api.get<any[]>(`/applications/${id}/documents`),
        api.get<Payment[]>(`/applications/${id}/payments`),
      ])
      
      setApplication(appRes.data)
      setDocuments(docsRes.data || [])
      setPayments(paymentsRes.data || [])
      
      // Set initial fee values if available
      if (appRes.data.feeTemplate) {
        setSelectedFeeTemplate(appRes.data.feeTemplate)
        setFinalFeeAmount(appRes.data.finalFeeAmount?.toString() || appRes.data.feeTemplate.defaultPrice?.toString() || '')
      }
      
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
      setDocuments([])
      setPayments([])
      setCosts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchFeeTemplates = async () => {
    try {
      const response = await api.get('/applications/fee-templates/available')
      setFeeTemplates(response.data || [])
    } catch (err) {
      console.error('Failed to fetch fee templates:', err)
      setFeeTemplates([])
    }
  }

  const fetchUploadedFiles = async () => {
    try {
      const response = await api.get(`/files?entityType=application&entityId=${id}`)
      setUploadedFiles(response.data || [])
    } catch (err) {
      console.error('Failed to fetch uploaded files:', err)
      setUploadedFiles([])
    }
  }

  const handleFileUpload = async (documentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size should be less than 10MB')
      return
    }

    try {
      setUploadingDoc(documentId)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', 'application')
      formData.append('entityId', id || '')

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Update document status to received
      await handleUpdateDocumentStatus(documentId, DocumentStatus.RECEIVED)
      
      // Refresh uploaded files list
      await fetchUploadedFiles()
      
      // Reset the file input
      event.target.value = ''
    } catch (err: any) {
      console.error('File upload error:', err)
      setError('Failed to upload document')
    } finally {
      setUploadingDoc(null)
    }
  }

  const handleUpdateDocumentStatus = async (documentId: string, status: DocumentStatus) => {
    try {
      await api.patch(`/document-items/${documentId}`, { status })
      await fetchApplicationDetails()
    } catch (err) {
      console.error('Failed to update document status:', err)
    }
  }

  const handleUpdateApplicationStatus = async (newStatus: ApplicationStatus) => {
    try {
      await api.patch(`/applications/${id}`, { status: newStatus })
      setUpdateStatusDialog(false)
      await fetchApplicationDetails()
    } catch (err: any) {
      console.error('Failed to update application status:', err)
      const errorData = err.response?.data
      if (errorData?.userFriendly && errorData?.scrollToDocuments) {
        setError(errorData.message || errorData.error)
        setUpdateStatusDialog(false)
        // Scroll to documents section
        setTimeout(() => {
          const docSection = document.getElementById('document-checklist')
          if (docSection) {
            docSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      } else {
        setError(errorData?.error || 'Failed to update status')
      }
    }
  }

  const handleAddPayment = async () => {
    try {
      await api.post(`/payments`, {
        ...paymentForm,
        applicationId: id,
        clientId: application?.clientId,
        amount: parseFloat(paymentForm.amount),
      })
      setPaymentDialog(false)
      setPaymentForm({ amount: '', currency: 'USD', notes: '' })
      await fetchApplicationDetails()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add payment')
    }
  }

  const handleAddCost = async () => {
    try {
      await api.post(`/costs`, {
        ...costForm,
        applicationId: id,
        amount: parseFloat(costForm.amount),
      })
      setCostDialog(false)
      setCostForm({ amount: '', currency: 'USD', costType: CostType.OTHER, description: '' })
      await fetchApplicationDetails()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add cost')
    }
  }

  const handleSetFee = async () => {
    try {
      await api.patch(`/applications/${id}`, {
        feeTemplateId: selectedFeeTemplate?.id,
        finalFeeAmount: parseFloat(finalFeeAmount),
      })
      setFeeDialog(false)
      await fetchApplicationDetails()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set fee')
    }
  }

  const handleCopyShareableLink = () => {
    if (application) {
      const fullUrl = `${window.location.origin}/status/${application.shareableLink}`
      navigator.clipboard.writeText(fullUrl)
    }
  }

  const handleEditClient = () => {
    if (application?.client) {
      navigate(`/clients/edit/${application.client.id}`)
    }
  }

  const handleEditCandidate = () => {
    if (application?.candidate) {
      navigate(`/candidates/edit/${application.candidate.id}`)
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

  if (loading) return <Box>Loading...</Box>
  if (error) return <Alert severity="error">{error}</Alert>
  if (!application) return <Alert severity="info">Application not found</Alert>

  const statusInfo = statusWorkflow[application.status]
  const steps = getStatusSteps()
  const activeStep = steps.indexOf(application.status)

  // Separate documents by type
  const officeDocuments = documents.filter(d => d.requiredFrom === 'office')
  const clientDocuments = documents.filter(d => d.requiredFrom === 'client')
  
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0)
  const profit = totalRevenue - totalCosts

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Application #{application.id.substring(0, 8)}
        </Typography>
        <Box display="flex" gap={2}>
          <Tooltip title="Copy shareable link for client">
            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={handleCopyShareableLink}
            >
              Copy Client Link
            </Button>
          </Tooltip>
          <Button variant="outlined" onClick={() => navigate('/applications')}>
            Back to List
          </Button>
        </Box>
      </Box>

      {/* Status Progress */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Application Progress</Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step) => (
            <Step key={step}>
              <StepLabel>{statusWorkflow[step].label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box display="flex" justifyContent="center" mt={2}>
          <Chip
            label={statusInfo.label}
            color={statusInfo.color}
            icon={statusInfo.icon}
          />
          {statusInfo.next && (
            <Button
              sx={{ ml: 2 }}
              variant="contained"
              size="small"
              onClick={() => setUpdateStatusDialog(true)}
            >
              Move to Next Stage
            </Button>
          )}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Client & Candidate Info with Edit Buttons */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Client Details
                </Typography>
                <IconButton size="small" onClick={handleEditClient} color="primary">
                  <EditIcon />
                </IconButton>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemText primary="Name" secondary={application.client?.name} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Phone" secondary={application.client?.phone} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Address" secondary={application.client?.address || 'N/A'} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Candidate Details
                </Typography>
                <IconButton size="small" onClick={handleEditCandidate} color="primary">
                  <EditIcon />
                </IconButton>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Name" 
                    secondary={`${application.candidate?.firstName} ${application.candidate?.lastName}`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Nationality" secondary={application.candidate?.nationality} />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Status" 
                    secondary={
                      <Chip 
                        label={application.candidate?.status.replace(/_/g, ' ')} 
                        size="small" 
                        color="primary" 
                      />
                    } 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Fee Management Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Application Fee
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setFeeDialog(true)}
                  disabled={!user || (user.role !== UserRole.SUPER_ADMIN && !!application.feeTemplate)}
                >
                  {application.feeTemplate ? 'Update Fee' : 'Set Fee'}
                </Button>
              </Box>
              {application.feeTemplate ? (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Template: {application.feeTemplate.name}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    Agreed Fee: ${application.finalFeeAmount || application.feeTemplate.defaultPrice}
                  </Typography>
                </Box>
              ) : (
                <Typography color="textSecondary">No fee set for this application</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Document Checklist with Tabs */}
        <Grid item xs={12}>
          <Card id="document-checklist">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DocumentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Document Checklist
              </Typography>
              <Tabs value={documentTab} onChange={(e, v) => setDocumentTab(v)} sx={{ mb: 2 }}>
                <Tab 
                  label={
                    <Badge badgeContent={officeDocuments.filter(d => d.status === 'PENDING').length} color="error">
                      Office Documents
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge badgeContent={clientDocuments.filter(d => d.status === 'PENDING').length} color="warning">
                      Client Requirements
                    </Badge>
                  } 
                />
              </Tabs>
              
              {documentTab === 0 ? (
                <List>
                  {officeDocuments.map((doc) => (
                    <ListItem key={doc.id} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            {doc.documentName}
                            {doc.required && (
                              <Chip label="Required" size="small" color="error" variant="outlined" />
                            )}
                          </Box>
                        }
                        secondary={`Stage: ${doc.stage.replace(/_/g, ' ')}`}
                      />
                      <ListItemSecondaryAction>
                        <Box display="flex" alignItems="center" gap={1}>
                          <input
                            type="file"
                            id={`file-upload-${doc.id}`}
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileUpload(doc.id, e)}
                            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                          />
                          <label htmlFor={`file-upload-${doc.id}`}>
                            <IconButton
                              component="span"
                              size="small"
                              color="primary"
                              disabled={uploadingDoc === doc.id}
                            >
                              {uploadingDoc === doc.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <UploadIcon />
                              )}
                            </IconButton>
                          </label>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={doc.status}
                              onChange={(e) => handleUpdateDocumentStatus(doc.id, e.target.value as DocumentStatus)}
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
                  {officeDocuments.length === 0 && (
                    <Typography color="textSecondary" align="center">No office documents required</Typography>
                  )}
                </List>
              ) : (
                <List>
                  {clientDocuments.map((doc) => (
                    <ListItem key={doc.id} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            {doc.documentName}
                            {doc.required && (
                              <Chip label="Required" size="small" color="error" variant="outlined" />
                            )}
                          </Box>
                        }
                        secondary={`Stage: ${doc.stage.replace(/_/g, ' ')}`}
                      />
                      <ListItemSecondaryAction>
                        <Box display="flex" alignItems="center" gap={1}>
                          <input
                            type="file"
                            id={`file-upload-client-${doc.id}`}
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileUpload(doc.id, e)}
                            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                          />
                          <label htmlFor={`file-upload-client-${doc.id}`}>
                            <IconButton
                              component="span"
                              size="small"
                              color="primary"
                              disabled={uploadingDoc === doc.id}
                            >
                              {uploadingDoc === doc.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <UploadIcon />
                              )}
                            </IconButton>
                          </label>
                          <Chip
                            label={doc.status}
                            size="small"
                            color={doc.status === DocumentStatus.PENDING ? 'warning' : 'success'}
                          />
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {clientDocuments.length === 0 && (
                    <Typography color="textSecondary" align="center">No client documents required</Typography>
                  )}
                </List>
              )}
              
              {/* Uploaded Files Section */}
              {uploadedFiles.length > 0 && (
                <Box mt={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    Uploaded Files
                  </Typography>
                  <List dense>
                    {uploadedFiles.map((file) => (
                      <ListItem key={file.id}>
                        <ListItemIcon>
                          <FileIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={file.originalName}
                          secondary={`Uploaded on ${new Date(file.uploadedAt).toLocaleDateString()} by ${file.uploadedBy}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            component="a"
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Financial Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Financial Summary
                </Typography>
                <Box>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<MoneyIcon />}
                    onClick={() => setPaymentDialog(true)}
                    sx={{ mr: 1 }}
                  >
                    Add Payment
                  </Button>
                  {user?.role === UserRole.SUPER_ADMIN && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setCostDialog(true)}
                    >
                      Add Cost
                    </Button>
                  )}
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={user?.role === UserRole.SUPER_ADMIN ? 4 : 12}>
                  <Typography variant="subtitle1" gutterBottom>Payments (Revenue)</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Notes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                            <TableCell align="right">${payment.amount}</TableCell>
                            <TableCell>{payment.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                        {payments.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} align="center">No payments recorded</TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell><strong>Total</strong></TableCell>
                          <TableCell align="right"><strong>${totalRevenue}</strong></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {user?.role === UserRole.SUPER_ADMIN && (
                  <>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" gutterBottom>Costs</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Type</TableCell>
                              <TableCell align="right">Amount</TableCell>
                              <TableCell>Description</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {costs.map((cost) => (
                              <TableRow key={cost.id}>
                                <TableCell>{cost.costType.replace(/_/g, ' ')}</TableCell>
                                <TableCell align="right">${cost.amount}</TableCell>
                                <TableCell>{cost.description || '-'}</TableCell>
                              </TableRow>
                            ))}
                            {costs.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={3} align="center">No costs recorded</TableCell>
                              </TableRow>
                            )}
                            <TableRow>
                              <TableCell><strong>Total</strong></TableCell>
                              <TableCell align="right"><strong>${totalCosts}</strong></TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: profit >= 0 ? 'success.light' : 'error.light' }}>
                        <Typography variant="subtitle1" gutterBottom>Net Profit</Typography>
                        <Typography variant="h4" color={profit >= 0 ? 'success.dark' : 'error.dark'}>
                          ${profit}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Revenue: ${totalRevenue} - Costs: ${totalCosts}
                        </Typography>
                      </Paper>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fee Dialog */}
      <Dialog open={feeDialog} onClose={() => setFeeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Application Fee</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Fee Template</InputLabel>
            <Select
              value={selectedFeeTemplate?.id || ''}
              onChange={(e) => {
                const template = feeTemplates.find((t: any) => t.id === e.target.value)
                setSelectedFeeTemplate(template)
                setFinalFeeAmount(template?.defaultPrice?.toString() || '')
              }}
            >
              <MenuItem value="">Select template</MenuItem>
              {feeTemplates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name} 
                  {template.nationality && ` (${template.nationality})`}
                  - ${template.defaultPrice}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedFeeTemplate && (
            <>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Range: ${selectedFeeTemplate.minPrice} - ${selectedFeeTemplate.maxPrice}
              </Typography>
              <TextField
                fullWidth
                label="Final Fee Amount"
                type="number"
                value={finalFeeAmount}
                onChange={(e) => setFinalFeeAmount(e.target.value)}
                InputProps={{
                  startAdornment: '$',
                }}
                helperText={`Must be between $${selectedFeeTemplate.minPrice} and $${selectedFeeTemplate.maxPrice}`}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeeDialog(false)}>Cancel</Button>
          <Button onClick={handleSetFee} variant="contained" disabled={!selectedFeeTemplate || !finalFeeAmount}>
            Set Fee
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
            InputProps={{
              startAdornment: '$',
            }}
          />
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={2}
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddPayment} 
            variant="contained"
            disabled={!paymentForm.amount || parseFloat(paymentForm.amount) <= 0}
          >
            Add Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cost Dialog (Super Admin Only) */}
      {user?.role === UserRole.SUPER_ADMIN && (
        <Dialog open={costDialog} onClose={() => setCostDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Cost</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel>Cost Type</InputLabel>
              <Select
                value={costForm.costType}
                onChange={(e) => setCostForm({ ...costForm, costType: e.target.value })}
              >
                <MenuItem value="AGENT_FEE">Agent Fee</MenuItem>
                <MenuItem value="BROKER_FEE">Broker Fee</MenuItem>
                <MenuItem value="GOV_FEE">Government Fee</MenuItem>
                <MenuItem value="TICKET">Ticket</MenuItem>
                <MenuItem value="EXPEDITED_FEE">Expedited Fee</MenuItem>
                <MenuItem value="ATTORNEY_FEE">Attorney Fee</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={costForm.amount}
              onChange={(e) => setCostForm({ ...costForm, amount: e.target.value })}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: '$',
              }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={costForm.description}
              onChange={(e) => setCostForm({ ...costForm, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCostDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAddCost} 
              variant="contained"
              disabled={!costForm.amount || parseFloat(costForm.amount) <= 0}
            >
              Add Cost
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Update Status Dialog */}
      <Dialog open={updateStatusDialog} onClose={() => setUpdateStatusDialog(false)}>
        <DialogTitle>Update Application Status</DialogTitle>
        <DialogContent>
          <Typography>
            Move application to: {statusInfo.next && statusWorkflow[statusInfo.next].label}?
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
    </Box>
  )
}

// Main Applications Component with Routes
const Applications = () => {
  return (
    <Routes>
      <Route index element={<ApplicationList />} />
      <Route path="new" element={<ApplicationForm />} />
      <Route path="edit/:id" element={<ApplicationForm />} />
      <Route path=":id" element={<ApplicationDetails />} />
    </Routes>
  )
}

export default Applications
