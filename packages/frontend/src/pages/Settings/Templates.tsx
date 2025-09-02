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
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  AttachMoney as MoneyIcon,
  Description as DocumentIcon,
  Business as OfficeIcon,
  Person as ClientIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as PendingIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { DocumentTemplate, FeeTemplate, ServiceType } from '../../shared/types'
import api from '../../services/api'

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
      id={`templates-tabpanel-${index}`}
      aria-labelledby={`templates-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

interface TemplatesProps {
  onBack: () => void
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

const applicationStages = [
  { value: 'PENDING_MOL', label: 'Pending MoL', color: '#FFA726', step: 1 },
  { value: 'MOL_AUTH_RECEIVED', label: 'MoL Auth Received', color: '#66BB6A', step: 2 },
  { value: 'VISA_PROCESSING', label: 'Visa Processing', color: '#42A5F5', step: 3 },
  { value: 'VISA_RECEIVED', label: 'Visa Received', color: '#AB47BC', step: 4 },
  { value: 'WORKER_ARRIVED', label: 'Worker Arrived', color: '#26C6DA', step: 5 },
  { value: 'LABOUR_PERMIT_PROCESSING', label: 'Labour Permit', color: '#FF7043', step: 6 },
  { value: 'RESIDENCY_PERMIT_PROCESSING', label: 'Residency Permit', color: '#8D6E63', step: 7 },
  { value: 'ACTIVE_EMPLOYMENT', label: 'Active Employment', color: '#4CAF50', step: 8 },
]

const Templates = ({ onBack, onError, onSuccess }: TemplatesProps) => {
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(false)

  // Fee Templates State
  const [feeTemplates, setFeeTemplates] = useState<FeeTemplate[]>([])
  const [feeTemplateDialog, setFeeTemplateDialog] = useState(false)
  const [editingFeeTemplate, setEditingFeeTemplate] = useState<FeeTemplate | null>(null)
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [nationalities, setNationalities] = useState<any[]>([])

  // Document Templates State
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([])
  const [documentTemplateDialog, setDocumentTemplateDialog] = useState(false)
  const [editingDocumentTemplate, setEditingDocumentTemplate] = useState<DocumentTemplate | null>(null)

  const { control: feeTemplateControl, handleSubmit: handleFeeTemplateSubmit, reset: resetFeeTemplate, setValue: setFeeTemplateValue } = useForm()
  const { control: documentTemplateControl, handleSubmit: handleDocumentTemplateSubmit, reset: resetDocumentTemplate, setValue: setDocumentTemplateValue } = useForm()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchFeeTemplates(),
        fetchDocumentTemplates(),
        fetchServiceTypes(),
        fetchNationalities()
      ])
    } catch (err) {
      onError('Failed to fetch templates data')
    } finally {
      setLoading(false)
    }
  }

  const fetchNationalities = async () => {
    try {
      const response = await api.get('/nationalities')
      setNationalities(response.data || [])
    } catch (err) {
      console.error('Failed to fetch nationalities:', err)
    }
  }

  const fetchServiceTypes = async () => {
    try {
      const response = await api.get<ServiceType[]>('/service-types')
      setServiceTypes(response.data || [])
    } catch (err) {
      console.error('Failed to fetch service types:', err)
    }
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
      const processedData = {
        ...data,
        defaultPrice: parseFloat(data.defaultPrice),
        minPrice: parseFloat(data.minPrice),
        maxPrice: parseFloat(data.maxPrice),
      }
      
      if (editingFeeTemplate) {
        await api.put(`/fee-templates/${editingFeeTemplate.id}`, processedData)
        onSuccess('Fee template updated successfully')
      } else {
        await api.post('/fee-templates', processedData)
        onSuccess('Fee template created successfully')
      }
      setFeeTemplateDialog(false)
      resetFeeTemplate()
      setEditingFeeTemplate(null)
      fetchFeeTemplates()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to save fee template')
    }
  }

  const handleDeleteFeeTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee template?')) return
    try {
      await api.delete(`/fee-templates/${id}`)
      onSuccess('Fee template deleted successfully')
      fetchFeeTemplates()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to delete fee template')
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
        onSuccess('Document template updated successfully')
      } else {
        await api.post('/document-templates', processedData)
        onSuccess('Document template created successfully')
      }
      setDocumentTemplateDialog(false)
      resetDocumentTemplate()
      setEditingDocumentTemplate(null)
      fetchDocumentTemplates()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to save document template')
    }
  }

  const handleDeleteDocumentTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document template?')) return
    try {
      await api.delete(`/document-templates/${id}`)
      onSuccess('Document template deleted successfully')
      fetchDocumentTemplates()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to delete document template')
    }
  }

  const openEditDocumentTemplate = (documentTemplate: DocumentTemplate) => {
    setEditingDocumentTemplate(documentTemplate)
    setDocumentTemplateValue('stage', documentTemplate.stage)
    setDocumentTemplateValue('name', documentTemplate.name)
    setDocumentTemplateValue('description', documentTemplate.description || '')
    setDocumentTemplateValue('required', documentTemplate.required)
    setDocumentTemplateValue('requiredFrom', documentTemplate.requiredFrom || 'office')
    setDocumentTemplateValue('order', documentTemplate.order)
    setDocumentTemplateDialog(true)
  }

  // Group documents by stage and requiredFrom
  const groupDocumentsByStageAndSource = () => {
    const grouped: Record<string, { office: DocumentTemplate[], client: DocumentTemplate[] }> = {}
    
    applicationStages.forEach(stage => {
      grouped[stage.value] = { office: [], client: [] }
    })

    documentTemplates.forEach(doc => {
      const source = (doc.requiredFrom || 'office') as 'office' | 'client'
      if (grouped[doc.stage]) {
        grouped[doc.stage][source].push(doc)
      }
    })

    // Sort documents within each group by order
    Object.keys(grouped).forEach(stage => {
      grouped[stage].office.sort((a, b) => a.order - b.order)
      grouped[stage].client.sort((a, b) => a.order - b.order)
    })

    return grouped
  }

  const groupedDocuments = groupDocumentsByStageAndSource()

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={onBack}
          color="inherit"
        >
          Back to Settings
        </Button>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
            },
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tab 
            label="Fee Templates" 
            icon={<MoneyIcon />} 
            iconPosition="start"
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.50',
                color: 'primary.main',
              }
            }}
          />
          <Tab 
            label="Document Templates" 
            icon={<DocumentIcon />} 
            iconPosition="start"
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'secondary.50',
                color: 'secondary.main',
              }
            }}
          />
        </Tabs>

        {/* Fee Templates Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 2 }}>
            <Box display="flex" justifyContent="flex-end" mb={3}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingFeeTemplate(null)
                resetFeeTemplate()
                setFeeTemplateDialog(true)
              }}
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
              }}
            >
              Add Fee Template
            </Button>
          </Box>

          <Grid container spacing={3}>
            {feeTemplates.map((template, index) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box flex={1}>
                        <Typography variant="h6" gutterBottom>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {template.description || 'No description'}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => openEditFeeTemplate(template)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteFeeTemplate(template.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      bgcolor: 'primary.50', 
                      borderRadius: 2, 
                      p: 2.5,
                      textAlign: 'center',
                      mb: 2.5,
                      border: '2px solid',
                      borderColor: 'primary.100',
                    }}>
                      <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 0.5 }}>
                        ${template.defaultPrice.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        DEFAULT PRICE
                      </Typography>
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Box sx={{ 
                          bgcolor: 'grey.50', 
                          p: 1.5, 
                          borderRadius: 1,
                          textAlign: 'center'
                        }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            MIN PRICE
                          </Typography>
                          <Typography variant="subtitle1" fontWeight="600">
                            ${template.minPrice.toLocaleString()}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ 
                          bgcolor: 'grey.50', 
                          p: 1.5, 
                          borderRadius: 1,
                          textAlign: 'center'
                        }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            MAX PRICE
                          </Typography>
                          <Typography variant="subtitle1" fontWeight="600">
                            ${template.maxPrice.toLocaleString()}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {(template.nationality || template.serviceType) && (
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {template.nationality && (
                          <Chip 
                            label={template.nationality} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {template.serviceType && (
                          <Chip 
                            label={template.serviceType} 
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          </Box>
        </TabPanel>

        {/* Document Templates Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 2 }}>
            <Box display="flex" justifyContent="flex-end" mb={3}>
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

          {/* Document Templates by Stage */}
          <Box sx={{ mb: 4 }}>
            <Stepper alternativeLabel sx={{ mb: 4 }}>
              {applicationStages.map((stage, index) => (
                <Step key={stage.value} completed={false}>
                  <StepLabel 
                    StepIconComponent={() => (
                      <Avatar 
                        sx={{ 
                          bgcolor: stage.color, 
                          width: 32, 
                          height: 32,
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {stage.step}
                      </Avatar>
                    )}
                  >
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      {stage.label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {applicationStages.map((stage) => {
              const stageDocuments = groupedDocuments[stage.value]
              const hasDocuments = stageDocuments.office.length > 0 || stageDocuments.client.length > 0

              if (!hasDocuments) return null

              return (
                <Card 
                  key={stage.value} 
                  sx={{ 
                    mb: 3,
                    border: '2px solid',
                    borderColor: stage.color + '40',
                    bgcolor: stage.color + '08',
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={3}>
                      <Avatar 
                        sx={{ 
                          bgcolor: stage.color, 
                          mr: 2,
                          width: 48,
                          height: 48,
                          fontWeight: 'bold',
                          fontSize: '1.25rem'
                        }}
                      >
                        {stage.step}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight="bold">
                          Step {stage.step}: {stage.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stageDocuments.office.length + stageDocuments.client.length} documents required
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={3}>
                      {/* Office Documents */}
                      <Grid item xs={12} md={6}>
                        <Paper 
                          sx={{ 
                            p: 2.5, 
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'primary.200',
                            borderRadius: 2,
                          }}
                        >
                          <Box display="flex" alignItems="center" mb={2}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 1.5 }}>
                              <OfficeIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                            <Typography variant="subtitle1" fontWeight="bold" flex={1}>
                              Office Documents
                            </Typography>
                            <Chip 
                              label={stageDocuments.office.length} 
                              size="small" 
                              color="primary"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                          <List dense>
                            {stageDocuments.office.map((doc) => (
                              <ListItem 
                                key={doc.id}
                                secondaryAction={
                                  <Box>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => openEditDocumentTemplate(doc)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleDeleteDocumentTemplate(doc.id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                }
                              >
                                <ListItemIcon>
                                  {doc.required ? (
                                    <CheckIcon color="error" fontSize="small" />
                                  ) : (
                                    <PendingIcon color="action" fontSize="small" />
                                  )}
                                </ListItemIcon>
                                <ListItemText 
                                  primary={doc.name}
                                  secondary={doc.required ? 'Required' : 'Optional'}
                                />
                              </ListItem>
                            ))}
                            {stageDocuments.office.length === 0 && (
                              <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                                No office documents
                              </Typography>
                            )}
                          </List>
                        </Paper>
                      </Grid>

                      {/* Client Documents */}
                      <Grid item xs={12} md={6}>
                        <Paper 
                          sx={{ 
                            p: 2.5, 
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'secondary.200',
                            borderRadius: 2,
                          }}
                        >
                          <Box display="flex" alignItems="center" mb={2}>
                            <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, mr: 1.5 }}>
                              <ClientIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                            <Typography variant="subtitle1" fontWeight="bold" flex={1}>
                              Client Documents
                            </Typography>
                            <Chip 
                              label={stageDocuments.client.length} 
                              size="small" 
                              color="secondary"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                          <List dense>
                            {stageDocuments.client.map((doc) => (
                              <ListItem 
                                key={doc.id}
                                secondaryAction={
                                  <Box>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => openEditDocumentTemplate(doc)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handleDeleteDocumentTemplate(doc.id)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                }
                              >
                                <ListItemIcon>
                                  {doc.required ? (
                                    <CheckIcon color="error" fontSize="small" />
                                  ) : (
                                    <PendingIcon color="action" fontSize="small" />
                                  )}
                                </ListItemIcon>
                                <ListItemText 
                                  primary={doc.name}
                                  secondary={doc.required ? 'Required' : 'Optional'}
                                />
                              </ListItem>
                            ))}
                            {stageDocuments.client.length === 0 && (
                              <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                                No client documents
                              </Typography>
                            )}
                          </List>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
          </Box>
        </TabPanel>
      </Paper>

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
                      select
                      label="Nationality (Optional)"
                      helperText="Specify if this template is for a specific nationality"
                    >
                      <MenuItem value="">All Nationalities</MenuItem>
                      {nationalities.map((nationality) => (
                        <MenuItem key={nationality.id} value={nationality.name}>
                          {nationality.name}
                        </MenuItem>
                      ))}
                    </TextField>
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
                    >
                      <MenuItem value="">Select a stage</MenuItem>
                      {applicationStages.map(stage => (
                        <MenuItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </MenuItem>
                      ))}
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
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={documentTemplateControl}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description / Instructions"
                      multiline
                      rows={2}
                      helperText="Provide details or instructions about this document"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="requiredFrom"
                  control={documentTemplateControl}
                  defaultValue="office"
                  rules={{ required: 'Required from is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Required From"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || 'Who needs to provide this document'}
                    >
                      <MenuItem value="office">Office</MenuItem>
                      <MenuItem value="client">Client</MenuItem>
                    </TextField>
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
              <Grid item xs={12}>
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

export default Templates
