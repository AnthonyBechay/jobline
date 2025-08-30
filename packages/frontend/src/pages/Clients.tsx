import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
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
  InputAdornment,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  History as HistoryIcon,
  PersonAdd as ReferralIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteFileIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { Client, PaginatedResponse, Application } from '../shared/types'
import api from '../services/api'

// Client List Component
const ClientList = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; client: Client | null }>({
    open: false,
    client: null,
  })

  useEffect(() => {
    fetchClients()
  }, [page, pageSize])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', (page + 1).toString())
      params.append('limit', pageSize.toString())
      if (searchTerm) params.append('search', searchTerm)

      const response = await api.get<PaginatedResponse<Client>>(`/clients?${params}`)
      setClients(response.data.data)
      setTotalRows(response.data.pagination.total)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch clients')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.client) return

    try {
      await api.delete(`/clients/${deleteDialog.client.id}`)
      await fetchClients()
      setDeleteDialog({ open: false, client: null })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete client')
    }
  }

  const handleSearch = () => {
    setPage(0)
    fetchClients()
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { 
      field: 'phone', 
      headerName: 'Phone', 
      width: 150,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PhoneIcon fontSize="small" color="action" />
          {params.value}
        </Box>
      )
    },
    { 
      field: 'address', 
      headerName: 'Address', 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => params.value || '-'
    },
    {
      field: 'referrer',
      headerName: 'Referred By',
      width: 150,
      renderCell: (params) => 
        params.row.referrer ? (
          <Chip 
            label={params.row.referrer.name} 
            size="small" 
            icon={<ReferralIcon />}
          />
        ) : '-'
    },
    {
      field: 'createdAt',
      headerName: 'Client Since',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => navigate(`/clients/${params.row.id}`)}>
            <ViewIcon />
          </IconButton>
          <IconButton size="small" onClick={() => navigate(`/clients/edit/${params.row.id}`)}>
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setDeleteDialog({ open: true, client: params.row })}
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
        <Typography variant="h4">Clients</Typography>
        <Box display="flex" gap={2}>
          <Tooltip title="Import from CSV">
            <IconButton color="primary">
              <UploadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to CSV">
            <IconButton color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/clients/new')}
          >
            Add Client
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, phone, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button fullWidth variant="contained" onClick={handleSearch}>
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={clients || []}
          columns={columns}
          paginationModel={{ page, pageSize }}
          pageSizeOptions={[5, 10, 25, 50]}
          onPaginationModelChange={(model) => {
            setPage(model.page)
            setPageSize(model.pageSize)
          }}
          loading={loading}
          rowCount={totalRows}
          paginationMode="server"
          checkboxSelection
          disableRowSelectionOnClick
          onRowClick={(params) => navigate(`/clients/${params.row.id}`)}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        />
      </Paper>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, client: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete client "{deleteDialog.client?.name}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, client: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// Client Form Component
