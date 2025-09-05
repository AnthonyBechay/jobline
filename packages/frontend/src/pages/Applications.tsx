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
  Autocomplete,
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
  [ApplicationStatus.CANCELLED_PRE_ARRIVAL]: {
    next: null,
    label: 'Cancelled (Pre-Arrival)',
    shortLabel: 'Cancelled',
    icon: <WarningIcon />,
    color: 'error' as const,
  },
  [ApplicationStatus.CANCELLED_POST_ARRIVAL]: {
    next: null,
    label: 'Cancelled (Post-Arrival)',
    shortLabel: 'Cancelled',
    icon: <WarningIcon />,
    color: 'error' as const,
  },
  [ApplicationStatus.CANCELLED_CANDIDATE]: {
    next: null,
    label: 'Cancelled (Candidate)',
    shortLabel: 'Cancelled',
    icon: <WarningIcon />,
    color: 'error' as const,
  },
}

// Predefined filter groups
const filterPresets: Record<string, {
  label: string
  icon: React.ReactElement
  description: string
  statuses: ApplicationStatus[]
  dateFilter?: { days: number } // Added date filter option
}> = {
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
  'arrived': {
    label: 'Arrived',
    icon: <ArrivalIcon />,
    description: 'Workers who have arrived',
    statuses: [
      ApplicationStatus.WORKER_ARRIVED,
    ],
  },
  'paperwork': {
    label: 'Paperwork has started',
    icon: <PaperworkIcon />,
    description: 'Processing documents and permits',
    statuses: [
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
    dateFilter: { days: 30 } // Last 30 days by default
  },

}

// Application Card Component
const ApplicationCard = ({ application, onView, onEdit, onCopyLink }: any) => {
  const theme = useTheme()
  const statusInfo = statusWorkflow[application.status as ApplicationStatus] || {
    shortLabel: 'Unknown',
    color: 'default' as const,
    icon: <WarningIcon />,
  }
  
  return (
    <Card 
      sx={{ 
        borderRadius: 2,
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        }
      }}
    >
      <CardActionArea onClick={() => onView(application.id)}>
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" fontSize="0.75rem">
                #{application.id.substring(0, 8).toUpperCase()}
              </Typography>
              <Chip
                label={application.type.replace(/_/g, ' ')}
                size="small"
                color={application.type === ApplicationType.NEW_CANDIDATE ? 'primary' : 'secondary'}
                sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
              />
            </Box>
            <Chip
              label={statusInfo.shortLabel}
              color={statusInfo.color}
              size="small"
              icon={statusInfo.icon}
              sx={{ height: 24 }}
            />
          </Box>
          
          <Divider sx={{ my: 1.5 }} />
          
          <Box display="flex" alignItems="center" mb={0.75}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', mr: 1 }}>
              <BusinessIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Box flex={1} overflow="hidden">
              <Typography variant="body2" fontWeight="medium" noWrap>
                {application.client?.name || 'Unknown Client'}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" mb={1.5}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.light', mr: 1 }}>
              <PersonIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Box flex={1} overflow="hidden">
              <Typography variant="body2" fontWeight="medium" noWrap>
                {`${application.candidate?.firstName || ''} ${application.candidate?.lastName || ''}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                {application.candidate?.nationality || 'Unknown'}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
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
                  sx={{ p: 0.5 }}
                >
                  <LinkIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(application.id)
                  }}
                  sx={{ p: 0.5 }}
                >
                  <EditIcon sx={{ fontSize: 18 }} />
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(12)
  const [totalRows, setTotalRows] = useState(0)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [isChangingFilter, setIsChangingFilter] = useState(false)

  useEffect(() => {
    // Apply default filter on mount
    const preset = filterPresets['pre-arrival']
    fetchApplicationsWithPreset(preset.statuses, preset.dateFilter)
  }, [])

  useEffect(() => {
    if (filterPreset && filterPreset !== 'custom') {
      const preset = filterPresets[filterPreset as keyof typeof filterPresets]
      if (preset.statuses.length > 0 || preset.dateFilter) {
        fetchApplicationsWithPreset(preset.statuses, preset.dateFilter)
      } else {
        fetchApplicationsWithPreset([], undefined)
      }
    }
  }, [filterPreset, page, pageSize])


  const fetchApplicationsWithPreset = async (statuses: ApplicationStatus[], dateFilter?: { days: number }) => {
    try {
      if (!isChangingFilter) {
        setLoading(true)
      }
      const params = new URLSearchParams()
      params.append('page', (page + 1).toString())
      params.append('limit', pageSize.toString())
      
      // Add multiple status filters
      if (statuses.length > 0) {
        statuses.filter(status => status).forEach(status => {
          params.append('status', status)
        })
      }

      // Add date filter if specified
      if (dateFilter) {
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - dateFilter.days)
        params.append('fromDate', fromDate.toISOString())
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
      setIsChangingFilter(false)
    }
  }


  const handleCopyLink = (shareableLink: string) => {
    const fullUrl = `${window.location.origin}/status/${shareableLink}`
    navigator.clipboard.writeText(fullUrl)
    setSnackbarMessage('Client link copied to clipboard')
    setSnackbarOpen(true)
  }

  const handlePresetChange = (preset: string) => {
    setIsChangingFilter(true)
    setFilterPreset(preset)
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
        const statusInfo = statusWorkflow[params.value as ApplicationStatus] || {
          label: 'Unknown',
          color: 'default' as const,
          icon: <WarningIcon />,
        }
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
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation()
              handleCopyLink(params.value)
            }}
          >
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
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={() => {
                // TODO: Navigate to history search page
                console.log('Navigate to history search')
              }}
              sx={{ borderRadius: 2 }}
            >
              History Search
            </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/applications/new')}
            sx={{ borderRadius: 2 }}
          >
            New Application
          </Button>
          </Stack>
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
                  <Box display="flex" alignItems="center">
                    <Box display="flex" flexDirection="column" alignItems="center" mr={2}>
                      <Badge 
                        badgeContent={loading ? 0 : appCount} 
                        color="primary"
                        overlap="circular"
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                      >
                        <Avatar 
                          sx={{ 
                            bgcolor: isActive ? 'primary.main' : 'action.hover',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {preset.icon}
                        </Avatar>
                      </Badge>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight="medium">
                        {preset.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {preset.description}
                      </Typography>
                      {preset.dateFilter && (
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                          Last {preset.dateFilter.days} days
                        </Typography>
                      )}
                    </Box>
                    {loading && (
                      <CircularProgress size={20} sx={{ ml: 1 }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Show Cancelled Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<WarningIcon />}
          onClick={() => {
            const cancelledStatuses = [
              ApplicationStatus.CANCELLED_PRE_ARRIVAL,
              ApplicationStatus.CANCELLED_POST_ARRIVAL,
              ApplicationStatus.CANCELLED_CANDIDATE,
            ]
            fetchApplicationsWithPreset(cancelledStatuses)
            setFilterPreset('custom')
          }}
          sx={{ borderRadius: 2 }}
        >
          Show Cancelled Applications
        </Button>
      </Box>

      {/* View Mode Toggle */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
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

      {/* Applications Display */}
      {loading && !isChangingFilter ? (
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
      ) : viewMode === 'grid' ? (
        <Fade in={!loading || isChangingFilter} timeout={300}>
          <Grid container spacing={3} sx={{ minHeight: 400 }}>
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

// Application Form Component (updated)
const ApplicationForm = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [availableInLebanonCandidates, setAvailableInLebanonCandidates] = useState<Candidate[]>([])
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [feeTemplates, setFeeTemplates] = useState<any[]>([])
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>({
    defaultValues: {
      createdAt: new Date().toISOString().split('T')[0], // Default to today
      type: ApplicationType.NEW_CANDIDATE,
    }
  })

  const selectedCandidateId = watch('candidateId')
  const selectedClientId = watch('clientId')
  
  // Auto-determine application type based on candidate status and previous applications
  const [applicationType, setApplicationType] = useState<ApplicationType>(ApplicationType.NEW_CANDIDATE)
  const [candidatePreviousApplications, setCandidatePreviousApplications] = useState<any[]>([])

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

  useEffect(() => {
    // Auto-determine application type when candidate is selected
    if (selectedCandidateId) {
      determineApplicationType(selectedCandidateId)
    }
  }, [selectedCandidateId])

  const determineApplicationType = async (candidateId: string) => {
    try {
      // Fetch candidate's previous applications
      const response = await api.get(`/candidates/${candidateId}/applications`)
      const previousApplications = response.data || []
      setCandidatePreviousApplications(previousApplications)
      
      // Find the candidate
      const candidate = [...candidates, ...availableInLebanonCandidates].find(c => c.id === candidateId)
      
      if (!candidate) return
      
      // Determine type based on candidate status and previous applications
      if (candidate.status === CandidateStatus.AVAILABLE_IN_LEBANON && previousApplications.length > 0) {
        // Candidate is in Lebanon and has previous applications - this is a guarantor change
        setApplicationType(ApplicationType.GUARANTOR_CHANGE)
        setValue('type', ApplicationType.GUARANTOR_CHANGE)
        
        // Auto-populate the "From Client" field with the most recent application's client
        const mostRecentApplication = previousApplications[0] // Assuming they're sorted by date
        if (mostRecentApplication?.clientId) {
          setValue('fromClientId', mostRecentApplication.clientId)
        }
      } else if (candidate.status === CandidateStatus.AVAILABLE_ABROAD) {
        // Candidate is abroad - this is a new application
        setApplicationType(ApplicationType.NEW_CANDIDATE)
        setValue('type', ApplicationType.NEW_CANDIDATE)
      } else {
        // Default to new candidate
        setApplicationType(ApplicationType.NEW_CANDIDATE)
        setValue('type', ApplicationType.NEW_CANDIDATE)
      }
    } catch (error) {
      console.error('Failed to determine application type:', error)
      // Default to new candidate on error
      setApplicationType(ApplicationType.NEW_CANDIDATE)
      setValue('type', ApplicationType.NEW_CANDIDATE)
    }
  }

  const fetchData = async () => {
    try {
      const [clientsRes, candidatesRes, candidatesInLebanonRes] = await Promise.all([
        api.get<PaginatedResponse<Client>>('/clients?limit=100'),
        api.get<PaginatedResponse<Candidate>>('/candidates?limit=100&status=' + CandidateStatus.AVAILABLE_ABROAD),
        api.get<PaginatedResponse<Candidate>>('/candidates?limit=100&status=' + CandidateStatus.AVAILABLE_IN_LEBANON),
      ])
      setClients(clientsRes.data?.data || [])
      setCandidates(candidatesRes.data?.data || [])
      setAvailableInLebanonCandidates(candidatesInLebanonRes.data?.data || [])
      
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
      setAvailableInLebanonCandidates([])
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
      // Clean up data before sending and include auto-determined type
      const cleanData = {
        ...data,
        type: applicationType, // Use auto-determined type
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
            {/* Application Type Display */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Application Type: {applicationType === ApplicationType.NEW_CANDIDATE ? 'New Application' : 'Guarantor Change'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {applicationType === ApplicationType.NEW_CANDIDATE 
                    ? 'This will create a new application for a candidate from abroad.'
                    : 'This will create a guarantor change process for a candidate already in Lebanon.'}
                </Typography>
              </Alert>
            </Grid>

            {/* Conditional Paperwork Information for Guarantor Change */}
            {applicationType === ApplicationType.GUARANTOR_CHANGE && (
              <Grid item xs={12}>
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Conditional Paperwork Requirements
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    The paperwork requirements will be determined based on the original application's completion status:
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="medium">
                      If original paperwork was NOT completed:
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2, mt: 0.5 }}>
                      • The new client's application must include the remaining standard steps PLUS new transfer steps before the others: Relinquish, Commitment, Transfer of Sponsorship, Certificate of Deposit.
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      If original paperwork WAS completed:
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2, mt: 0.5 }}>
                      • The new client's application only requires the transfer steps: Relinquish, Commitment, Transfer of Sponsorship, Certificate of Deposit.
                    </Typography>
                  </Box>
                </Alert>
              </Grid>
            )}
            
            {/* Date Field */}
            <Grid item xs={12} md={6}>
              <Controller
                name="createdAt"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="date"
                    label="Application Date"
                    InputLabelProps={{ shrink: true }}
                    helperText="Set a custom date for backdated applications"
                  />
                )}
              />
            </Grid>
            
            
            {/* Client Selection - Auto-determined based on application type */}
            <Grid item xs={12} md={applicationType === ApplicationType.GUARANTOR_CHANGE ? 6 : 12}>
              <Controller
                name="clientId"
                control={control}
                rules={{ required: applicationType === ApplicationType.GUARANTOR_CHANGE ? 'To Client is required' : 'Client is required' }}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    fullWidth
                    options={clients}
                    getOptionLabel={(client) => client.name}
                    value={clients.find(c => c.id === field.value) || null}
                    onChange={(_, newValue) => {
                      field.onChange(newValue?.id || '')
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={applicationType === ApplicationType.GUARANTOR_CHANGE ? "To Client (New Guarantor)" : "Client"}
                        placeholder="Type to search clients..."
                    error={!!errors.clientId}
                    helperText={errors.clientId?.message as string}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    )}
                    renderOption={(props, client) => (
                        <Box component="li" {...props}>
                          {client.name}
                        </Box>
                      )}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    noOptionsText="No clients found"
                  />
                )}
              />
            </Grid>
            
            {/* From Client - Only for Guarantor Change */}
            {applicationType === ApplicationType.GUARANTOR_CHANGE && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="fromClientId"
                  control={control}
                  rules={{ required: 'From Client is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      fullWidth
                      options={clients}
                      getOptionLabel={(client) => client.name}
                      value={clients.find(c => c.id === field.value) || null}
                      onChange={(_, newValue) => {
                        field.onChange(newValue?.id || '')
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="From Client (Previous Guarantor)"
                          placeholder="Type to search clients..."
                      error={!!errors.fromClientId}
                      helperText={errors.fromClientId?.message as string}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      )}
                      renderOption={(props, client) => (
                        <Box component="li" {...props}>
                          {client.name}
                        </Box>
                      )}
                      isOptionEqualToValue={(option, value) => option.id === value?.id}
                      noOptionsText="No clients found"
                    />
                  )}
                />
              </Grid>
            )}
            
            {/* Candidate Selection */}
            <Grid item xs={12} md={6}>
              <Controller
                name="candidateId"
                control={control}
                rules={{ required: 'Candidate is required' }}
                render={({ field }) => {
                  // Show ALL available candidates (both abroad and in Lebanon)
                  const allCandidates = [...candidates, ...availableInLebanonCandidates]
                  
                  return (
                    <Autocomplete
                      {...field}
                      fullWidth
                      options={allCandidates}
                      getOptionLabel={(candidate) => `${candidate.firstName} ${candidate.lastName} - ${candidate.nationality}`}
                      value={allCandidates.find(c => c.id === field.value) || null}
                      onChange={(_, newValue) => {
                        field.onChange(newValue?.id || '')
                        // Auto-determine application type based on selected candidate
                        if (newValue) {
                          const isInLebanon = availableInLebanonCandidates.some(c => c.id === newValue.id)
                          const newApplicationType = isInLebanon ? ApplicationType.GUARANTOR_CHANGE : ApplicationType.NEW_CANDIDATE
                          setApplicationType(newApplicationType)
                          setValue('type', newApplicationType)
                        }
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Candidate"
                          placeholder="Type to search candidates..."
                          error={!!errors.candidateId}
                          helperText={errors.candidateId?.message as string}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      )}
                      renderOption={(props, candidate) => {
                        const isInLebanon = availableInLebanonCandidates.some(c => c.id === candidate.id)
                        return (
                          <Box component="li" {...props}>
                            {candidate.firstName} {candidate.lastName} - {candidate.nationality}
                            {isInLebanon && (
                              <Chip 
                                label="In Lebanon" 
                                size="small" 
                                color="success" 
                                sx={{ ml: 1, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        )
                      }}
                      isOptionEqualToValue={(option, value) => option.id === value?.id}
                      noOptionsText="No candidates found"
                    />
                  )
                }}
              />
            </Grid>
            
            {/* Broker Selection - Optional */}
            {user?.role === UserRole.SUPER_ADMIN && (
              <Grid item xs={12} md={6}>
                <Controller
                  name="brokerId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Broker (Optional)"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (value) => {
                          if (!value) return ''
                          const broker = brokers.find(b => b.id === value)
                          return broker ? broker.name : ''
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em>No broker selected</em>
                      </MenuItem>
                      {brokers.map((broker) => (
                        <MenuItem key={broker.id} value={broker.id}>
                          {broker.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            )}
            
            {/* Note about Brokers */}
            {user?.role === UserRole.SUPER_ADMIN && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    Brokers can be assigned now or later when editing the application. This is optional and can be changed at any time.
                  </Typography>
                </Alert>
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
