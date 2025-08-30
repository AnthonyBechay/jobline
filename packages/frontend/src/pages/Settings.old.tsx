import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Chip,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Avatar,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  AttachMoney as MoneyIcon,
  Description as DocumentIcon,
  Language as LanguageIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Business as BusinessIcon,
  PhotoCamera as PhotoIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { ApplicationStatus, UserRole } from '../shared/types'
import api from '../services/api'

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

// Application status stages for document templates
const applicationStages = [
  { value: 'PENDING_MOL', label: 'MoL Pre-Authorization' },
  { value: 'MOL_AUTH_RECEIVED', label: 'MoL Authorization Received' },
  { value: 'VISA_PROCESSING', label: 'Visa Processing' },
  { value: 'VISA_RECEIVED', label: 'Visa Received' },
  { value: 'WORKER_ARRIVED', label: 'Worker Arrived' },
  { value: 'LABOUR_PERMIT_PROCESSING', label: 'Labour Permit Processing' },
  { value: 'RESIDENCY_PERMIT_PROCESSING', label: 'Residency Permit Processing' },
  { value: 'ACTIVE_EMPLOYMENT', label: 'Active Employment' },
  { value: 'RENEWAL_PENDING', label: 'Renewal Pending' },
]

const Settings = () => {
  const { user } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  const [feeTemplates, setFeeTemplates] = useState<any[]>([])
  const [documentTemplates, setDocumentTemplates] = useState<any[]>([])
  const [nationalities, setNationalities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [feeDialog, setFeeDialog] = useState(false)
  const [documentDialog, setDocumentDialog] = useState(false)
  const [editingFee, setEditingFee] = useState<any>(null)
  const [editingDocument, setEditingDocument] = useState<any>(null)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ open: boolean; type: string; id: string | null }>({
    open: false,
    type: '',
    id: null,
  })
  const [companySettings, setCompanySettings] = useState<any>({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo: '',
    registrationNumber: '',
    taxNumber: '',
    website: '',
    bankName: '',
    bankAccount: '',
    bankIBAN: '',
  })
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const feeForm = useForm<any>()
  const documentForm = useForm<any>()

  useEffect(() => {
    fetchData()
    if (user?.role === UserRole.SUPER_ADMIN) {
      fetchCompanySettings()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch fee templates (Super Admin only)
      if (user?.role === UserRole.SUPER_ADMIN) {
        try {
          const feeRes = await api.get('/fee-templates')
          setFeeTemplates(feeRes.data || [])
        } catch (err) {
          console.error('Failed to fetch fee templates:', err)
        }
      }

      // Fetch document templates
      try {
        const docRes = await api.get('/document-templates')
        setDocumentTemplates(docRes.data || [])
      } catch (err) {
        console.error('Failed to fetch document templates:', err)
      }

      // Fetch nationalities
      setNationalities([
        'Ethiopian', 'Filipino', 'Sri Lankan', 'Bangladeshi', 'Kenyan',
        'Nigerian', 'Ugandan', 'Ghanaian', 'Nepalese', 'Indian',
        'Syrian', 'Egyptian', 'Moroccan', 'Tunisian', 'Indonesian'
      ])
    } catch (err: any) {
      setError('Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanySettings = async () => {
    try {
      const response = await api.get('/settings/company')
      if (response.data) {
        setCompanySettings(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch company settings:', err)
    }
  }

  const handleSaveCompanySettings = async () => {
    try {
      await api.post('/settings/company', companySettings)
      setSuccess('Company settings saved successfully')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save company settings')
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Logo size should be less than 5MB')
      return
    }

    try {
      setUploadingLogo(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', 'company')
      formData.append('entityId', 'logo')

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setCompanySettings((prev: any) => ({
        ...prev,
        logo: response.data.url
      }))
      setSuccess('Logo uploaded successfully')
    } catch (err: any) {
      setError('Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSaveFeeTemplate = async (data: any) => {
    try {
      if (editingFee) {
        await api.put(`/fee-templates/${editingFee.id}`, data)
        setSuccess('Fee template updated successfully')
      } else {
        await api.post('/fee-templates', data)
        setSuccess('Fee template created successfully')
      }
      setFeeDialog(false)
      setEditingFee(null)
      feeForm.reset()
      await fetchData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save fee template')
    }
  }

  const handleDeleteFeeTemplate = async () => {
    if (!deleteConfirmDialog.id) return
    
    try {
      await api.delete(`/fee-templates/${deleteConfirmDialog.id}`)
      setSuccess('Fee template deleted successfully')
      setDeleteConfirmDialog({ open: false, type: '', id: null })
      await fetchData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete fee template')
    }
  }

  const handleEditFeeTemplate = (template: any) => {
    setEditingFee(template)
    feeForm.reset({
      name: template.name,
      defaultPrice: template.defaultPrice,
      minPrice: template.minPrice,
      maxPrice: template.maxPrice,
      currency: template.currency || 'USD',
      nationality: template.nationality || '',
      description: template.description || '',
    })
    setFeeDialog(true)
  }

  const handleSaveDocumentTemplate = async (data: any) => {
    try {
      // Ensure required fields are properly set
      const templateData = {
        ...data,
        required: data.required === true || data.required === 'true',
        order: parseInt(data.order) || 0,
      }

      if (editingDocument) {
        await api.put(`/document-templates/${editingDocument.id}`, templateData)
        setSuccess('Document template updated successfully')
      } else {
        await api.post('/document-templates', templateData)
        setSuccess('Document template created successfully')
      }
      setDocumentDialog(false)
      setEditingDocument(null)
      documentForm.reset()
      await fetchData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save document template')
    }
  }

  const handleDeleteDocumentTemplate = async () => {
    if (!deleteConfirmDialog.id) return
    
    try {
      await api.delete(`/document-templates/${deleteConfirmDialog.id}`)
      setSuccess('Document template deleted successfully')
      setDeleteConfirmDialog({ open: false, type: '', id: null })
      await fetchData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete document template')
    }
  }

  const handleEditDocumentTemplate = (doc: any) => {
    setEditingDocument(doc)
    documentForm.reset({
      name: doc.name,
      stage: doc.stage,
      requiredFrom: doc.requiredFrom || 'office',
      required: doc.required,
      order: doc.order || 0,
    })
    setDocumentDialog(true)
  }

  // Group documents by stage for better visualization
  const documentsByStage = documentTemplates.reduce((acc: Record<string, any[]>, doc: any) => {
    if (!acc[doc.stage]) acc[doc.stage] = []
    acc[doc.stage].push(doc)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your system configuration and templates
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ 
        borderRadius: 3, 
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            background: 'linear-gradient(90deg, #1e3a5f 0%, #4a6fa5 100%)',
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.7)',
              '&.Mui-selected': {
                color: '#ffffff',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#ffffff',
              height: 3,
            },
          }}
        >
          {user?.role === UserRole.SUPER_ADMIN && (
            <Tab icon={<SettingsIcon />} label="Office Management" iconPosition="start" />
          )}
          {user?.role === UserRole.SUPER_ADMIN && (
            <Tab icon={<BusinessIcon />} label="Company Settings" iconPosition="start" />
          )}
          <Tab icon={<LanguageIcon />} label="Nationalities" iconPosition="start" />
          <Tab icon={<NotificationIcon />} label="Notifications" iconPosition="start" />
        </Tabs>

        {/* Office Management Tab - Super Admin Only */}
        {user?.role === UserRole.SUPER_ADMIN && (
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
              Office Management
            </Typography>
            
            {/* Fee Templates Section */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                Fee Templates
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingFee(null)
                  feeForm.reset()
                  setFeeDialog(true)
                }}
              >
                Add Fee Template
              </Button>
            </Box>

            <Grid container spacing={3}>
              {feeTemplates.map((template: any) => (
                <Grid item xs={12} md={6} lg={4} key={template.id}>
                  <Card sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    }
                  }}>
                    <CardHeader
                      title={template.name}
                      subheader={
                        <Box display="flex" alignItems="center" gap={1}>
                          {template.nationality && (
                            <Chip
                              icon={<LanguageIcon />}
                              label={template.nationality}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          <Chip
                            label={template.currency}
                            size="small"
                            color="secondary"
                          />
                        </Box>
                      }
                      action={
                        <Box>
                          <IconButton onClick={() => handleEditFeeTemplate(template)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => setDeleteConfirmDialog({ 
                              open: true, 
                              type: 'fee', 
                              id: template.id 
                            })}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                    />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="h4" color="primary" gutterBottom>
                            ${template.defaultPrice}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Default Price
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Min: ${template.minPrice}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Max: ${template.maxPrice}
                          </Typography>
                        </Grid>
                        {template.description && (
                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2">
                              {template.description}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {feeTemplates.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                <MoneyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  No fee templates created yet. Click "Add Fee Template" to get started.
                </Typography>
              </Paper>
            )}
          </TabPanel>
        )}

            {/* Document Templates Section */}
            <Divider sx={{ my: 4 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              <DocumentIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
              Document Templates
            </Typography>
            {user?.role === UserRole.SUPER_ADMIN && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingDocument(null)
                  documentForm.reset({
                    name: '',
                    stage: 'PENDING_MOL',
                    requiredFrom: 'office',
                    required: true,
                    order: 0,
                  })
                  setDocumentDialog(true)
                }}
              >
                Add Document Template
              </Button>
            )}
          </Box>

          {applicationStages.map((stage: any) => {
            const stageDocs = documentsByStage[stage.value] || []
            if (stageDocs.length === 0 && user?.role !== UserRole.SUPER_ADMIN) return null

            return (
              <Box key={stage.value} mb={3}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {stage.label}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Document Name</TableCell>
                        <TableCell align="center">Required From</TableCell>
                        <TableCell align="center">Required</TableCell>
                        <TableCell align="center">Order</TableCell>
                        {user?.role === UserRole.SUPER_ADMIN && <TableCell align="center">Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stageDocs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={user?.role === UserRole.SUPER_ADMIN ? 5 : 4} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No documents configured for this stage
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        stageDocs
                          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                          .map((doc: any) => (
                            <TableRow key={doc.id}>
                              <TableCell>{doc.name}</TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={doc.requiredFrom === 'client' ? 'Client' : 'Office'} 
                                  size="small"
                                  color={doc.requiredFrom === 'client' ? 'warning' : 'info'}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={doc.required ? 'Required' : 'Optional'} 
                                  size="small"
                                  color={doc.required ? 'success' : 'default'}
                                  variant={doc.required ? 'filled' : 'outlined'}
                                />
                              </TableCell>
                              <TableCell align="center">{doc.order}</TableCell>
                              {user?.role === UserRole.SUPER_ADMIN && (
                                <TableCell align="center">
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleEditDocumentTemplate(doc)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    size="small"
                                    color="error"
                                    onClick={() => setDeleteConfirmDialog({ 
                                      open: true, 
                                      type: 'document', 
                                      id: doc.id 
                                    })}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )
          })}
        </TabPanel>

          </TabPanel>
        )}

        {/* Company Settings Tab - Super Admin Only */}
        {user?.role === UserRole.SUPER_ADMIN && (
          <TabPanel value={tabValue} index={1}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                Company Settings
              </Typography>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveCompanySettings}
              >
                Save Settings
              </Button>
            </Box>

            <Grid container spacing={3}>
              {/* Company Logo */}
              <Grid item xs={12} md={3}>
                <Box textAlign="center">
                  <Avatar
                    src={companySettings.logo}
                    sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
                  >
                    <BusinessIcon sx={{ fontSize: 60 }} />
                  </Avatar>
                  <input
                    type="file"
                    id="logo-upload"
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  <label htmlFor="logo-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={uploadingLogo ? null : <PhotoIcon />}
                      disabled={uploadingLogo}
                      fullWidth
                    >
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                  </label>
                </Box>
              </Grid>

              {/* Company Details */}
              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Company Name"
                      value={companySettings.name}
                      onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Website"
                      value={companySettings.website}
                      onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={2}
                      value={companySettings.address}
                      onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                    />
                  </Grid>

                  {/* Legal Information */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Legal Information
                      </Typography>
                    </Divider>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Registration Number"
                      value={companySettings.registrationNumber}
                      onChange={(e) => setCompanySettings({ ...companySettings, registrationNumber: e.target.value })}
                      helperText="Official business registration number"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tax Number"
                      value={companySettings.taxNumber}
                      onChange={(e) => setCompanySettings({ ...companySettings, taxNumber: e.target.value })}
                      helperText="VAT or Tax identification number"
                    />
                  </Grid>

                  {/* Banking Information */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Banking Information
                      </Typography>
                    </Divider>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Bank Name"
                      value={companySettings.bankName}
                      onChange={(e) => setCompanySettings({ ...companySettings, bankName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Account Number"
                      value={companySettings.bankAccount}
                      onChange={(e) => setCompanySettings({ ...companySettings, bankAccount: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="IBAN"
                      value={companySettings.bankIBAN}
                      onChange={(e) => setCompanySettings({ ...companySettings, bankIBAN: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>
        )}

        {/* Nationalities Tab */}
        <TabPanel value={tabValue} index={user?.role === UserRole.SUPER_ADMIN ? 2 : 0}>
          <Typography variant="h6" gutterBottom>
            <LanguageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Manage Nationalities
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                const newNationality = prompt('Enter new nationality:')
                if (newNationality) {
                  setNationalities([...nationalities, newNationality])
                  setSuccess('Nationality added successfully')
                }
              }}
            >
              Add Nationality
            </Button>
          </Box>
          <Grid container spacing={2}>
            {nationalities.map((nationality, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>{nationality}</Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      if (confirm(`Remove ${nationality}?`)) {
                        setNationalities(nationalities.filter((_, i) => i !== index))
                        setSuccess('Nationality removed')
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={user?.role === UserRole.SUPER_ADMIN ? 3 : 1}>
          <Typography variant="h6" gutterBottom>
            <NotificationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Notification Settings
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Email Notifications"
                secondary="Receive email notifications for important events"
              />
              <ListItemSecondaryAction>
                <Switch defaultChecked />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Renewal Reminders"
                secondary="Get notified 60 days before permit expiry"
              />
              <ListItemSecondaryAction>
                <Switch defaultChecked />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Payment Reminders"
                secondary="Notify about pending payments"
              />
              <ListItemSecondaryAction>
                <Switch defaultChecked />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Document Reminders"
                secondary="Alert when documents are required from clients"
              />
              <ListItemSecondaryAction>
                <Switch defaultChecked />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </TabPanel>
      </Paper>

      {/* Fee Template Dialog */}
      {user?.role === UserRole.SUPER_ADMIN && (
        <Dialog open={feeDialog} onClose={() => setFeeDialog(false)} maxWidth="sm" fullWidth>
          <form onSubmit={feeForm.handleSubmit(handleSaveFeeTemplate)}>
            <DialogTitle>
              {editingFee ? 'Edit Fee Template' : 'Create Fee Template'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Controller
                    name="name"
                    control={feeForm.control}
                    rules={{ required: 'Name is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Template Name"
                        error={!!feeForm.formState.errors.name}
                        helperText={feeForm.formState.errors.name?.message as string}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="nationality"
                    control={feeForm.control}
                    defaultValue=""
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        select
                        label="Nationality (Optional)"
                        helperText="Leave empty for general template"
                      >
                        <MenuItem value="">None (General)</MenuItem>
                        {nationalities.map((nationality: string) => (
                          <MenuItem key={nationality} value={nationality}>
                            {nationality}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="currency"
                    control={feeForm.control}
                    defaultValue="USD"
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        select
                        label="Currency"
                      >
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="LBP">LBP</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="defaultPrice"
                    control={feeForm.control}
                    rules={{ required: 'Default price is required', min: 0 }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Default Price"
                        type="number"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        error={!!feeForm.formState.errors.defaultPrice}
                        helperText={feeForm.formState.errors.defaultPrice?.message as string}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="minPrice"
                    control={feeForm.control}
                    rules={{ required: 'Minimum price is required', min: 0 }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Minimum Price"
                        type="number"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        error={!!feeForm.formState.errors.minPrice}
                        helperText={feeForm.formState.errors.minPrice?.message as string}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="maxPrice"
                    control={feeForm.control}
                    rules={{ required: 'Maximum price is required', min: 0 }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Maximum Price"
                        type="number"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        error={!!feeForm.formState.errors.maxPrice}
                        helperText={feeForm.formState.errors.maxPrice?.message as string}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={feeForm.control}
                    defaultValue=""
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Description (Optional)"
                        multiline
                        rows={2}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setFeeDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingFee ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

      {/* Document Template Dialog */}
      <Dialog open={documentDialog} onClose={() => setDocumentDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={documentForm.handleSubmit(handleSaveDocumentTemplate)}>
          <DialogTitle>
            {editingDocument ? 'Edit Document Template' : 'Create Document Template'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={documentForm.control}
                  rules={{ required: 'Document name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Document Name"
                      error={!!documentForm.formState.errors.name}
                      helperText={documentForm.formState.errors.name?.message as string}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="stage"
                  control={documentForm.control}
                  rules={{ required: 'Stage is required' }}
                  defaultValue="PENDING_MOL"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Application Stage"
                      error={!!documentForm.formState.errors.stage}
                      helperText={documentForm.formState.errors.stage?.message as string}
                    >
                      {applicationStages.map((stage: any) => (
                        <MenuItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="requiredFrom"
                  control={documentForm.control}
                  defaultValue="office"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Required From"
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
                  control={documentForm.control}
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
                  control={documentForm.control}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...field}
                          checked={field.value === true}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="This document is required"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDocumentDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingDocument ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.open} onClose={() => setDeleteConfirmDialog({ open: false, type: '', id: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {deleteConfirmDialog.type} template? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog({ open: false, type: '', id: null })}>
            Cancel
          </Button>
          <Button 
            onClick={deleteConfirmDialog.type === 'fee' ? handleDeleteFeeTemplate : handleDeleteDocumentTemplate}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Settings
