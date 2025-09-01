import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
  alpha,
  useTheme,
  CardActionArea,
  Avatar,
  Divider,
  InputAdornment,
  Fade,
  CircularProgress,
  Snackbar,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Link as LinkIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as PendingIcon,
  Send as SendIcon,
  AttachMoney as MoneyIcon,
  Description as DocumentIcon,
  Warning as WarningIcon,
  Flight as FlightIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  InsertDriveFile as FileIcon,
  FilterList as FilterIcon,
  ViewList as ListIcon,
  ViewModule as CardIcon,
  LocalShipping as ArrivalIcon,
  Assignment as PaperworkIcon,
  CheckCircleOutline as CompleteIcon,
  Search as SearchIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { 
  Application, 
  ApplicationStatus, 
  ApplicationType,
  Client,
  Candidate,
  CandidateStatus,
  DocumentChecklistItem,
  DocumentStatus,
  PaginatedResponse,
  Broker,
  Payment,
  Cost,
  CostTypeModel,
  UserRole
} from '../shared/types'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import ApplicationDetails from '../components/ApplicationDetails'

// Status workflow mapping
const statusWorkflow = {
  [ApplicationStatus.PENDING_MOL]: {
    next: ApplicationStatus.MOL_AUTH_RECEIVED,
    label: 'MoL Pre-Authorization',
    shortLabel: 'MoL Auth',
    icon: <DocumentIcon />,
    color: 'warning' as const,
  },
  [ApplicationStatus.MOL_AUTH_RECEIVED]: {
    next: ApplicationStatus.VISA_PROCESSING,
    label: 'MoL Authorization Received',
    shortLabel: 'MoL Done',
    icon: <CheckIcon />,
    color: 'success' as const,
  },
  [ApplicationStatus.VISA_PROCESSING]: {
    next: ApplicationStatus.VISA_RECEIVED,
    label: 'Visa Processing',
    shortLabel: 'Visa Process',
    icon: <DocumentIcon />,
    color: 'info' as const,
  },
  [ApplicationStatus.VISA_RECEIVED]: {
    next: ApplicationStatus.WORKER_ARRIVED,
    label: 'Visa Received',
    shortLabel: 'Visa Done',
    icon: <FlightIcon />,
    color: 'success' as const,
  },
  [ApplicationStatus.WORKER_ARRIVED]: {
    next: ApplicationStatus.LABOUR_PERMIT_PROCESSING,
    label: 'Worker Arrived',
    shortLabel: 'Arrived',
    icon: <HomeIcon />,
    color: 'success' as const,
  },
  [ApplicationStatus.LABOUR_PERMIT_PROCESSING]: {
    next: ApplicationStatus.RESIDENCY_PERMIT_PROCESSING,
    label: 'Labour Permit Processing',
    shortLabel: 'Labour Permit',
    icon: <DocumentIcon />,
    color: 'info' as const,
  },
  [ApplicationStatus.RESIDENCY_PERMIT_PROCESSING]: {
    next: ApplicationStatus.ACTIVE_EMPLOYMENT,
    label: 'Residency Permit Processing',
    shortLabel: 'Residency',
    icon: <DocumentIcon />,
    color: 'info' as const,
  },
  [ApplicationStatus.ACTIVE_EMPLOYMENT]: {
    next: null,
    label: 'Active Employment',
    shortLabel: 'Active',
    icon: <CheckIcon />,
    color: 'success' as const,
  },
  [ApplicationStatus.CONTRACT_ENDED]: {
    next: null,
    label: 'Contract Ended',
    shortLabel: 'Ended',
    icon: <CheckIcon />,
    color: 'default' as const,
  },
  [ApplicationStatus.RENEWAL_PENDING]: {
    next: ApplicationStatus.ACTIVE_EMPLOYMENT,
    label: 'Renewal Pending',
    shortLabel: 'Renewal',
    icon: <WarningIcon />,
    color: 'warning' as const,
  },
}

