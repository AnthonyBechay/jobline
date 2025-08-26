import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardContent,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { Agent } from '../shared/types'
import api from '../services/api'

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dialog, setDialog] = useState<{
    open: boolean
    agent: Agent | null
  }>({ open: false, agent: null })

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const response = await api.get<Agent[]>('/agents')
      setAgents(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch agents')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAgent = async (data: any) => {
    try {
      setLoading(true)
      // Parse contact details from form fields
      const agentData = {
        name: data.name,
        contactDetails: {
          phone: data.phone,
          email: data.email,
          address: data.address,
          notes: data.notes,
        }
      }
      
      if (dialog.agent) {
        await api.patch(`/agents/${dialog.agent.id}`, agentData)
        setSuccess('Agent updated successfully')
      } else {
        await api.post('/agents', agentData)
        setSuccess('Agent created successfully')
      }
      setDialog({ open: false, agent: null })
      reset()
      fetchAgents()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save agent')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAgent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        await api.delete(`/agents/${id}`)
        setSuccess('Agent deleted successfully')
        fetchAgents()
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete agent')
      }
    }
  }

  const openDialog = (agent: Agent | null) => {
    if (agent) {
      setValue('name', agent.name)
      setValue('phone', agent.contactDetails?.phone || '')
      setValue('email', agent.contactDetails?.email || '')
      setValue('address', agent.contactDetails?.address || '')
      setValue('notes', agent.contactDetails?.notes || '')
    } else {
      reset()
    }
    setDialog({ open: true, agent })
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
      renderCell: (params) => params.row.contactDetails?.phone || '-'
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => params.row.contactDetails?.email || '-'
    },
    {
      field: 'createdAt',
      headerName: 'Added',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => openDialog(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteAgent(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Agent Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openDialog(null)}
        >
          Add Agent
        </Button>
      </Box>

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

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" align="center">
                {agents.length}
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                Total Agents
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={agents || []}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 }
            }
          }}
          pageSizeOptions={[5, 10, 25]}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Agent Dialog */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, agent: null })}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleSaveAgent)}>
          <DialogTitle>
            {dialog.agent ? 'Edit Agent' : 'Add Agent'}
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
                      label="Agent Name"
                      error={!!errors.name}
                      helperText={errors.name?.message as string}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                      InputProps={{
                        startAdornment: <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      InputProps={{
                        startAdornment: <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Notes"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog({ open: false, agent: null })}>
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

export default Agents