const ClientForm = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<Client>()

  useEffect(() => {
    fetchClients()
    if (id) {
      fetchClientDetails()
    }
  }, [id])

  const fetchClients = async () => {
    try {
      const response = await api.get<PaginatedResponse<Client>>('/clients?limit=100')
      setClients(response.data?.data || [])
    } catch (err) {
      console.error('Failed to fetch clients:', err)
      setClients([])
    }
  }

  const fetchClientDetails = async () => {
    try {
      const response = await api.get<Client>(`/clients/${id}`)
      const client = response.data
      // Set form values for editing
      setValue('name', client.name)
      setValue('phone', client.phone)
      setValue('address', client.address || '')
      setValue('notes', client.notes || '')
      setValue('referredByClient', client.referredByClient || '')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch client details')
    }
  }

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)
      if (id) {
        // Update existing client
        await api.patch(`/clients/${id}`, data)
      } else {
        // Create new client
        await api.post('/clients', data)
      }
      navigate('/clients')
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${id ? 'update' : 'create'} client`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{id ? 'Edit Client' : 'New Client'}</Typography>
        <Button variant="outlined" onClick={() => navigate('/clients')}>
          Back to List
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Client Name"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="phone"
                control={control}
                rules={{ required: 'Phone is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Phone Number"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
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
            <Grid item xs={12} md={6}>
              <Controller
                name="referredByClient"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Referred By"
                    SelectProps={{ native: true }}
                  >
                    <option value="">None</option>
                    {clients && clients.length > 0 && clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </TextField>
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
                    rows={4}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => navigate('/clients')}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? (id ? 'Updating...' : 'Creating...') : (id ? 'Update Client' : 'Create Client')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

// Client Details Component
const ClientDetails = () => {
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadDialog, setUploadDialog] = useState(false)
  const [uploadType, setUploadType] = useState<'id' | 'custom1' | 'custom2'>('id')
  const [customDocName, setCustomDocName] = useState('')
  const [uploading, setUploading] = useState(false)
  const clientId = window.location.pathname.split('/').pop()

  useEffect(() => {
    if (clientId && clientId !== 'new' && !clientId.includes('edit')) {
      fetchClientDetails()
      fetchClientApplications()
      fetchUploadedFiles()
    }
  }, [clientId])

  const fetchClientDetails = async () => {
    try {
      const response = await api.get<Client>(`/clients/${clientId}`)
      setClient(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch client details')
    } finally {
      setLoading(false)
    }
  }

  const fetchClientApplications = async () => {
    try {
      const response = await api.get<any>(`/applications?clientId=${clientId}`)
      // Handle both paginated and non-paginated responses
      const applications = response.data?.applications || response.data?.data || response.data || []
      // Ensure it's an array
      setApplications(Array.isArray(applications) ? applications : [])
    } catch (err) {
      console.error('Failed to fetch applications:', err)
      setApplications([])
    }
  }

  const fetchUploadedFiles = async () => {
    try {
      const response = await api.get(`/files?entityType=client&entityId=${clientId}`)
      setUploadedFiles(response.data || [])
    } catch (err) {
      console.error('Failed to fetch uploaded files:', err)
      setUploadedFiles([])
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size should be less than 10MB')
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', 'client')
      formData.append('entityId', clientId || '')
      
      // Add custom document name as metadata if provided
      const docName = uploadType === 'id' ? 'Client ID' : 
                     uploadType === 'custom1' ? (customDocName || 'Custom Document 1') :
                     (customDocName || 'Custom Document 2')
      formData.append('documentName', docName)

      await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Refresh uploaded files list
      await fetchUploadedFiles()
      
      // Close dialog and reset
      setUploadDialog(false)
      setCustomDocName('')
      event.target.value = ''
    } catch (err: any) {
      console.error('File upload error:', err)
      setError(err.response?.data?.error || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <Box>Loading...</Box>
  if (error) return <Alert severity="error">{error}</Alert>
  if (!client) return <Alert severity="info">Client not found</Alert>

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{client.name}</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => navigate('/clients')}>
            Back to List
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/clients/edit/${client.id}`)}
          >
            Edit
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Client Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Phone"
                    secondary={client.phone}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Address"
                    secondary={client.address || 'Not provided'}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Referred By"
                    secondary={client.referrer?.name || 'Direct client'}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Client Since"
                    secondary={new Date(client.createdAt).toLocaleDateString()}
                  />
                </ListItem>
                {client.notes && (
                  <>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary="Notes"
                        secondary={client.notes}
                      />
                    </ListItem>
                  </>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Hiring History
              </Typography>
              {applications.length === 0 ? (
                <Typography color="textSecondary">No applications yet</Typography>
              ) : (
                <List>
                  {applications.map((app) => (
                    <ListItem key={app.id}>
                      <ListItemText
                        primary={`${app.candidate?.firstName} ${app.candidate?.lastName}`}
                        secondary={`Status: ${app.status.replace(/_/g, ' ')} - ${new Date(app.createdAt).toLocaleDateString()}`}
                      />
                      <Button size="small" onClick={() => navigate(`/applications/${app.id}`)}>
                        View
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" gutterBottom>
                  <FileIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Documents
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<UploadIcon />}
                  onClick={() => setUploadDialog(true)}
                >
                  Upload Document
                </Button>
              </Box>
              
              {uploadedFiles.length === 0 ? (
                <Typography color="textSecondary">No documents uploaded yet</Typography>
              ) : (
                <List>
                  {uploadedFiles.map((file) => (
                    <ListItem key={file.id}>
                      <ListItemIcon>
                        <FileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.originalName}
                        secondary={`Uploaded on ${new Date(file.uploadedAt).toLocaleDateString()} by ${file.uploadedBy}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          component="a"
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value as 'id' | 'custom1' | 'custom2')}
            >
              <MenuItem value="id">Client ID</MenuItem>
              <MenuItem value="custom1">Custom Document 1</MenuItem>
              <MenuItem value="custom2">Custom Document 2</MenuItem>
            </Select>
          </FormControl>
          
          {(uploadType === 'custom1' || uploadType === 'custom2') && (
            <TextField
              fullWidth
              label="Document Name"
              value={customDocName}
              onChange={(e) => setCustomDocName(e.target.value)}
              placeholder="Enter document name"
              sx={{ mb: 2 }}
            />
          )}
          
          <input
            type="file"
            id="client-file-upload"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          />
          <label htmlFor="client-file-upload">
            <Button
              variant="outlined"
              component="span"
              fullWidth
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
            >
              {uploading ? 'Uploading...' : 'Select File'}
            </Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)} disabled={uploading}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// Main Clients Component with Routes
const Clients = () => {
  return (
    <Routes>
      <Route index element={<ClientList />} />
      <Route path="new" element={<ClientForm />} />
      <Route path="edit/:id" element={<ClientForm />} />
      <Route path=":id" element={<ClientDetails />} />
    </Routes>
  )
}

export default Clients
