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
  Tabs,
  Tab,
  CardActionArea,
  ToggleButton,
  ToggleButtonGroup,
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
  Clear as ClearIcon,
  Face as FaceIcon,
  Accessibility as BodyIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { Candidate, CandidateStatus, Agent, PaginatedResponse } from '../shared/types'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

// Status color mapping
const getStatusColor = (status: CandidateStatus) => {
  const colors = {
    [CandidateStatus.AVAILABLE_ABROAD]: 'success',
    [CandidateStatus.AVAILABLE_IN_LEBANON]: 'info',
    [CandidateStatus.RESERVED]: 'warning',
    [CandidateStatus.IN_PROCESS]: 'default',
    [CandidateStatus.PLACED]: 'secondary',
  }
  return colors[status] as any
}

// Candidate Card Component - Now clickable
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
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      <CardActionArea onClick={() => onView(candidate)} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <CardHeader
          avatar={
            <Avatar
              src={candidate.facePhotoUrl || candidate.photoUrl}
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
      </CardActionArea>
      
      <Divider />
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(candidate); }} color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export PDF">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onExportPdf(candidate); }} color="primary">
              <PdfIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(candidate); }} color="error">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  )
}

// Enhanced Candidate List Component with Tabs
const CandidateList = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [nationalities, setNationalities] = useState<any[]>([])
  const [selectedTab, setSelectedTab] = useState('all')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(24)
  const [totalRows, setTotalRows] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<CandidateStatus[]>([
    CandidateStatus.AVAILABLE_ABROAD,
    CandidateStatus.AVAILABLE_IN_LEBANON,
    CandidateStatus.RESERVED
  ])
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; candidate: Candidate | null }>({
    open: false,
    candidate: null,
  })

  useEffect(() => {
    fetchCandidates()
    fetchNationalities()
  }, [page, pageSize, selectedTab, statusFilter])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', (page + 1).toString())
      params.append('limit', pageSize.toString())
      
      // Apply search term
      if (searchTerm) params.append('search', searchTerm)
      
      // Apply nationality filter based on selected tab
      if (selectedTab !== 'all') {
        params.append('nationality', selectedTab)
      }
      
      // Apply status filter
      statusFilter.forEach(status => {
        params.append('status', status)
      })

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
      const response = await api.get('/nationalities')
      setNationalities(response.data || [])
    } catch (err) {
      console.error('Failed to fetch nationalities:', err)
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue)
    setPage(0)
  }

  const handleStatusFilterChange = (status: CandidateStatus) => {
    setStatusFilter(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }

  const handleExportPdf = async (candidate: Candidate) => {
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

  // Count candidates by nationality - only show tabs with candidates
  const candidateCountByNationality = candidates.reduce((acc, candidate) => {
    const nat = candidate.nationality || 'Other'
    acc[nat] = (acc[nat] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Filter nationalities to only show those with candidates
  const nationalitiesWithCandidates = nationalities.filter(nat => 
    candidateCountByNationality[nat.name] > 0
  )

  const columns: GridColDef[] = [
    {
      field: 'photo',
      headerName: 'Photo',
      width: 60,
      renderCell: (params) => (
        <Avatar 
          src={params.row.facePhotoUrl || params.row.photoUrl} 
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
            size="small"
          >
            Card View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('list')}
            size="small"
          >
            List View
          </Button>
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

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            sx={{ flex: 1, minWidth: 300 }}
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
          
          {/* Status Filter Chips */}
          <Box display="flex" gap={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">Status:</Typography>
            {Object.values(CandidateStatus).map(status => (
              <Chip
                key={status}
                label={status.replace(/_/g, ' ')}
                color={statusFilter.includes(status) ? getStatusColor(status) : 'default'}
                variant={statusFilter.includes(status) ? 'filled' : 'outlined'}
                onClick={() => handleStatusFilterChange(status)}
                size="small"
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Nationality Tabs - Only show tabs with candidates */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={`All (${totalRows})`} 
            value="all" 
          />
          {nationalitiesWithCandidates.map((nationality) => (
            <Tab
              key={nationality.id}
              label={`${nationality.name} (${candidateCountByNationality[nationality.name] || 0})`}
              value={nationality.name}
            />
          ))}
        </Tabs>
      </Paper>

      {viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {candidates.map((candidate) => (
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
          {candidates.length === 0 && !loading && (
            <Grid item xs={12}>
              <Box textAlign="center" py={4}>
                <Typography color="textSecondary">No candidates found</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      ) : (
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={candidates || []}
            columns={columns}
            paginationModel={{ page, pageSize }}
            pageSizeOptions={[10, 25, 50, 100]}
            onPaginationModelChange={(model) => {
              setPage(model.page)
              setPageSize(model.pageSize)
            }}
            loading={loading}
            rowCount={totalRows}
            paginationMode="server"
            checkboxSelection
            disableRowSelectionOnClick
            onRowClick={(params) => navigate(`/candidates/${params.row.id}`)}
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

// Enhanced Candidate Form Component with Two Photo Uploads
const CandidateForm = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const facePhotoRef = useRef<HTMLInputElement>(null)
  const bodyPhotoRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agents, setAgents] = useState<Agent[]>([])
  const [nationalities, setNationalities] = useState<any[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [facePhotoPreview, setFacePhotoPreview] = useState<string | null>(null)
  const [bodyPhotoPreview, setBodyPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<any>()

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
      const formData: any = {
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        nationality: candidate.nationality,
        status: candidate.status,
        education: candidate.education || '',
        experienceSummary: candidate.experienceSummary || '',
        photoUrl: candidate.photoUrl || '',
        facePhotoUrl: candidate.facePhotoUrl || '',
        fullBodyPhotoUrl: candidate.fullBodyPhotoUrl || '',
        agentId: candidate.agentId || '',
        skills: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : '',
        dateOfBirth: candidate.dateOfBirth ? new Date(candidate.dateOfBirth).toISOString().split('T')[0] : '',
      }
      
      // Set photo previews if exist
      if (candidate.facePhotoUrl) {
        setFacePhotoPreview(candidate.facePhotoUrl)
      }
      if (candidate.fullBodyPhotoUrl) {
        setBodyPhotoPreview(candidate.fullBodyPhotoUrl)
      }
      
      // Explicitly set all form values
      Object.keys(formData).forEach(key => {
        setValue(key, formData[key])
      })
      
      // Also use reset to set default values
      reset(formData)
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
      const response = await api.get('/nationalities')
      const activeNationalities = response.data?.filter((n: any) => n.active) || []
      setNationalities(activeNationalities)
    } catch (err) {
      console.error('Failed to fetch nationalities:', err)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'face' | 'body') => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB')
      return
    }

    try {
      setUploadingPhoto(true)
      
      // Create a local preview immediately
      const previewUrl = URL.createObjectURL(file)
      
      // Show preview immediately
      if (type === 'face') {
        setFacePhotoPreview(previewUrl)
      } else {
        setBodyPhotoPreview(previewUrl)
      }
      
      // Upload to server
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', 'candidate')
      formData.append('entityId', candidateId || 'temp')
      formData.append('documentType', type === 'face' ? 'face-photo' : 'body-photo')
      
      try {
        const response = await api.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        
        // Update form and preview with server URL
        if (type === 'face') {
          setFacePhotoPreview(response.data.url)
          setValue('facePhotoUrl', response.data.url)
        } else {
          setBodyPhotoPreview(response.data.url)
          setValue('fullBodyPhotoUrl', response.data.url)
        }
      } catch (uploadErr: any) {
        // If upload fails, keep the local preview but warn user
        console.error('Photo upload to server failed:', uploadErr)
        // Store the file locally for retry on form submit
        if (type === 'face') {
          setValue('facePhotoFile', file)
        } else {
          setValue('bodyPhotoFile', file)
        }
      }
      
      // Clean up the local preview URL later
      setTimeout(() => URL.revokeObjectURL(previewUrl), 100)
      
    } catch (err: any) {
      console.error('Photo upload error:', err)
      setError('Failed to process photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)
      setError('')
      
      // Clean up the data
      const submitData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        nationality: data.nationality,
        status: data.status,
        education: data.education || null,
        experienceSummary: data.experienceSummary || null,
        photoUrl: data.photoUrl || null,
        facePhotoUrl: data.facePhotoUrl || null,
        fullBodyPhotoUrl: data.fullBodyPhotoUrl || null,
        dateOfBirth: data.dateOfBirth || null,
      }
      
      // Handle skills - convert string to array
      if (data.skills) {
        if (typeof data.skills === 'string') {
          submitData.skills = data.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        } else {
          submitData.skills = data.skills
        }
      } else {
        submitData.skills = []
      }
      
      // Handle agentId - optional, can be null
      if (user?.role === 'SUPER_ADMIN' && data.agentId) {
        submitData.agentId = data.agentId
      }
      
      if (isEditMode && candidateId) {
        await api.put(`/candidates/${candidateId}`, submitData)
      } else {
        await api.post('/candidates', submitData)
      }
      
      navigate('/candidates')
    } catch (err: any) {
      console.error('Submit error:', err)
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
              <Typography variant="h6" gutterBottom>Photos</Typography>
              
              {/* Face Photo */}
              <Box textAlign="center" mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <FaceIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Face Photo
                </Typography>
                <Avatar
                  src={facePhotoPreview || ''}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 1 }}
                >
                  {!facePhotoPreview && <FaceIcon sx={{ fontSize: 40 }} />}
                </Avatar>
                <input
                  type="file"
                  ref={facePhotoRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'face')}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => facePhotoRef.current?.click()}
                  disabled={uploadingPhoto}
                  fullWidth
                >
                  Upload Face
                </Button>
                <Controller
                  name="facePhotoUrl"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="hidden"
                    />
                  )}
                />
              </Box>

              {/* Full Body Photo */}
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <BodyIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Full Body Photo
                </Typography>
                <Avatar
                  src={bodyPhotoPreview || ''}
                  variant="rounded"
                  sx={{ width: 120, height: 160, mx: 'auto', mb: 1 }}
                >
                  {!bodyPhotoPreview && <BodyIcon sx={{ fontSize: 40 }} />}
                </Avatar>
                <input
                  type="file"
                  ref={bodyPhotoRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'body')}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => bodyPhotoRef.current?.click()}
                  disabled={uploadingPhoto}
                  fullWidth
                >
                  Upload Body
                </Button>
                <Controller
                  name="fullBodyPhotoUrl"
                  control={control}
                  defaultValue=""
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
                    defaultValue=""
                    rules={{ required: 'First name is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="First Name"
                        error={!!errors.firstName}
                        helperText={errors.firstName?.message as string}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="lastName"
                    control={control}
                    defaultValue=""
                    rules={{ required: 'Last name is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Last Name"
                        error={!!errors.lastName}
                        helperText={errors.lastName?.message as string}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="nationality"
                    control={control}
                    defaultValue=""
                    rules={{ required: 'Nationality is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        select
                        label="Nationality"
                        error={!!errors.nationality}
                        helperText={errors.nationality?.message as string}
                        value={field.value || ''}
                      >
                        <MenuItem value="">Select nationality</MenuItem>
                        {nationalities.map((nationality) => (
                          <MenuItem key={nationality.id} value={nationality.name}>
                            {nationality.name}
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
                    defaultValue=""
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
                        helperText={errors.status?.message as string}
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
                      defaultValue=""
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          select
                          label="Agent (Optional)"
                          value={field.value || ''}
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
                    defaultValue=""
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
                    defaultValue=""
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
                    defaultValue=""
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
    const pathSegments = window.location.pathname.split('/')
    const id = pathSegments[pathSegments.length - 1]
    if (id && id !== 'new') {
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
            {/* Display both photos if available */}
            <CardMedia
              component="img"
              height="250"
              image={candidate.facePhotoUrl || candidate.photoUrl || '/placeholder-avatar.jpg'}
              alt={`${candidate.firstName} ${candidate.lastName} - Face`}
              sx={{ objectFit: 'cover' }}
            />
            {candidate.fullBodyPhotoUrl && (
              <>
                <Divider />
                <CardMedia
                  component="img"
                  height="300"
                  image={candidate.fullBodyPhotoUrl}
                  alt={`${candidate.firstName} ${candidate.lastName} - Full Body`}
                  sx={{ objectFit: 'cover' }}
                />
              </>
            )}
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
