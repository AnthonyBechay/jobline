import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
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
  TextField,
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
  Divider,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  NotificationsActive as NotificationIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  ArrowBack as BackIcon,
  Settings as SettingsIcon,
  EventNote as EventIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import api from '../../services/api'

interface Reminder {
  id: string
  name: string
  type: 'permit_expiry' | 'document_due' | 'payment_due' | 'custom'
  daysBefore: number
  enabled: boolean
  description?: string
  emailEnabled: boolean
  smsEnabled: boolean
  dashboardEnabled: boolean
}

interface ReminderTrigger {
  id: string
  reminderId: string
  applicationId: string
  triggerDate: string
  status: 'pending' | 'sent' | 'cancelled'
  application?: {
    id: string
    client: { name: string }
    candidate: { firstName: string; lastName: string }
    status: string
  }
}

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
      id={`reminders-tabpanel-${index}`}
      aria-labelledby={`reminders-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

interface RemindersSettingsProps {
  onBack: () => void
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

const RemindersSettings = ({ onBack, onError, onSuccess }: RemindersSettingsProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [triggers, setTriggers] = useState<ReminderTrigger[]>([])
  const [loading, setLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [reminderDialog, setReminderDialog] = useState<{
    open: boolean
    reminder: Reminder | null
  }>({ open: false, reminder: null })

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    fetchReminders()
    fetchUpcomingTriggers()
  }, [])

  const fetchReminders = async () => {
    try {
      const response = await api.get<Reminder[]>('/reminders')
      setReminders(response.data || [])
    } catch (err: any) {
      console.log('Reminders endpoint not implemented yet')
      // Set default reminders for demo
      setReminders([
        {
          id: '1',
          name: 'Permit Expiry Reminder',
          type: 'permit_expiry',
          daysBefore: 60,
          enabled: true,
          description: 'Notify when residence permit is about to expire',
          emailEnabled: true,
          smsEnabled: false,
          dashboardEnabled: true,
        },
        {
          id: '2',
          name: 'Document Collection Reminder',
          type: 'document_due',
          daysBefore: 7,
          enabled: true,
          description: 'Remind to collect pending documents',
          emailEnabled: false,
          smsEnabled: false,
          dashboardEnabled: true,
        },
        {
          id: '3',
          name: 'Payment Follow-up',
          type: 'payment_due',
          daysBefore: 3,
          enabled: true,
          description: 'Follow up on pending payments',
          emailEnabled: true,
          smsEnabled: true,
          dashboardEnabled: true,
        },
      ])
    }
  }

  const fetchUpcomingTriggers = async () => {
    try {
      const response = await api.get<ReminderTrigger[]>('/reminders/triggers/upcoming')
      setTriggers(response.data || [])
    } catch (err: any) {
      console.log('Triggers endpoint not implemented yet')
      // Set demo triggers
      setTriggers([
        {
          id: '1',
          reminderId: '1',
          applicationId: 'app1',
          triggerDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          application: {
            id: 'app1',
            client: { name: 'John Smith' },
            candidate: { firstName: 'Maria', lastName: 'Santos' },
            status: 'ACTIVE_EMPLOYMENT',
          },
        },
        {
          id: '2',
          reminderId: '2',
          applicationId: 'app2',
          triggerDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          application: {
            id: 'app2',
            client: { name: 'Jane Doe' },
            candidate: { firstName: 'Ahmed', lastName: 'Hassan' },
            status: 'PENDING_MOL',
          },
        },
      ])
    }
  }

  const handleSaveReminder = async (data: any) => {
    try {
      setLoading(true)
      
      if (reminderDialog.reminder) {
        await api.put(`/reminders/${reminderDialog.reminder.id}`, data)
        onSuccess('Reminder updated successfully')
      } else {
        await api.post('/reminders', data)
        onSuccess('Reminder created successfully')
      }
      
      setReminderDialog({ open: false, reminder: null })
      reset()
      fetchReminders()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to save reminder')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReminder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) {
      return
    }
    
    try {
      await api.delete(`/reminders/${id}`)
      onSuccess('Reminder deleted successfully')
      fetchReminders()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to delete reminder')
    }
  }

  const handleToggleReminder = async (reminder: Reminder) => {
    try {
      await api.patch(`/reminders/${reminder.id}`, { enabled: !reminder.enabled })
      fetchReminders()
    } catch (err: any) {
      console.log('Failed to toggle reminder')
      // For demo, just update locally
      setReminders(prev => prev.map(r => 
        r.id === reminder.id ? { ...r, enabled: !r.enabled } : r
      ))
    }
  }

  const openReminderDialog = (reminder: Reminder | null) => {
    if (reminder) {
      setValue('name', reminder.name)
      setValue('type', reminder.type)
      setValue('daysBefore', reminder.daysBefore)
      setValue('enabled', reminder.enabled)
      setValue('description', reminder.description || '')
      setValue('emailEnabled', reminder.emailEnabled)
      setValue('smsEnabled', reminder.smsEnabled)
      setValue('dashboardEnabled', reminder.dashboardEnabled)
    } else {
      reset()
    }
    setReminderDialog({ open: true, reminder })
  }

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case 'permit_expiry':
        return 'error'
      case 'document_due':
        return 'warning'
      case 'payment_due':
        return 'info'
      case 'custom':
      default:
        return 'default'
    }
  }

  const getReminderTypeIcon = (type: string) => {
    switch (type) {
      case 'permit_expiry':
        return <WarningIcon />
      case 'document_due':
        return <ScheduleIcon />
      case 'payment_due':
        return <NotificationIcon />
      case 'custom':
      default:
        return <NotificationIcon />
    }
  }

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
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Reminder Settings" icon={<SettingsIcon />} iconPosition="start" />
          <Tab label="Upcoming Reminders" icon={<EventIcon />} iconPosition="start" />
        </Tabs>

        {/* Reminder Settings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Configure System Reminders</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openReminderDialog(null)}
            >
              Add Reminder
            </Button>
          </Box>

          <Grid container spacing={3}>
            {reminders.map((reminder) => (
              <Grid item xs={12} md={6} lg={4} key={reminder.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getReminderTypeIcon(reminder.type)}
                        <Typography variant="h6">
                          {reminder.name}
                        </Typography>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={reminder.enabled}
                            onChange={() => handleToggleReminder(reminder)}
                            size="small"
                          />
                        }
                        label=""
                      />
                    </Box>
                    
                    <Chip
                      label={reminder.type.replace(/_/g, ' ').toUpperCase()}
                      color={getReminderTypeColor(reminder.type) as any}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    
                    {reminder.description && (
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {reminder.description}
                      </Typography>
                    )}
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="body2" gutterBottom>
                      <strong>Trigger:</strong> {reminder.daysBefore} days before
                    </Typography>
                    
                    <Box display="flex" gap={1} mt={1} mb={2}>
                      {reminder.emailEnabled && (
                        <Chip label="Email" size="small" color="primary" variant="outlined" />
                      )}
                      {reminder.smsEnabled && (
                        <Chip label="SMS" size="small" color="primary" variant="outlined" />
                      )}
                      {reminder.dashboardEnabled && (
                        <Chip label="Dashboard" size="small" color="primary" variant="outlined" />
                      )}
                    </Box>
                    
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => openReminderDialog(reminder)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteReminder(reminder.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            
            {reminders.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    No reminders configured. Click "Add Reminder" to create one.
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Upcoming Reminders Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Scheduled Reminders
          </Typography>
          
          <Card>
            <CardContent>
              <List>
                {triggers.map((trigger, index) => (
                  <React.Fragment key={trigger.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {trigger.application?.client.name} - {' '}
                              {trigger.application?.candidate.firstName} {trigger.application?.candidate.lastName}
                            </Typography>
                            <Chip
                              label={trigger.status}
                              size="small"
                              color={trigger.status === 'pending' ? 'warning' : 'default'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Trigger Date: {new Date(trigger.triggerDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2">
                              Application Status: {trigger.application?.status.replace(/_/g, ' ')}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            // Mark as sent or cancel
                          }}
                        >
                          <CheckIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
              
              {triggers.length === 0 && (
                <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                  No upcoming reminders scheduled
                </Typography>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Reminder Dialog */}
      <Dialog
        open={reminderDialog.open}
        onClose={() => setReminderDialog({ open: false, reminder: null })}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleSaveReminder)}>
          <DialogTitle>
            {reminderDialog.reminder ? 'Edit' : 'Add'} Reminder
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Reminder Name"
                      error={!!errors.name}
                      helperText={errors.name?.message as string}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="type"
                  control={control}
                  defaultValue="custom"
                  rules={{ required: 'Type is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Reminder Type"
                      error={!!errors.type}
                      helperText={errors.type?.message as string}
                    >
                      <MenuItem value="permit_expiry">Permit Expiry</MenuItem>
                      <MenuItem value="document_due">Document Due</MenuItem>
                      <MenuItem value="payment_due">Payment Due</MenuItem>
                      <MenuItem value="custom">Custom</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="daysBefore"
                  control={control}
                  defaultValue={7}
                  rules={{ 
                    required: 'Days before is required',
                    min: { value: 1, message: 'Must be at least 1 day' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Days Before Event"
                      error={!!errors.daysBefore}
                      helperText={errors.daysBefore?.message as string}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
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
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Notification Channels
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Controller
                  name="emailEnabled"
                  control={control}
                  defaultValue={false}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Email"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <Controller
                  name="smsEnabled"
                  control={control}
                  defaultValue={false}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="SMS"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={4}>
                <Controller
                  name="dashboardEnabled"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Dashboard"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="enabled"
                  control={control}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Enable this reminder"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReminderDialog({ open: false, reminder: null })}>
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

export default RemindersSettings
