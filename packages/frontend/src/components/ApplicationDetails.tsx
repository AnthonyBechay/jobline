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
  ListItemIcon,
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
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import {
  Application,
  ApplicationStatus,
  DocumentChecklistItem,
  DocumentStatus,
  Payment,
  Cost,
  CostType,
  UserRole,
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

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

const ApplicationDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [application, setApplication] = useState<Application | null>(null)
  const [documents, setDocuments] = useState<DocumentChecklistItem[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [costs, setCosts] = useState<Cost[]>([])
  const [feeTemplates, setFeeTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  
  // Dialog states
  const [updateStatusDialog, setUpdateStatusDialog] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [costDialog, setCostDialog] = useState(false)
  const [feeDialog, setFeeDialog] = useState(false)
  const [editClientDialog, setEditClientDialog] = useState(false)
  const [editCandidateDialog, setEditCandidateDialog] = useState(false)
  
  // Form controls for dialogs
  const paymentForm = useForm<any>()
  const costForm = useForm<any>()
  const feeForm = useForm<any>()

  useEffect(() => {
    if (id) {
      fetchApplicationDetails()
      fetchFeeTemplates()
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
      setDocuments(docsRes.data || [])
      setPayments(paymentsRes.data || [])
      
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
      setError(err.response?.data?.error || 'Failed to update status')
    }
  }

  const handleAddPayment = async (data: any) => {
    try {
      await api.post('/payments', {
        ...data,
        applicationId: id,
        clientId: application?.clientId,
      })
      setPaymentDialog(false)
      paymentForm.reset()
      await fetchApplicationDetails()
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
    } catch (err: any) {
      console.error('Failed to set fee:', err)
    }
  }

  const handleCopyShareableLink = () => {
    if (application?.shareableLink) {
      const fullUrl = `${window.location.origin}/status/${application.shareableLink}`
      navigator.clipboard.writeText(fullUrl)
      // Show success message (you can add a snackbar here)
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

  if (loading) return <Box>Loading...</Box>
  if (error) return <Alert severity="error">{error}</Alert>
  if (!application) return <Alert severity="info">Application not found</Alert>

  const statusInfo = statusWorkflow[application.status]
  const steps = getStatusSteps()
  const activeStep = steps.indexOf(application.status)

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0)
  const profit = totalRevenue - totalCosts

  // Separate documents by required from
  const officeDocuments = documents.filter(doc => doc.requiredFrom === 'office')
  const clientDocuments = documents.filter(doc => doc.requiredFrom === 'client')

  // Auto-select fee template based on nationality
  const candidateNationality = application.candidate?.nationality
  const matchingFeeTemplate = feeTemplates.find(
    template => template.nationality === candidateNationality
  )

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
        {/* Application Info Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Application Details</Typography>
                <IconButton size="small" onClick={() => navigate(`/applications/edit/${id}`)}>
                  <EditIcon />
                </IconButton>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemIcon><AssignmentIcon /></ListItemIcon>
                  <ListItemText
                    primary="Type"
                    secondary={application.type.replace(/_/g, ' ')}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon><BusinessIcon /></ListItemIcon>
                  <ListItemText
                    primary="Client"
                    secondary={
                      <Box display="flex" alignItems="center" gap={1}>
                        {application.client?.name}
                        <IconButton 
                          size="small" 
                          onClick={() => setEditClientDialog(true)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText
                    primary="Candidate"
                    secondary={
                      <Box display="flex" alignItems="center" gap={1}>
                        {`${application.candidate?.firstName} ${application.candidate?.lastName}`}
                        <IconButton 
                          size="small" 
                          onClick={() => setEditCandidateDialog(true)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  />
                </ListItem>
                {application.broker && (
                  <>
                    <Divider />
                    <ListItem>
                      <ListItemIcon><AccountBalanceIcon /></ListItemIcon>
                      <ListItemText
                        primary="Broker"
                        secondary={application.broker.name}
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Fee Configuration Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Fee Configuration</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFeeDialog(true)}
                >
                  Set Fee
                </Button>
              </Box>
              {application.finalFeeAmount ? (
                <Box>
                  <Typography variant="h4" color="primary">
                    ${application.finalFeeAmount}
                  </Typography>
                  {application.feeTemplate && (
                    <Typography variant="body2" color="textSecondary">
                      Template: {application.feeTemplate.name}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Alert severity="info">
                  No fee set yet
                  {matchingFeeTemplate && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Suggested template: {matchingFeeTemplate.name} (${matchingFeeTemplate.defaultPrice})
                    </Typography>
                  )}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Summary Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Financial Summary</Typography>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Revenue:</Typography>
                  <Typography color="success.main">${totalRevenue}</Typography>
                </Box>
                {user?.role === UserRole.SUPER_ADMIN && (
                  <>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Costs:</Typography>
                      <Typography color="error.main">${totalCosts}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="subtitle1">Profit:</Typography>
                      <Typography 
                        variant="h6" 
                        color={profit >= 0 ? 'success.main' : 'error.main'}
                      >
                        ${profit}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
              <Box display="flex" gap={1} mt={2}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<MoneyIcon />}
                  onClick={() => setPaymentDialog(true)}
                  fullWidth
                >
                  Add Payment
                </Button>
                {user?.role === UserRole.SUPER_ADMIN && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setCostDialog(true)}
                    fullWidth
                  >
                    Add Cost
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Documents and Financial Details Tabs */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Office Documents" />
              <Tab label="Client Documents" />
              <Tab label="Payments" />
              {user?.role === UserRole.SUPER_ADMIN && <Tab label="Costs" />}
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="subtitle1" gutterBottom>
                Documents Required from Office
              </Typography>
              {officeDocuments.length === 0 ? (
                <Typography color="textSecondary">No office documents required yet</Typography>
              ) : (
                <List>
                  {officeDocuments.map((doc) => (
                    <ListItem key={doc.id}>
                      <ListItemText
                        primary={doc.documentName}
                        secondary={`Stage: ${doc.stage.replace(/_/g, ' ')}`}
                      />
                      <ListItemSecondaryAction>
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
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="subtitle1" gutterBottom>
                Documents Required from Client
              </Typography>
              {clientDocuments.length === 0 ? (
                <Typography color="textSecondary">No client documents required yet</Typography>
              ) : (
                <List>
                  {clientDocuments.map((doc) => (
                    <ListItem key={doc.id}>
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
                    </ListItem>
                  ))}
                </List>
              )}
              <Alert severity="info" sx={{ mt: 2 }}>
                These documents will be shown to the client via the shareable link
              </Alert>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
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
              <TabPanel value={tabValue} index={3}>
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
          </Paper>
        </Grid>
      </Grid>

      {/* Dialogs */}
      
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
              <Grid item xs={12}>
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
                        {Object.values(CostType).map((type) => (
                          <MenuItem key={type} value={type}>
                            {type.replace(/_/g, ' ')}
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
    </Box>
  )
}

export default ApplicationDetails
