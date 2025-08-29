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
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
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

  const feeForm = useForm<any>()
  const documentForm = useForm<any>()
  const settingsForm = useForm<any>()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch fee templates
      if (user?.role === 'SUPER_ADMIN') {
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
      if (editingDocument) {
        await api.put(`/document-templates/${editingDocument.id}`, data)
        setSuccess('Document template updated successfully')
      } else {
        await api.post('/document-templates', data)
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
          <Tab icon={<MoneyIcon />} label="Fee Templates" iconPosition="start" />
          <Tab icon={<DocumentIcon />} label="Document Templates" iconPosition="start" />
          <Tab icon={<BusinessIcon />} label="Company Settings" iconPosition="start" />
          <Tab icon={<NotificationIcon />} label="Notifications" iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {user?.role === 'SUPER_ADMIN' ? (
            <>
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
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    },
                  }}
                >
                  Add Fee Template
                </Button>
              </Box>

              <Grid container spacing={3}>
                {feeTemplates.map((template) => (
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
            </>
          ) : (
            <Alert severity="info">
              Only Super Admins can manage fee templates
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              <DocumentIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
              Document Templates
            </Typography>
            {user?.role === 'SUPER_ADMIN' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingDocument(null)
                  documentForm.reset()
                  setDocumentDialog(true)
                }}
              >
                Add Document Template
              </Button>
            )}
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document Name</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell>Required From</TableCell>
                  <TableCell>Required</TableCell>
                  <TableCell>Order</TableCell>
                  {user?.role === 'SUPER_ADMIN' && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {documentTemplates.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={doc.stage.replace(/_/g, ' ')} 
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={doc.requiredFrom || 'Office'} 
                        size="small"
                        color={doc.requiredFrom === 'client' ? 'warning' : 'info'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={doc.required ? 'Yes' : 'No'} 
                        size="small"
                        color={doc.required ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{doc.order}</TableCell>
                    {user?.role === 'SUPER_ADMIN' && (
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setEditingDocument(doc)
                            documentForm.reset(doc)
                            setDocumentDialog(true)
                          }}
                        >
                          <EditIcon />
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
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Company Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                defaultValue="Jobline Recruitment"
                disabled={user?.role !== 'SUPER_ADMIN'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Email"
                defaultValue="info@jobline.com"
                disabled={user?.role !== 'SUPER_ADMIN'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Phone"
                defaultValue="+961 1 234567"
                disabled={user?.role !== 'SUPER_ADMIN'}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Address"
                defaultValue="Beirut, Lebanon"
                disabled={user?.role !== 'SUPER_ADMIN'}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
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
          </List>
        </TabPanel>
      </Paper>

      {/* Fee Template Dialog */}
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
                      {nationalities.map((nationality) => (
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