// Predefined filter groups
const filterPresets = {
  'pre-arrival': {
    label: 'Pre-Arrival',
    icon: <FlightIcon />,
    description: 'Applications before worker arrival',
    statuses: [
      ApplicationStatus.PENDING_MOL,
      ApplicationStatus.MOL_AUTH_RECEIVED,
      ApplicationStatus.VISA_PROCESSING,
      ApplicationStatus.VISA_RECEIVED,
    ],
  },
  'paperwork': {
    label: 'Paperwork in Progress',
    icon: <PaperworkIcon />,
    description: 'Workers arrived, processing documents',
    statuses: [
      ApplicationStatus.WORKER_ARRIVED,
      ApplicationStatus.LABOUR_PERMIT_PROCESSING,
      ApplicationStatus.RESIDENCY_PERMIT_PROCESSING,
    ],
  },
  'complete': {
    label: 'Completed',
    icon: <CompleteIcon />,
    description: 'Active employment and completed',
    statuses: [
      ApplicationStatus.ACTIVE_EMPLOYMENT,
      ApplicationStatus.CONTRACT_ENDED,
    ],
  },
  'all': {
    label: 'All Applications',
    icon: <ListIcon />,
    description: 'View all applications',
    statuses: [],
  },
}

// Application Card Component
const ApplicationCard = ({ application, onView, onEdit, onCopyLink }: any) => {
  const theme = useTheme()
  const statusInfo = statusWorkflow[application.status as ApplicationStatus]
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        borderRadius: 2,
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        }
      }}
    >
      <CardActionArea onClick={() => onView(application.id)}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                #{application.id.substring(0, 8).toUpperCase()}
              </Typography>
              <Chip
                label={application.type.replace(/_/g, ' ')}
                size="small"
                color={application.type === ApplicationType.NEW_CANDIDATE ? 'primary' : 'secondary'}
                sx={{ mt: 0.5 }}
              />
            </Box>
            <Chip
              label={statusInfo.shortLabel}
              color={statusInfo.color}
              size="small"
              icon={statusInfo.icon}
            />
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box display="flex" alignItems="center" mb={1}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', mr: 1 }}>
              <BusinessIcon fontSize="small" />
            </Avatar>
            <Box flex={1}>
              <Typography variant="body2" fontWeight="medium">
                {application.client?.name || 'Unknown Client'}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.light', mr: 1 }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Box flex={1}>
              <Typography variant="body2" fontWeight="medium">
                {`${application.candidate?.firstName || ''} ${application.candidate?.lastName || ''}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {application.candidate?.nationality || 'Unknown'}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              {new Date(application.createdAt).toLocaleDateString()}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Copy client link">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onCopyLink(application.shareableLink)
                  }}
                >
                  <LinkIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(application.id)
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

// Application List Component
const ApplicationList = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const theme = useTheme()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterPreset, setFilterPreset] = useState<string>('pre-arrival') // Default filter
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<ApplicationType | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(12)
  const [totalRows, setTotalRows] = useState(0)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)

  useEffect(() => {
    // Apply default filter on mount
    const preset = filterPresets['pre-arrival']
    fetchApplicationsWithPreset(preset.statuses)
  }, [])

  useEffect(() => {
    if (filterPreset && filterPreset !== 'custom') {
      const preset = filterPresets[filterPreset as keyof typeof filterPresets]
      if (preset.statuses.length > 0) {
        fetchApplicationsWithPreset(preset.statuses)
      } else {
        fetchApplications()
      }
    }
  }, [filterPreset, page, pageSize])

  useEffect(() => {
    if (statusFilter || typeFilter || searchQuery) {
      setFilterPreset('custom')
      fetchApplications()
    }
  }, [statusFilter, typeFilter, searchQuery])

  const fetchApplicationsWithPreset = async (statuses: ApplicationStatus[]) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', (page + 1).toString())
      params.append('limit', pageSize.toString())
      
      // Add multiple status filters
      if (statuses.length > 0) {
        statuses.forEach(status => {
          params.append('status', status)
        })
      }

      const response = await api.get<any>(`/applications?${params}`)
      const applications = response.data.applications || response.data.data || []
      const pagination = response.data.pagination || { total: 0 }
      
      setApplications(applications)
      setTotalRows(pagination.total)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', (page + 1).toString())
      params.append('limit', pageSize.toString())
      if (statusFilter) params.append('status', statusFilter)
      if (typeFilter) params.append('type', typeFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await api.get<any>(`/applications?${params}`)
      const applications = response.data.applications || response.data.data || []
      const pagination = response.data.pagination || { total: 0 }
      
      setApplications(applications)
      setTotalRows(pagination.total)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (shareableLink: string) => {
    const fullUrl = `${window.location.origin}/status/${shareableLink}`
    navigator.clipboard.writeText(fullUrl)
    setSnackbarMessage('Client link copied to clipboard')
    setSnackbarOpen(true)
  }

  const handlePresetChange = (preset: string) => {
    setFilterPreset(preset)
    setStatusFilter('')
    setTypeFilter('')
    setSearchQuery('')
    setPage(0)
  }

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 100,
      renderCell: (params) => params.value.substring(0, 8).toUpperCase()
    },
    {
      field: 'client',
      headerName: 'Client',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => params.row.client?.name || '-'
    },
    {
      field: 'candidate',
      headerName: 'Candidate',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => 
        `${params.row.candidate?.firstName || ''} ${params.row.candidate?.lastName || ''}`
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value.replace(/_/g, ' ')}
          color={params.value === ApplicationType.NEW_CANDIDATE ? 'primary' : 'secondary'}
          size="small"
        />
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 200,
      renderCell: (params) => {
        const statusInfo = statusWorkflow[params.value as ApplicationStatus]
        return (
          <Chip
            label={statusInfo.label}
            color={statusInfo.color}
            size="small"
            icon={statusInfo.icon}
          />
        )
      }
    },
    {
      field: 'shareableLink',
      headerName: 'Client Link',
      width: 100,
      renderCell: (params) => (
        <Tooltip title="Copy client status link">
          <IconButton size="small" onClick={() => handleCopyLink(params.value)}>
            <LinkIcon />
          </IconButton>
        </Tooltip>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => navigate(`/applications/${params.row.id}`)}>
            <ViewIcon />
          </IconButton>
          <IconButton size="small" onClick={() => navigate(`/applications/edit/${params.row.id}`)}>
            <EditIcon />
          </IconButton>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          borderRadius: 3,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary.dark">
              Applications
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Manage all recruitment applications
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/applications/new')}
            sx={{ borderRadius: 2 }}
          >
            New Application
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filter Presets */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(filterPresets).map(([key, preset]) => {
          const isActive = filterPreset === key
          const appCount = key === 'all' 
            ? totalRows 
            : applications.filter(app => preset.statuses.includes(app.status)).length
          
          return (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <Card 
                sx={{ 
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  border: isActive ? 2 : 1,
                  borderColor: isActive ? 'primary.main' : 'divider',
                  bgcolor: isActive ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
                  '&:hover': {
                    boxShadow: 2,
                    borderColor: 'primary.main',
                  }
                }}
                onClick={() => handlePresetChange(key)}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                      <Avatar 
                        sx={{ 
                          bgcolor: isActive ? 'primary.main' : 'action.hover',
                          width: 40,
                          height: 40,
                          mr: 2
                        }}
                      >
                        {preset.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {preset.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {preset.description}
                        </Typography>
                      </Box>
                    </Box>
                    {loading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Badge badgeContent={appCount} color="primary" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Advanced Filters & Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {Object.values(ApplicationStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {statusWorkflow[status].label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type Filter</InputLabel>
              <Select
                value={typeFilter}
                label="Type Filter"
                onChange={(e) => setTypeFilter(e.target.value as ApplicationType | '')}
              >
                <MenuItem value="">All Types</MenuItem>
                {Object.values(ApplicationType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="grid">
                  <CardIcon />
                </ToggleButton>
                <ToggleButton value="list">
                  <ListIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Applications Display */}
      {loading ? (
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
      ) : viewMode === 'grid' ? (
        <Fade in={!loading}>
          <Grid container spacing={3}>
            {applications.map((application) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={application.id}>
                <ApplicationCard
                  application={application}
                  onView={(id: string) => navigate(`/applications/${id}`)}
                  onEdit={(id: string) => navigate(`/applications/edit/${id}`)}
                  onCopyLink={handleCopyLink}
                />
              </Grid>
            ))}
          </Grid>
        </Fade>
      ) : (
        <Paper sx={{ height: 600, width: '100%', borderRadius: 2 }}>
          <DataGrid
            rows={applications || []}
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
            disableRowSelectionOnClick
            onRowClick={(params) => navigate(`/applications/${params.row.id}`)}
            sx={{
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          />
        </Paper>
      )}
    {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  )
}

// Application Form Component (kept the same)
const ApplicationForm = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [feeTemplates, setFeeTemplates] = useState<any[]>([])
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>()

  const selectedType = watch('type')
  const selectedCandidateId = watch('candidateId')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Auto-select fee template based on candidate nationality
    if (selectedCandidateId && candidates.length > 0) {
      const candidate = candidates.find(c => c.id === selectedCandidateId)
      if (candidate?.nationality) {
        fetchFeeTemplates(candidate.nationality)
      }
    }
  }, [selectedCandidateId, candidates])

  const fetchData = async () => {
    try {
      const [clientsRes, candidatesRes] = await Promise.all([
        api.get<PaginatedResponse<Client>>('/clients?limit=100'),
        api.get<PaginatedResponse<Candidate>>('/candidates?limit=100&status=' + CandidateStatus.AVAILABLE_ABROAD),
      ])
      setClients(clientsRes.data?.data || [])
      setCandidates(candidatesRes.data?.data || [])
      
      if (user?.role === UserRole.SUPER_ADMIN) {
        try {
          const brokersRes = await api.get<Broker[]>('/brokers')
          setBrokers(brokersRes.data || [])
        } catch {
          setBrokers([])
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setClients([])
      setCandidates([])
      setBrokers([])
    }
  }

  const fetchFeeTemplates = async (nationality?: string) => {
    try {
      const params = nationality ? `?nationality=${nationality}` : ''
      const response = await api.get(`/applications/fee-templates/available${params}`)
      setFeeTemplates(response.data || [])
      
      // Auto-select nationality-specific template if available
      if (nationality && response.data?.length > 0) {
        const nationalityTemplate = response.data.find((t: any) => t.nationality === nationality)
        if (nationalityTemplate) {
          setValue('feeTemplateId', nationalityTemplate.id)
          setValue('finalFeeAmount', nationalityTemplate.defaultPrice)
        }
      }
    } catch (err) {
      console.error('Failed to fetch fee templates:', err)
      setFeeTemplates([])
    }
  }

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)
      // Clean up data before sending
      const cleanData = {
        ...data,
        brokerId: data.brokerId || null, // Convert empty string to null
      }
      const response = await api.post('/applications', cleanData)
      navigate(`/applications/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">New Application</Typography>
        <Button variant="outlined" onClick={() => navigate('/applications')}>
          Back to List
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="type"
                control={control}
                defaultValue={ApplicationType.NEW_CANDIDATE}
                rules={{ required: 'Application type is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Application Type"
                    error={!!errors.type}
                    helperText={errors.type?.message as string}
                  >
                    {Object.values(ApplicationType).map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="clientId"
                control={control}
                rules={{ required: 'Client is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Client"
                    error={!!errors.clientId}
                    helperText={errors.clientId?.message as string}
                  >
                    <MenuItem value="">Select a client</MenuItem>
                    {clients && clients.length > 0 && clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="candidateId"
                control={control}
                rules={{ required: 'Candidate is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    select
                    label="Candidate"
                    error={!!errors.candidateId}
                    helperText={errors.candidateId?.message as string}
                  >
                    <MenuItem value="">Select a candidate</MenuItem>
                    {candidates && candidates.length > 0 && candidates.map((candidate) => (
                      <MenuItem key={candidate.id} value={candidate.id}>
                        {candidate.firstName} {candidate.lastName} - {candidate.nationality}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            {user?.role === UserRole.SUPER_ADMIN && (
              <Grid item xs={12} md={6}>
                <Controller
                name="brokerId"
                control={control}
                defaultValue=""
                render={({ field }) => (
                <TextField
                {...field}
                fullWidth
                select
                label="Broker (Optional)"
                value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                      >
                      <MenuItem value="">None</MenuItem>
                      {brokers && brokers.length > 0 && brokers.map((broker) => (
                        <MenuItem key={broker.id} value={broker.id}>
                          {broker.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}
            
            {/* Fee Template Selection */}
            {feeTemplates.length > 0 && (
              <>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="feeTemplateId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        select
                        label="Fee Template"
                        helperText="Auto-selected based on nationality when available"
                      >
                        <MenuItem value="">No template</MenuItem>
                        {feeTemplates.map((template) => (
                          <MenuItem key={template.id} value={template.id}>
                            {template.name} 
                            {template.nationality && ` (${template.nationality})`}
                            - ${template.defaultPrice}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="finalFeeAmount"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Final Fee Amount"
                        helperText="Adjust the fee within template limits"
                        InputProps={{
                          startAdornment: '$',
                        }}
                      />
                    )}
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => navigate('/applications')}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Application'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

// Main Applications Component with Routes
const Applications = () => {
  return (
    <Routes>
      <Route index element={<ApplicationList />} />
      <Route path="new" element={<ApplicationForm />} />
      <Route path="edit/:id" element={<ApplicationForm />} />
      <Route path=":id" element={<ApplicationDetails />} />
    </Routes>
  )
}

export default Applications
