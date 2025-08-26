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

const Settings = () => {
  const [tabValue, setTabValue] = useState(0)
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([])
  const [settings, setSettings] = useState<Setting[]>([])
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

  const { control: docControl, handleSubmit: handleDocSubmit, reset: resetDoc, setValue: setDocValue } = useForm()
  const { control: settingControl, handleSubmit: handleSettingSubmit, reset: resetSetting, setValue: setSettingValue } = useForm()

  useEffect(() => {
    fetchDocumentTemplates()
    fetchSettings()
  }, [])

  const fetchDocumentTemplates = async () => {
    try {
      const response = await api.get<DocumentTemplate[]>('/document-templates')
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

  const handleSaveDocumentTemplate = async (data: any) => {
    try {
      setLoading(true)
      if (documentDialog.template) {
        await api.patch(`/document-templates/${documentDialog.template.id}`, data)
      } else {
        await api.post('/document-templates', data)
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
      await api.delete(`/document-templates/${id}`)
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
        await api.patch(`/settings/${settingDialog.setting.id}`, data)
      } else {
        await api.post('/settings', data)
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

  const handleDeleteSetting = async (id: string) => {
    try {
      await api.delete(`/settings/${id}`)
      setSuccess('Setting deleted successfully')
      fetchSettings()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete setting')
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
          <Tab label="Fee Configuration" />
          <Tab label="Notification Settings" />
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
                        onClick={() => handleDeleteSetting(setting.id)}
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

      {/* Fee Configuration Tab */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Fee Configuration
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Office Commission
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    defaultValue={settings.find(s => s.key === 'office_commission')?.value || 0}
                    InputProps={{ startAdornment: '$' }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Expedited Visa Fee
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    defaultValue={settings.find(s => s.key === 'expedited_visa_fee')?.value || 0}
                    InputProps={{ startAdornment: '$' }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Attorney Processing Fee
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    defaultValue={settings.find(s => s.key === 'attorney_fee')?.value || 0}
                    InputProps={{ startAdornment: '$' }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Government Processing Fee
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    defaultValue={settings.find(s => s.key === 'government_fee')?.value || 0}
                    InputProps={{ startAdornment: '$' }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" startIcon={<SaveIcon />}>
                Save Fee Configuration
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Notification Settings Tab */}
      {tabValue === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Notification Settings
          </Typography>
          <Card>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked={settings.find(s => s.key === 'email_notifications')?.value || false}
                      />
                    }
                    label="Enable Email Notifications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        defaultChecked={settings.find(s => s.key === 'renewal_reminders')?.value || false}
                      />
                    }
                    label="Enable Renewal Reminders"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Days Before Permit Expiry to Send Reminder"
                    defaultValue={settings.find(s => s.key === 'renewal_reminder_days')?.value || 60}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Days Before Document Due to Send Reminder"
                    defaultValue={settings.find(s => s.key === 'document_reminder_days')?.value || 7}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" startIcon={<SaveIcon />}>
                    Save Notification Settings
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
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
