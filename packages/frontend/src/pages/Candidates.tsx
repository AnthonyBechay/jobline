import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Fab,
  Tooltip,
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
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { Candidate, CandidateStatus, Agent, PaginatedResponse } from '../shared/types'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

// Candidate List Component
const CandidateList = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | ''>('')
  const [nationalityFilter, setNationalityFilter] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; candidate: Candidate | null }>({
    open: false,
    candidate: null,
  })

  useEffect(() => {
    fetchCandidates()
  }, [page, pageSize, statusFilter, nationalityFilter])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', (page + 1).toString())
      params.append('limit', pageSize.toString())
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (nationalityFilter) params.append('nationality', nationalityFilter)

      const response = await api.get<PaginatedResponse<Candidate>>(`/candidates?${params}`)
      setCandidates(response.data.data)
      setTotalRows(response.data.pagination.total)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch candidates')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.candidate) return

    try {
      await api.delete(`/candidates/${deleteDialog.candidate.id}`)
      await fetchCandidates()
      setDeleteDialog({ open: false, candidate: null })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete candidate')
    }
  }

  const handleSearch = () => {
    setPage(0)
    fetchCandidates()
  }

  const getStatusColor = (status: CandidateStatus) => {
    const colors = {
      [CandidateStatus.AVAILABLE_ABROAD]: 'info',
      [CandidateStatus.AVAILABLE_IN_LEBANON]: 'success',
      [CandidateStatus.RESERVED]: 'warning',
      [CandidateStatus.IN_PROCESS]: 'default',
      [CandidateStatus.PLACED]: 'secondary',
    }
    return colors[status] as any
  }

  const columns: GridColDef[] = [
    {
      field: 'photo',
      headerName: 'Photo',
      width: 80,
      renderCell: (params) => (
        <Avatar src={params.row.photoUrl} alt={`${params.row.firstName} ${params.row.lastName}`}>
          {params.row.firstName[0]}{params.row.lastName[0]}
        </Avatar>
      ),
    },
    { field: 'firstName', headerName: 'First Name', flex: 1, minWidth: 120 },
    { field: 'lastName', headerName: 'Last Name', flex: 1, minWidth: 120 },
    { field: 'nationality', headerName: 'Nationality', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 180,
      renderCell: (params) => (
        <Chip
          label={params.value.replace(/_/g, ' ')}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'skills',
      headerName: 'Skills',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {params.value?.slice(0, 3).map((skill: string, index: number) => (
            <Chip key={index} label={skill} size="small" variant="outlined" />
          ))}
          {params.value?.length > 3 && <Typography variant="caption">+{params.value.length - 3}</Typography>}
        </Box>
      ),
    },
    {
      field: 'agent',
      headerName: 'Agent',
      width: 150,
      renderCell: (params) => params.row.agent?.name || '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => navigate(`/candidates/${params.row.id}`)}>
            <ViewIcon />
          </IconButton>
          <IconButton size="small" onClick={() => navigate(`/candidates/edit/${params.row.id}`)}>
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setDeleteDialog({ open: true, candidate: params.row })}
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
        <Typography variant="h4">Candidates</Typography>
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
            onClick={() => navigate('/candidates/new')}
          >
            Add Candidate
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name..."
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
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as CandidateStatus | '')}
              >
                <MenuItem value="">All</MenuItem>
                {Object.values(CandidateStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Nationality"
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="contained" onClick={handleSearch}>
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={candidates}
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
        />
      </Paper>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, candidate: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete {deleteDialog.candidate?.firstName} {deleteDialog.candidate?.lastName}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, candidate: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// Candidate Form Component
const CandidateForm = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agents, setAgents] = useState<Agent[]>([])
  const { control, handleSubmit, formState: { errors } } = useForm<Candidate>()

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchAgents()
    }
  }, [user])

  const fetchAgents = async () => {
    try {
      const response = await api.get<Agent[]>('/agents')
      setAgents(response.data)
    } catch (err) {
      console.error('Failed to fetch agents:', err)
    }
  }

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)
      // Parse skills from comma-separated string to array
      if (data.skills && typeof data.skills === 'string') {
        data.skills = data.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
      await api.post('/candidates', data)
      navigate('/candidates')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create candidate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">New Candidate</Typography>
        <Button variant="outlined" onClick={() => navigate('/candidates')}>
          Back to List
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="firstName"
                control={control}
                rules={{ required: 'First name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="First Name"
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="lastName"
                control={control}
                rules={{ required: 'Last name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Last Name"
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="nationality"
                control={control}
                rules={{ required: 'Nationality is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nationality"
                    error={!!errors.nationality}
                    helperText={errors.nationality?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="status"
                control={control}
                defaultValue={CandidateStatus.AVAILABLE_ABROAD}
                rules={{ required: 'Status is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Status"
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    {Object.values(CandidateStatus).map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            {user?.role === 'SUPER_ADMIN' && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="agentId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Agent"
                    >
                      <MenuItem value="">None</MenuItem>
                      {agents.map((agent) => (
                        <MenuItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <Controller
                name="education"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Education"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="photoUrl"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Photo URL"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Skills"
                    placeholder="Enter skills separated by commas (e.g., Cooking, Cleaning, Childcare)"
                    helperText="Separate skills with commas"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="experienceSummary"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Experience Summary"
                    multiline
                    rows={4}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => navigate('/candidates')}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Candidate'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

// Main Candidates Component with Routes
const Candidates = () => {
  return (
    <Routes>
      <Route index element={<CandidateList />} />
      <Route path="new" element={<CandidateForm />} />
      <Route path="edit/:id" element={<CandidateForm />} />
      <Route path=":id" element={<div>Candidate Details View</div>} />
    </Routes>
  )
}

export default Candidates
