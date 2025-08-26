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
  CostType,
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

      const response = await api.get<PaginatedResponse<Application>>(`/applications?${params}`)
      setApplications(response.data.data)
      setTotalRows(response.data.pagination.total)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (shareableLink: string) => {
    const fullUrl = `${window.location.origin}/status/${shareableLink}`
    navigator.clipboard.writeText(fullUrl)
    // You might want to show a snackbar here
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
          rows={applications}
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
  const { control, handleSubmit, watch, formState: { errors } } = useForm<any>()

  const selectedType = watch('type')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [clientsRes, candidatesRes] = await Promise.all([
        api.get<PaginatedResponse<Client>>('/clients?limit=100'),
        api.get<PaginatedResponse<Candidate>>('/candidates?limit=100&status=' + CandidateStatus.AVAILABLE_ABROAD),
      ])
      setClients(clientsRes.data.data)
      setCandidates(candidatesRes.data.data)
      
      if (user?.role === UserRole.SUPER_ADMIN) {
        const brokersRes = await api.get<Broker[]>('/brokers')
        setBrokers(brokersRes.data)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    }
  }

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)
      const response = await api.post('/applications', data)
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
                    helperText={errors.type?.message}
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
                    helperText={errors.clientId?.message}
                  >
                    <MenuItem value="">Select a client</MenuItem>
                    {clients.map((client) => (
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
                    helperText={errors.candidateId?.message}
                  >
                    <MenuItem value="">Select a candidate</MenuItem>
                    {candidates.map((candidate) => (
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
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Broker (Optional)"
                    >
                      <MenuItem value="">None</MenuItem>
                      {brokers.map((broker) => (
                        <MenuItem key={broker.id} value={broker.id}>
                          {broker.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
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

// Application Details Component
const ApplicationDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [application, setApplication] = useState<Application | null>(null)
  const [documents, setDocuments] = useState<DocumentChecklistItem[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [costs, setCosts] = useState<Cost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updateStatusDialog, setUpdateStatusDialog] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [costDialog, setCostDialog] = useState(false)

  useEffect(() => {
    if (id) {
      fetchApplicationDetails()
    }
  }, [id])

  const fetchApplicationDetails = async () => {
    try {
      const [appRes, docsRes, paymentsRes] = await Promise.all([
        api.get<Application>(`/applications/${id}`),
        api.get<DocumentChecklistItem[]>(`/applications/${id}/documents`),
        api.get<Payment[]>(`/applications/${id}/payments`),
      ])
      
      setApplication(appRes.data)
      setDocuments(docsRes.data)
      setPayments(paymentsRes.data)
      
      if (user?.role === UserRole.SUPER_ADMIN) {
        const costsRes = await api.get<Cost[]>(`/applications/${id}/costs`)
        setCosts(costsRes.data)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch application details')
    } finally {
      setLoading(false)
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
    } catch (err) {
      console.error('Failed to update application status:', err)
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
          <Button
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={() => {
              const fullUrl = `${window.location.origin}/status/${application.shareableLink}`
              navigator.clipboard.writeText(fullUrl)
            }}
          >
            Copy Client Link
          </Button>
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
        {/* Application Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Application Details</Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Type"
                    secondary={application.type.replace(/_/g, ' ')}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Client"
                    secondary={application.client?.name}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Candidate"
                    secondary={`${application.candidate?.firstName} ${application.candidate?.lastName}`}
                  />
                </ListItem>
                {application.broker && (
                  <>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Broker"
                        secondary={application.broker.name}
                      />
                    </ListItem>
                  </>
                )}
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Created"
                    secondary={new Date(application.createdAt).toLocaleDateString()}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Document Checklist */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Document Checklist</Typography>
              {documents.length === 0 ? (
                <Typography color="textSecondary">No documents required yet</Typography>
              ) : (
                <List dense>
                  {documents.map((doc) => (
                    <ListItem key={doc.id}>
                      <ListItemText
                        primary={doc.documentName}
                        secondary={`Stage: ${doc.stage.replace(/_/g, ' ')}`}
                      />
                      <ListItemSecondaryAction>
                        <FormControl size="small">
                          <Select
                            value={doc.status}
                            onChange={(e) => handleUpdateDocumentStatus(doc.id, e.target.value as DocumentStatus)}
                          >
                            <MenuItem value={DocumentStatus.PENDING}>Pending</MenuItem>
                            <MenuItem value={DocumentStatus.RECEIVED}>Received</MenuItem>
                            <MenuItem value={DocumentStatus.SUBMITTED}>Submitted</MenuItem>
                          </Select>
                        </FormControl>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Financial Summary</Typography>
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
                <Grid item xs={12} md={user?.role === UserRole.SUPER_ADMIN ? 6 : 12}>
                  <Typography variant="subtitle1" gutterBottom>Payments (Revenue)</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Notes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                            <TableCell>${payment.amount}</TableCell>
                            <TableCell>{payment.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell><strong>Total</strong></TableCell>
                          <TableCell><strong>${totalRevenue}</strong></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {user?.role === UserRole.SUPER_ADMIN && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Costs</Typography>
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
                              <TableCell>{cost.costType.replace(/_/g, ' ')}</TableCell>
                              <TableCell>${cost.amount}</TableCell>
                              <TableCell>{cost.description || '-'}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={2}><strong>Total</strong></TableCell>
                            <TableCell><strong>${totalCosts}</strong></TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box mt={2}>
                      <Typography variant="h6" color={profit >= 0 ? 'success.main' : 'error.main'}>
                        Net Profit: ${profit}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
