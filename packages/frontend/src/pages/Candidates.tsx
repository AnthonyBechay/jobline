import { useState, useEffect, useRef } from 'react'
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
  Stack,
  Divider,
  CardHeader,
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
  PhotoCamera as PhotoCameraIcon,
  PictureAsPdf as PdfIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Language as LanguageIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { Candidate, CandidateStatus, Agent, PaginatedResponse } from '../shared/types'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

// Status color mapping
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

// Candidate Card Component
const CandidateCard = ({ candidate, onView, onEdit, onDelete, onExportPdf }: any) => {
  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A'
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      <CardHeader
        avatar={
          <Avatar
            src={candidate.photoUrl}
            sx={{ width: 56, height: 56 }}
          >
            {candidate.firstName?.[0]}{candidate.lastName?.[0]}
          </Avatar>
        }
        title={`${candidate.firstName} ${candidate.lastName}`}
        subheader={
          <Box>
            <Typography variant="body2" color="text.secondary">
              <LanguageIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              {candidate.nationality}
            </Typography>
            <Chip
              label={candidate.status.replace(/_/g, ' ')}
              color={getStatusColor(candidate.status)}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Box>
        }
      />
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Age</Typography>
            <Typography variant="body2">{calculateAge(candidate.dateOfBirth)} years</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Education</Typography>
            <Typography variant="body2">{candidate.education || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">Skills</Typography>
            <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {candidate.skills?.slice(0, 3).map((skill: string, index: number) => (
                <Chip key={index} label={skill} size="small" variant="outlined" />
              ))}
              {candidate.skills?.length > 3 && (
                <Chip label={`+${candidate.skills.length - 3}`} size="small" />
              )}
            </Box>
          </Grid>
          {candidate.agent && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Agent</Typography>
              <Typography variant="body2">{candidate.agent.name}</Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Box>
          <IconButton size="small" onClick={() => onView(candidate)} color="primary">
            <ViewIcon />
          </IconButton>
          <IconButton size="small" onClick={() => onEdit(candidate)} color="primary">
            <EditIcon />
          </IconButton>
          <IconButton size="small" onClick={() => onExportPdf(candidate)} color="primary">
            <PdfIcon />
          </IconButton>
        </Box>
        <IconButton size="small" onClick={() => onDelete(candidate)} color="error">
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  )
}

// Enhanced Candidate List Component
const CandidateList = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | ''>('')
  const [nationalityFilter, setNationalityFilter] = useState('')
  const [nationalities, setNationalities] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(12)
  const [totalRows, setTotalRows] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; candidate: Candidate | null }>({
    open: false,
    candidate: null,
  })

  useEffect(() => {
    fetchCandidates()
    fetchNationalities()
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

  const fetchNationalities = async () => {
    try {
      // Extract unique nationalities from candidates
      const response = await api.get<PaginatedResponse<Candidate>>('/candidates?limit=100')
      const uniqueNationalities = Array.from(
        new Set(response.data.data.map(c => c.nationality).filter(Boolean))
      ).sort()
      setNationalities(uniqueNationalities)
    } catch (err) {
      console.error('Failed to fetch nationalities:', err)
      setNationalities([
        'Ethiopian', 'Filipino', 'Sri Lankan', 'Bangladeshi', 'Kenyan',
        'Nigerian', 'Ugandan', 'Ghanaian', 'Nepalese', 'Indian'
      ])
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

  const handleExportPdf = async (candidate: Candidate) => {
    try {
      const response = await api.get(`/candidates/${candidate.id}/export-pdf`, {
        responseType: 'blob'
      })
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${candidate.firstName}_${candidate.lastName}_profile.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export PDF:', err)
      setError('Failed to export candidate as PDF')
    }
  }

  const handleExportAllCsv = async () => {
    try {
      const response = await api.get('/candidates/export', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'candidates.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export CSV:', err)
      setError('Failed to export candidates as CSV')
    }
  }

  // Group candidates by nationality for grid view
  const candidatesByNationality = candidates.reduce((acc, candidate) => {
    const nationality = candidate.nationality || 'Other'
    if (!acc[nationality]) acc[nationality] = []
    acc[nationality].push(candidate)
    return acc
  }, {} as Record<string, Candidate[]>)

  const columns: GridColDef[] = [
    {
      field: 'photo',
      headerName: 'Photo',
      width: 60,
      renderCell: (params) => (
        <Avatar 
          src={params.row.photoUrl} 
          alt={`${params.row.firstName} ${params.row.lastName}`}
          sx={{ width: 32, height: 32 }}
        >
          {params.row.firstName?.[0]}{params.row.lastName?.[0]}
        </Avatar>
      ),
    },
    { field: 'firstName', headerName: 'First Name', width: 120 },
    { field: 'lastName', headerName: 'Last Name', width: 120 },
    { field: 'nationality', headerName: 'Nationality', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
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
      width: 180,
      renderCell: (params) => (
        <Tooltip title={params.value?.join(', ') || 'No skills'}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {params.value?.slice(0, 2).map((skill: string, index: number) => (
              <Chip key={index} label={skill} size="small" variant="outlined" />
            ))}
            {params.value?.length > 2 && <Typography variant="caption">+{params.value.length - 2}</Typography>}
          </Box>
        </Tooltip>
      ),
    },
    {
      field: 'agent',
      headerName: 'Agent',
      width: 120,
      renderCell: (params) => params.row.agent?.name || '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => navigate(`/candidates/${params.row.id}`)}>
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => navigate(`/candidates/edit/${params.row.id}`)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleExportPdf(params.row)}>
            <PdfIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setDeleteDialog({ open: true, candidate: params.row })}
          >
            <DeleteIcon fontSize="small" />
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
          <Button
            variant={viewMode === 'grid' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('grid')}
          >
            Card View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Tooltip title="Export all as CSV">
            <IconButton color="primary" onClick={handleExportAllCsv}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import from CSV">
            <IconButton color="primary">
              <UploadIcon />
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
            <FormControl fullWidth size="small">
              <InputLabel>Nationality</InputLabel>
              <Select
                value={nationalityFilter}
                label="Nationality"
                onChange={(e) => setNationalityFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {nationalities.map((nationality) => (
                  <MenuItem key={nationality} value={nationality}>
                    {nationality}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="contained" onClick={handleSearch}>
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {viewMode === 'grid' ? (
        <Box>
          {Object.entries(candidatesByNationality).map(([nationality, nationalityCandidates]) => (
            <Box key={nationality} mb={4}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                {nationality} ({nationalityCandidates.length})
              </Typography>
              <Grid container spacing={2}>
                {nationalityCandidates.map((candidate) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={candidate.id}>
                    <CandidateCard
                      candidate={candidate}
                      onView={(c: Candidate) => navigate(`/candidates/${c.id}`)}
                      onEdit={(c: Candidate) => navigate(`/candidates/edit/${c.id}`)}
                      onDelete={(c: Candidate) => setDeleteDialog({ open: true, candidate: c })}
                      onExportPdf={handleExportPdf}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
          {candidates.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">No candidates found</Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={candidates || []}
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
      )}

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

// Enhanced Candidate Form Component with Photo Upload
const CandidateForm = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agents, setAgents] = useState<Agent[]>([])
  const [nationalities, setNationalities] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<Candidate>()

  useEffect(() => {
    // Check if we're in edit mode by checking the URL
    const pathSegments = window.location.pathname.split('/')
    if (pathSegments.includes('edit') && pathSegments.length > 3) {
      const id = pathSegments[pathSegments.length - 1]
      setIsEditMode(true)
      setCandidateId(id)
      fetchCandidate(id)
    }
    
    fetchNationalities()
    if (user?.role === 'SUPER_ADMIN') {
      fetchAgents()
    }
  }, [user])
  
  const fetchCandidate = async (id: string) => {
    try {
      const response = await api.get<Candidate>(`/candidates/${id}`)
      const candidate = response.data
      
      // Format the data for the form
      const formData = {
        ...candidate,
        skills: candidate.skills ? candidate.skills.join(', ') : '',
        dateOfBirth: candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toISOString().split('T')[0] : '',
      }
      
      // Set photo preview if exists
      if (candidate.photoUrl) {
        setPhotoPreview(candidate.photoUrl)
      }
      
      // Reset the form with the fetched data
      reset(formData as any)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch candidate')
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await api.get<Agent[]>('/agents')
      setAgents(response.data || [])
    } catch (err) {
      console.error('Failed to fetch agents:', err)
      setAgents([])
    }
  }

  const fetchNationalities = async () => {
    try {
      const response = await api.get<string[]>('/settings/nationalities')
      setNationalities(response.data || [])
    } catch (err) {
      console.error('Failed to fetch nationalities:', err)
      // Use default nationalities if fetch fails
      setNationalities([
        'Ethiopian', 'Filipino', 'Sri Lankan', 'Bangladeshi', 'Kenyan',
        'Nigerian', 'Ugandan', 'Ghanaian', 'Nepalese', 'Indian'
      ])
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB')
      return
    }

    try {
      setUploadingPhoto(true)
      
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', 'candidate')
      formData.append('entityId', candidateId || 'temp')

      // Upload the photo
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Set the photo URL in the form and preview
      const photoUrl = response.data.url
      setValue('photoUrl', photoUrl)
      setPhotoPreview(photoUrl)
      
      // Create a local preview URL
      const previewUrl = URL.createObjectURL(file)
      setPhotoPreview(previewUrl)
      
    } catch (err: any) {
      console.error('Photo upload error:', err)
      setError('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)
      // Parse skills from comma-separated string to array
      if (data.skills && typeof data.skills === 'string') {
        data.skills = data.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
      
      if (isEditMode && candidateId) {
        // Update existing candidate
        await api.put(`/candidates/${candidateId}`, data)
      } else {
        // Create new candidate
        await api.post('/candidates', data)
      }
      
      navigate('/candidates')
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} candidate`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{isEditMode ? 'Edit' : 'New'} Candidate</Typography>
        <Button variant="outlined" onClick={() => navigate('/candidates')}>
          Back to List
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Photo Upload Section */}
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Avatar
                  src={photoPreview || ''}
                  sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
                >
                  {!photoPreview && <PhotoCameraIcon sx={{ fontSize: 60 }} />}
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  fullWidth
                >
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </Button>
                <Controller
                  name="photoUrl"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="hidden"
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Form Fields */}
            <Grid item xs={12} md={9}>
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
                        select
                        label="Nationality"
                        error={!!errors.nationality}
                        helperText={errors.nationality?.message}
                      >
                        <MenuItem value="">Select nationality</MenuItem>
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
                          {agents && agents.length > 0 && agents.map((agent) => (
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
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => navigate('/candidates')}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Candidate' : 'Create Candidate')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

// Enhanced Candidate Details Component
const CandidateDetails = () => {
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  useEffect(() => {
    // Get ID from URL
    const pathSegments = window.location.pathname.split('/')
    const id = pathSegments[pathSegments.length - 1]
    if (id) {
      fetchCandidate(id)
    }
  }, [])
  
  const fetchCandidate = async (id: string) => {
    try {
      setLoading(true)
      const response = await api.get<Candidate>(`/candidates/${id}`)
      setCandidate(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch candidate details')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPdf = async () => {
    if (!candidate) return
    
    try {
      const response = await api.get(`/candidates/${candidate.id}/export-pdf`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${candidate.firstName}_${candidate.lastName}_profile.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export PDF:', err)
      setError('Failed to export candidate as PDF')
    }
  }
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    )
  }
  
  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" onClick={() => navigate('/candidates')}>Back to List</Button>
      </Box>
    )
  }
  
  if (!candidate) {
    return null
  }
  
  const calculateAge = (dob: string | Date | null | undefined) => {
    if (!dob) return 'N/A'
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Candidate Details</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => navigate('/candidates')}>Back to List</Button>
          <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportPdf}>Export PDF</Button>
          <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/candidates/edit/${candidate.id}`)}>Edit</Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardMedia
              component="img"
              height="300"
              image={candidate.photoUrl || '/placeholder-avatar.jpg'}
              alt={`${candidate.firstName} ${candidate.lastName}`}
              sx={{ objectFit: 'cover' }}
            />
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {candidate.firstName} {candidate.lastName}
              </Typography>
              <Chip
                label={candidate.status.replace(/_/g, ' ')}
                color={getStatusColor(candidate.status)}
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Personal Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography color="textSecondary">Nationality:</Typography>
                <Typography>{candidate.nationality}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="textSecondary">Date of Birth:</Typography>
                <Typography>
                  {candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toLocaleDateString() : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="textSecondary">Age:</Typography>
                <Typography>{calculateAge(candidate.dateOfBirth)} years</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="textSecondary">Education:</Typography>
                <Typography>{candidate.education || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="textSecondary">Agent:</Typography>
                <Typography>{candidate.agent?.name || 'N/A'}</Typography>
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Skills</Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {candidate.skills && candidate.skills.length > 0 ? (
                candidate.skills.map((skill, index) => (
                  <Chip key={index} label={skill} variant="outlined" />
                ))
              ) : (
                <Typography color="textSecondary">No skills listed</Typography>
              )}
            </Box>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Experience Summary</Typography>
            <Typography>{candidate.experienceSummary || 'No experience summary provided'}</Typography>
            
            {candidate.applications && candidate.applications.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Application History</Typography>
                <Box sx={{ mt: 2 }}>
                  {candidate.applications.map((app: any) => (
                    <Card key={app.id} sx={{ mb: 1 }}>
                      <CardContent>
                        <Typography variant="subtitle1">
                          Client: {app.client?.name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Status: {app.status.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Date: {new Date(app.createdAt).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
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
      <Route path=":id" element={<CandidateDetails />} />
    </Routes>
  )
}

export default Candidates
