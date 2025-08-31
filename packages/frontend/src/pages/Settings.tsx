import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Description as DocumentIcon,
  Business as ServiceIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { CostTypeModel, ServiceType, DocumentTemplate, FeeTemplate, UserRole } from '../shared/types'
import api from '../services/api'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const Settings = () => {
  const { user } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Cost Types State
  const [costTypes, setCostTypes] = useState<CostTypeModel[]>([])
  const [costTypeDialog, setCostTypeDialog] = useState(false)
  const [editingCostType, setEditingCostType] = useState<CostTypeModel | null>(null)

  // Service Types State
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [serviceTypeDialog, setServiceTypeDialog] = useState(false)
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null)

  // Fee Templates State
  const [feeTemplates, setFeeTemplates] = useState<FeeTemplate[]>([])
  const [feeTemplateDialog, setFeeTemplateDialog] = useState(false)
  const [editingFeeTemplate, setEditingFeeTemplate] = useState<FeeTemplate | null>(null)

  // Document Templates State
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([])
  const [documentTemplateDialog, setDocumentTemplateDialog] = useState(false)
  const [editingDocumentTemplate, setEditingDocumentTemplate] = useState<DocumentTemplate | null>(null)

  const { control: costTypeControl, handleSubmit: handleCostTypeSubmit, reset: resetCostType, setValue: setCostTypeValue } = useForm()
  const { control: serviceTypeControl, handleSubmit: handleServiceTypeSubmit, reset: resetServiceType, setValue: setServiceTypeValue } = useForm()
  const { control: feeTemplateControl, handleSubmit: handleFeeTemplateSubmit, reset: resetFeeTemplate, setValue: setFeeTemplateValue } = useForm()
  const { control: documentTemplateControl, handleSubmit: handleDocumentTemplateSubmit, reset: resetDocumentTemplate, setValue: setDocumentTemplateValue } = useForm()

  useEffect(() => {
    if (user?.role === UserRole.SUPER_ADMIN) {
      fetchAllData()
    }
  }, [user])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchCostTypes(),
        fetchServiceTypes(),
        fetchFeeTemplates(),
        fetchDocumentTemplates(),
      ])
    } finally {
      setLoading(false)
    }
  }

  // Cost Types CRUD
  const fetchCostTypes = async () => {
    try {
      const response = await api.get<CostTypeModel[]>('/cost-types')
      setCostTypes(response.data || [])
    } catch (err) {
      console.error('Failed to fetch cost types:', err)
    }
  }

  const handleSaveCostType = async (data: any) => {
    try {
      if (editingCostType) {
        await api.put(`/cost-types/${editingCostType.id}`, data)
        setSuccess('Cost type updated successfully')
      } else {
        await api.post('/cost-types', data)
        setSuccess('Cost type created successfully')
      }
      setCostTypeDialog(false)
      resetCostType()
      setEditingCostType(null)
      fetchCostTypes()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save cost type')
    }
  }

  const handleDeleteCostType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cost type?')) return
    try {
      await api.delete(`/cost-types/${id}`)
      setSuccess('Cost type deleted successfully')
      fetchCostTypes()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete cost type')
    }
  }

  const openEditCostType = (costType: CostTypeModel) => {
    setEditingCostType(costType)
    setCostTypeValue('name', costType.name)
    setCostTypeValue('description', costType.description)
    setCostTypeValue('active', costType.active)
    setCostTypeDialog(true)
  }

  // Service Types CRUD
  const fetchServiceTypes = async () => {
    try {
      const response = await api.get<ServiceType[]>('/service-types')
      setServiceTypes(response.data || [])
    } catch (err) {
      console.error('Failed to fetch service types:', err)
    }
  }

  const handleSaveServiceType = async (data: any) => {
    try {
      if (editingServiceType) {
        await api.put(`/service-types/${editingServiceType.id}`, data)
        setSuccess('Service type updated successfully')
      } else {
        await api.post('/service-types', data)
        setSuccess('Service type created successfully')
      }
      setServiceTypeDialog(false)
      resetServiceType()
      setEditingServiceType(null)
      fetchServiceTypes()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save service type')
    }
  }

  const handleDeleteServiceType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service type?')) return
    try {
      await api.delete(`/service-types/${id}`)
      setSuccess('Service type deleted successfully')
      fetchServiceTypes()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete service type')
    }
  }

  const openEditServiceType = (serviceType: ServiceType) => {
    setEditingServiceType(serviceType)
    setServiceTypeValue('name', serviceType.name)
    setServiceTypeValue('description', serviceType.description)
    setServiceTypeValue('active', serviceType.active)
    setServiceTypeDialog(true)
  }

  // Fee Templates CRUD
  const fetchFeeTemplates = async () => {
    try {
      const response = await api.get<FeeTemplate[]>('/fee-templates')
      setFeeTemplates(response.data || [])
    } catch (err) {
      console.error('Failed to fetch fee templates:', err)
    }
  }

  const handleSaveFeeTemplate = async (data: any) => {
    try {
      // Convert string values to numbers
      const processedData = {
        ...data,
        defaultPrice: parseFloat(data.defaultPrice),
        minPrice: parseFloat(data.minPrice),
        maxPrice: parseFloat(data.maxPrice),
      }
      
      if (editingFeeTemplate) {
        await api.put(`/fee-templates/${editingFeeTemplate.id}`, processedData)
        setSuccess('Fee template updated successfully')
      } else {
        await api.post('/fee-templates', processedData)
        setSuccess('Fee template created successfully')
      }
      setFeeTemplateDialog(false)
      resetFeeTemplate()
      setEditingFeeTemplate(null)
      fetchFeeTemplates()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save fee template')
    }
  }

  const handleDeleteFeeTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee template?')) return
    try {
      await api.delete(`/fee-templates/${id}`)
      setSuccess('Fee template deleted successfully')
      fetchFeeTemplates()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete fee template')
    }
  }

  const openEditFeeTemplate = (feeTemplate: FeeTemplate) => {
    setEditingFeeTemplate(feeTemplate)
    setFeeTemplateValue('name', feeTemplate.name)
    setFeeTemplateValue('description', feeTemplate.description)
    setFeeTemplateValue('defaultPrice', feeTemplate.defaultPrice)
    setFeeTemplateValue('minPrice', feeTemplate.minPrice)
    setFeeTemplateValue('maxPrice', feeTemplate.maxPrice)
    setFeeTemplateValue('nationality', feeTemplate.nationality)
    setFeeTemplateValue('serviceType', feeTemplate.serviceType)
    setFeeTemplateDialog(true)
  }

  // Document Templates CRUD
  const fetchDocumentTemplates = async () => {
    try {
      const response = await api.get<DocumentTemplate[]>('/document-templates')
      setDocumentTemplates(response.data || [])
    } catch (err) {
      console.error('Failed to fetch document templates:', err)
    }
  }

  const handleSaveDocumentTemplate = async (data: any) => {
    try {
      const processedData = {
        ...data,
        order: parseInt(data.order) || 0,
      }
      
      if (editingDocumentTemplate) {
        await api.put(`/document-templates/${editingDocumentTemplate.id}`, processedData)
        setSuccess('Document template updated successfully')
      } else {
        await api.post('/document-templates', processedData)
        setSuccess('Document template created successfully')
      }
      setDocumentTemplateDialog(false)
      resetDocumentTemplate()
      setEditingDocumentTemplate(null)
      fetchDocumentTemplates()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save document template')
    }
  }

  const handleDeleteDocumentTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document template?')) return
    try {
      await api.delete(`/document-templates/${id}`)
      setSuccess('Document template deleted successfully')
      fetchDocumentTemplates()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete document template')
    }
  }

  const openEditDocumentTemplate = (documentTemplate: DocumentTemplate) => {
    setEditingDocumentTemplate(documentTemplate)
    setDocumentTemplateValue('stage', documentTemplate.stage)
    setDocumentTemplateValue('name', documentTemplate.name)
    setDocumentTemplateValue('required', documentTemplate.required)
    setDocumentTemplateValue('order', documentTemplate.order)
    setDocumentTemplateDialog(true)
  }

  // Check permissions
  if (user?.role !== UserRole.SUPER_ADMIN) {
    return (
      <Box>
        <Alert severity="error">
          You don't have permission to access this page. Only Super Admins can manage settings.
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        System Settings
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Cost Types" icon={<CategoryIcon />} iconPosition="start" />
          <Tab label="Service Types" icon={<ServiceIcon />} iconPosition="start" />
          <Tab label="Fee Templates" icon={<MoneyIcon />} iconPosition="start" />
          <Tab label="Document Templates" icon={<DocumentIcon />} iconPosition="start" />
        </Tabs>

        {/* Cost Types Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Manage Cost Types</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingCostType(null)
                resetCostType()
                setCostTypeDialog(true)
              }}
            >
              Add Cost Type
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {costTypes.map((costType) => (
                  <TableRow key={costType.id}>
                    <TableCell>{costType.name}</TableCell>
                    <TableCell>{costType.description || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={costType.active ? 'Active' : 'Inactive'}
                        color={costType.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => openEditCostType(costType)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteCostType(costType.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Service Types Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Manage Service Types</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingServiceType(null)
                resetServiceType()
                setServiceTypeDialog(true)
              }}
            >
              Add Service Type
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceTypes.map((serviceType) => (
                  <TableRow key={serviceType.id}>
                    <TableCell>{serviceType.name}</TableCell>
                    <TableCell>{serviceType.description || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={serviceType.active ? 'Active' : 'Inactive'}
                        color={serviceType.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => openEditServiceType(serviceType)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteServiceType(serviceType.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Fee Templates Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Manage Fee Templates</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingFeeTemplate(null)
                resetFeeTemplate()
                setFeeTemplateDialog(true)
              }}
            >
              Add Fee Template
            </Button>
          </Box>

          <Grid container spacing={3}>
            {feeTemplates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{template.name}</Typography>
                      <Box>
                        <IconButton size="small" onClick={() => openEditFeeTemplate(template)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteFeeTemplate(template.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {template.description || 'No description'}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2">
                      <strong>Default Price:</strong> ${template.defaultPrice}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Range:</strong> ${template.minPrice} - ${template.maxPrice}
                    </Typography>
                    {template.nationality && (
                      <Typography variant="body2">
                        <strong>Nationality:</strong> {template.nationality}
                      </Typography>
                    )}
                    {template.serviceType && (
                      <Typography variant="body2">
                        <strong>Service Type:</strong> {template.serviceType}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Document Templates Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Manage Document Templates</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingDocumentTemplate(null)
                resetDocumentTemplate()
                setDocumentTemplateDialog(true)
              }}
            >
              Add Document Template
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Stage</TableCell>
                  <TableCell>Document Name</TableCell>
                  <TableCell>Required</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documentTemplates.sort((a, b) => a.order - b.order).map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Chip
                        label={template.stage.replace(/_/g, ' ')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={template.required ? 'Required' : 'Optional'}
                        color={template.required ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{template.order}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => openEditDocumentTemplate(template)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteDocumentTemplate(template.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Cost Type Dialog */}
      <Dialog open={costTypeDialog} onClose={() => setCostTypeDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCostTypeSubmit(handleSaveCostType)}>
          <DialogTitle>{editingCostType ? 'Edit Cost Type' : 'Add Cost Type'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={costTypeControl}
                  defaultValue=""
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={costTypeControl}
                  defaultValue=""
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
              <Grid item xs={12}>
                <Controller
                  name="active"
                  control={costTypeControl}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Active"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCostTypeDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Service Type Dialog */}
      <Dialog open={serviceTypeDialog} onClose={() => setServiceTypeDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleServiceTypeSubmit(handleSaveServiceType)}>
          <DialogTitle>{editingServiceType ? 'Edit Service Type' : 'Add Service Type'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={serviceTypeControl}
                  defaultValue=""
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={serviceTypeControl}
                  defaultValue=""
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
              <Grid item xs={12}>
                <Controller
                  name="active"
                  control={serviceTypeControl}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Active"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setServiceTypeDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Fee Template Dialog */}
      <Dialog open={feeTemplateDialog} onClose={() => setFeeTemplateDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleFeeTemplateSubmit(handleSaveFeeTemplate)}>
          <DialogTitle>{editingFeeTemplate ? 'Edit Fee Template' : 'Add Fee Template'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={feeTemplateControl}
                  defaultValue=""
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={feeTemplateControl}
                  defaultValue=""
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
              <Grid item xs={12} md={4}>
                <Controller
                  name="defaultPrice"
                  control={feeTemplateControl}
                  defaultValue=""
                  rules={{ required: 'Default price is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Default Price"
                      type="number"
                      InputProps={{ startAdornment: '$' }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="minPrice"
                  control={feeTemplateControl}
                  defaultValue=""
                  rules={{ required: 'Min price is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Min Price"
                      type="number"
                      InputProps={{ startAdornment: '$' }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="maxPrice"
                  control={feeTemplateControl}
                  defaultValue=""
                  rules={{ required: 'Max price is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Max Price"
                      type="number"
                      InputProps={{ startAdornment: '$' }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="nationality"
                  control={feeTemplateControl}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nationality (Optional)"
                      helperText="Specify if this template is for a specific nationality"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="serviceType"
                  control={feeTemplateControl}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Service Type (Optional)"
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value="">None</option>
                      {serviceTypes.filter(st => st.active).map((service) => (
                        <option key={service.id} value={service.name}>
                          {service.name}
                        </option>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeeTemplateDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Document Template Dialog */}
      <Dialog open={documentTemplateDialog} onClose={() => setDocumentTemplateDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleDocumentTemplateSubmit(handleSaveDocumentTemplate)}>
          <DialogTitle>{editingDocumentTemplate ? 'Edit Document Template' : 'Add Document Template'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="stage"
                  control={documentTemplateControl}
                  defaultValue=""
                  rules={{ required: 'Stage is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Application Stage"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value="">Select a stage</option>
                      <option value="PENDING_MOL">Pending MoL</option>
                      <option value="MOL_AUTH_RECEIVED">MoL Auth Received</option>
                      <option value="VISA_PROCESSING">Visa Processing</option>
                      <option value="VISA_RECEIVED">Visa Received</option>
                      <option value="WORKER_ARRIVED">Worker Arrived</option>
                      <option value="LABOUR_PERMIT_PROCESSING">Labour Permit Processing</option>
                      <option value="RESIDENCY_PERMIT_PROCESSING">Residency Permit Processing</option>
                      <option value="ACTIVE_EMPLOYMENT">Active Employment</option>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={documentTemplateControl}
                  defaultValue=""
                  rules={{ required: 'Document name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Document Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="order"
                  control={documentTemplateControl}
                  defaultValue={0}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Display Order"
                      type="number"
                      helperText="Lower numbers appear first"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="required"
                  control={documentTemplateControl}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Required Document"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDocumentTemplateDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}

export default Settings
