import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  Tab,
  Tabs,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { DocumentTemplate, Setting, ApplicationStatus } from '../shared/types'
import api from '../services/api'

interface FeeTemplate {
  id: string
  name: string
  defaultPrice: number
  minPrice: number
  maxPrice: number
  currency: string
  description?: string
}

const Settings = () => {
  const [tabValue, setTabValue] = useState(0)
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([])
  const [settings, setSettings] = useState<Setting[]>([])
  const [nationalities, setNationalities] = useState<string[]>([])
  const [feeTemplates, setFeeTemplates] = useState<FeeTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [documentDialog, setDocumentDialog] = useState<{
    open: boolean
    template: DocumentTemplate | null
  }>({ open: false, template: null })
  const [settingDialog, setSettingDialog] = useState<{
    open: boolean
    setting: Setting | null
  }>({ open: false, setting: null })
  const [feeDialog, setFeeDialog] = useState<{
    open: boolean
    template: FeeTemplate | null
  }>({ open: false, template: null })

  const { control: docControl, handleSubmit: handleDocSubmit, reset: resetDoc, setValue: setDocValue } = useForm()
  const { control: settingControl, handleSubmit: handleSettingSubmit, reset: resetSetting, setValue: setSettingValue } = useForm()
  const { control: feeControl, handleSubmit: handleFeeSubmit, reset: resetFee, setValue: setFeeValue, formState: { errors: feeErrors } } = useForm()

  useEffect(() => {
    fetchDocumentTemplates()
    fetchSettings()
    fetchNationalities()
    fetchFeeTemplates()
  }, [])

  const fetchDocumentTemplates = async () => {
    try {
      const response = await api.get<DocumentTemplate[]>('/settings/documents/templates')
      setDocumentTemplates(response.data || [])
    } catch (err: any) {
      console.log('Document templates endpoint not implemented yet')
      setDocumentTemplates([])
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await api.get<Setting[]>('/settings')
      setSettings(response.data || [])
    } catch (err: any) {
      console.log('Settings endpoint not implemented yet')
      setSettings([])
    }
  }

  const fetchNationalities = async () => {
    try {
      const response = await api.get<string[]>('/settings/nationalities')
      setNationalities(response.data || [])
    } catch (err: any) {
      console.log('Failed to fetch nationalities')
      setNationalities([
        'Ethiopian', 'Filipino', 'Sri Lankan', 'Bangladeshi', 'Kenyan',
        'Nigerian', 'Ugandan', 'Ghanaian', 'Nepalese', 'Indian'
      ])
    }
  }

  const fetchFeeTemplates = async () => {
    try {
      const response = await api.get<FeeTemplate[]>('/fee-templates')
      setFeeTemplates(response.data || [])
    } catch (err: any) {
      console.log('Failed to fetch fee templates')
      setFeeTemplates([])
    }
  }

  const handleAddNationality = async (nationality: string) => {
    try {
      const updatedNationalities = [...nationalities, nationality]
      await api.put('/settings/nationalities', { nationalities: updatedNationalities })
      setNationalities(updatedNationalities)
      setSuccess('Nationality added successfully')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add nationality')
    }
  }

  const handleDeleteNationality = async (nationality: string) => {
    try {
      const updatedNationalities = nationalities.filter(n => n !== nationality)
      await api.put('/settings/nationalities', { nationalities: updatedNationalities })
      setNationalities(updatedNationalities)
      setSuccess('Nationality removed successfully')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove nationality')
    }
  }

  const handleSaveDocumentTemplate = async (data: any) => {
    try {
      setLoading(true)
      if (documentDialog.template) {
        await api.put(`/settings/documents/templates/${documentDialog.template.id}`, data)
      } else {
        await api.post('/settings/documents/templates', data)
      }
      setSuccess('Document template saved successfully')
      setDocumentDialog({ open: false, template: null })
      resetDoc()
      fetchDocumentTemplates()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save document template')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocumentTemplate = async (id: string) => {
    try {
      await api.delete(`/settings/documents/templates/${id}`)
      setSuccess('Document template deleted successfully')
      fetchDocumentTemplates()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete document template')
    }
  }

  const handleSaveSetting = async (data: any) => {
    try {
      setLoading(true)
      if (settingDialog.setting) {
        await api.put(`/settings/${settingDialog.setting.key}`, data)
      } else {
        await api.put(`/settings/${data.key}`, data)
      }
      setSuccess('Setting saved successfully')
      setSettingDialog({ open: false, setting: null })
      resetSetting()
      fetchSettings()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save setting')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSetting = async (key: string) => {
    try {
      await api.delete(`/settings/${key}`)
      setSuccess('Setting deleted successfully')
      fetchSettings()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete setting')
    }
  }

  const handleSaveFeeTemplate = async (data: any) => {
    try {
      setLoading(true)
      
      // Convert string values to numbers
      data.defaultPrice = parseFloat(data.defaultPrice)
      data.minPrice = parseFloat(data.minPrice)
      data.maxPrice = parseFloat(data.maxPrice)
      
      // Validate price range
      if (data.minPrice > data.maxPrice) {
        setError('Minimum price cannot be greater than maximum price')
        return
      }
      
      if (data.defaultPrice < data.minPrice || data.defaultPrice > data.maxPrice) {
        setError('Default price must be between minimum and maximum price')
        return
      }
      
      if (feeDialog.template) {
        await api.put(`/fee-templates/${feeDialog.template.id}`, data)
      } else {
        await api.post('/fee-templates', data)
      }
      setSuccess('Fee template saved successfully')
      setFeeDialog({ open: false, template: null })
      resetFee()
      fetchFeeTemplates()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save fee template')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFeeTemplate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this fee template?')) {
      return
    }
    
    try {
      await api.delete(`/fee-templates/${id}`)
      setSuccess('Fee template deleted successfully')
      fetchFeeTemplates()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete fee template')
    }
  }

  const groupDocumentsByStage = () => {
    const grouped: { [key: string]: DocumentTemplate[] } = {}
    documentTemplates.forEach((template) => {
      if (!grouped[template.stage]) {
        grouped[template.stage] = []
      }
      grouped[template.stage].push(template)
    })
    return grouped
  }

  const openDocumentDialog = (template: DocumentTemplate | null) => {
    if (template) {
      setDocValue('stage', template.stage)
      setDocValue('name', template.name)
      setDocValue('required', template.required)
      setDocValue('order', template.order)
    } else {
      resetDoc()
    }
    setDocumentDialog({ open: true, template })
  }

  const openSettingDialog = (setting: Setting | null) => {
    if (setting) {
      setSettingValue('key', setting.key)
      setSettingValue('value', setting.value)
      setSettingValue('description', setting.description)
    } else {
      resetSetting()
    }
    setSettingDialog({ open: true, setting })
  }

  const openFeeDialog = (template: FeeTemplate | null) => {
    if (template) {
      setFeeValue('name', template.name)
      setFeeValue('defaultPrice', template.defaultPrice)
      setFeeValue('minPrice', template.minPrice)
      setFeeValue('maxPrice', template.maxPrice)
      setFeeValue('currency', template.currency)
      setFeeValue('description', template.description || '')
    } else {
      resetFee()
    }
    setFeeDialog({ open: true, template })
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
          <Tab label="Document Templates" />
          <Tab label="System Settings" />
          <Tab label="Nationalities" />
          <Tab label="Fee Templates" />
        </Tabs>
      </Paper>

      {/* Document Templates Tab */}
      {tabValue === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Document Templates by Stage</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openDocumentDialog(null)}
            >
              Add Document Template
            </Button>
          </Box>

          {Object.entries(groupDocumentsByStage()).map(([stage, templates]) => (
            <Card key={stage} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {stage.replace(/_/g, ' ')}
                </Typography>
                <List>
                  {templates
                    .sort((a, b) => a.order - b.order)
                    .map((template) => (
                      <ListItem key={template.id}>
                        <ListItemText
                          primary={template.name}
                          secondary={`Order: ${template.order} | ${
                            template.required ? 'Required' : 'Optional'
                          }`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => openDocumentDialog(template)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteDocumentTemplate(template.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                </List>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* System Settings Tab */}
      {tabValue === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">General Settings</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openSettingDialog(null)}
            >
              Add Setting
            </Button>
          </Box>

          <Grid container spacing={2}>
            {settings.map((setting) => (
              <Grid item xs={12} md={6} key={setting.id}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {setting.key}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {setting.description}
                    </Typography>
                    <Typography variant="h6">
                      {typeof setting.value === 'object'
                        ? JSON.stringify(setting.value)
                        : setting.value}
                    </Typography>
                    <Box display="flex" justifyContent="flex-end" mt={2}>
                      <IconButton
                        size="small"
                        onClick={() => openSettingDialog(setting)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSetting(setting.key)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Nationalities Tab */}
      {tabValue === 2 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Nationality Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                const newNationality = prompt('Enter new nationality:')
                if (newNationality) {
                  handleAddNationality(newNationality)
                }
              }}
            >
              Add Nationality
            </Button>
          </Box>

          <Card>
            <CardContent>
              <List>
                {nationalities.map((nationality, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={nationality} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteNationality(nationality)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Fee Templates Tab */}
      {tabValue === 3 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6">Fee Templates</Typography>
              <Typography variant="body2" color="textSecondary">
                Define standard fee structures that can be applied to applications
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openFeeDialog(null)}
            >
              Add Fee Template
            </Button>
          </Box>

          <Grid container spacing={2}>
            {feeTemplates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    {template.description && (
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {template.description}
                      </Typography>
                    )}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Default Fee:</strong> {template.currency} {template.defaultPrice}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Allowed Range:</strong> {template.currency} {template.minPrice} - {template.maxPrice}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                        This fee can be adjusted within the specified range when creating an application
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                      <IconButton
                        size="small"
                        onClick={() => openFeeDialog(template)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteFeeTemplate(template.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {feeTemplates.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No fee templates configured. Click "Add Fee Template" to create standardized fee structures for your applications.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Document Template Dialog */}
      <Dialog
        open={documentDialog.open}
        onClose={() => setDocumentDialog({ open: false, template: null })}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleDocSubmit(handleSaveDocumentTemplate)}>
          <DialogTitle>
            {documentDialog.template ? 'Edit' : 'Add'} Document Template
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="stage"
                  control={docControl}
                  rules={{ required: 'Stage is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Application Stage"
                      SelectProps={{ native: true }}
                    >
                      <option value="">Select a stage</option>
                      {Object.values(ApplicationStatus).map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={docControl}
                  rules={{ required: 'Document name is required' }}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Document Name" />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="order"
                  control={docControl}
                  defaultValue={1}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Display Order"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="required"
                  control={docControl}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Required"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDocumentDialog({ open: false, template: null })}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Fee Template Dialog */}
      <Dialog
        open={feeDialog.open}
        onClose={() => setFeeDialog({ open: false, template: null })}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleFeeSubmit(handleSaveFeeTemplate)}>
          <DialogTitle>
            {feeDialog.template ? 'Edit' : 'Add'} Fee Template
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={feeControl}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Template Name"
                      error={!!feeErrors.name}
                      helperText={feeErrors.name?.message as string || ''}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={feeControl}
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
              <Grid item xs={12} md={6}>
                <Controller
                  name="currency"
                  control={feeControl}
                  defaultValue="USD"
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Currency"
                      select
                      SelectProps={{ native: true }}
                    >
                      <option value="USD">USD</option>
                      <option value="LBP">LBP</option>
                      <option value="EUR">EUR</option>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="defaultPrice"
                  control={feeControl}
                  rules={{ 
                    required: 'Default price is required',
                    min: { value: 0, message: 'Price must be positive' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Default Price"
                      error={!!feeErrors.defaultPrice}
                      helperText={feeErrors.defaultPrice?.message as string || ''}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="minPrice"
                  control={feeControl}
                  rules={{ 
                    required: 'Minimum price is required',
                    min: { value: 0, message: 'Price must be positive' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Minimum Price"
                      error={!!feeErrors.minPrice}
                      helperText={feeErrors.minPrice?.message as string || ''}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="maxPrice"
                  control={feeControl}
                  rules={{ 
                    required: 'Maximum price is required',
                    min: { value: 0, message: 'Price must be positive' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Maximum Price"
                      error={!!feeErrors.maxPrice}
                      helperText={feeErrors.maxPrice?.message as string || ''}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeeDialog({ open: false, template: null })}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Setting Dialog */}
      <Dialog
        open={settingDialog.open}
        onClose={() => setSettingDialog({ open: false, setting: null })}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSettingSubmit(handleSaveSetting)}>
          <DialogTitle>
            {settingDialog.setting ? 'Edit' : 'Add'} Setting
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="key"
                  control={settingControl}
                  rules={{ required: 'Key is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Setting Key"
                      disabled={!!settingDialog.setting}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="value"
                  control={settingControl}
                  rules={{ required: 'Value is required' }}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label="Value" />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={settingControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingDialog({ open: false, setting: null })}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}

export default Settings
