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
import { Broker } from '../shared/types'
import api from '../services/api'

const Brokers = () => {
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dialog, setDialog] = useState<{
    open: boolean
    broker: Broker | null
  }>({ open: false, broker: null })

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    fetchBrokers()
  }, [])

  const fetchBrokers = async () => {
    try {
      setLoading(true)
      const response = await api.get<Broker[]>('/brokers')
      setBrokers(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch brokers')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBroker = async (data: any) => {
    try {
      setLoading(true)
      // Parse contact details from form fields
      const brokerData = {
        name: data.name,
        contactDetails: {
          phone: data.phone,
          email: data.email,
          address: data.address,
          notes: data.notes,
        }
      }
      
      if (dialog.broker) {
        await api.patch(`/brokers/${dialog.broker.id}`, brokerData)
        setSuccess('Broker updated successfully')
      } else {
        await api.post('/brokers', brokerData)
        setSuccess('Broker created successfully')
      }
      setDialog({ open: false, broker: null })
      reset()
      fetchBrokers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save broker')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBroker = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this broker?')) {
      try {
        await api.delete(`/brokers/${id}`)
        setSuccess('Broker deleted successfully')
        fetchBrokers()
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete broker')
      }
    }
  }

  const openDialog = (broker: Broker | null) => {
    if (broker) {
      setValue('name', broker.name)
      setValue('phone', broker.contactDetails?.phone || '')
      setValue('email', broker.contactDetails?.email || '')
      setValue('address', broker.contactDetails?.address || '')
      setValue('notes', broker.contactDetails?.notes || '')
    } else {
      reset()
    }
    setDialog({ open: true, broker })
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
            onClick={() => handleDeleteBroker(params.row.id)}
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
        <Typography variant="h4">Broker Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openDialog(null)}
        >
          Add Broker
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
                {brokers.length}
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                Total Brokers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={brokers || []}
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

      {/* Broker Dialog */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, broker: null })}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleSaveBroker)}>
          <DialogTitle>
            {dialog.broker ? 'Edit Broker' : 'Add Broker'}
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
                      label="Broker Name"
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
            <Button onClick={() => setDialog({ open: false, broker: null })}>
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

export default Brokers
