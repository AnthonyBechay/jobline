import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Category as CategoryIcon,
  Business as ServiceIcon,
  Flag as FlagIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { CostTypeModel, ServiceType } from '../../shared/types'
import api from '../../services/api'

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
      id={`list-values-tabpanel-${index}`}
      aria-labelledby={`list-values-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

interface Nationality {
  id: string
  code: string
  name: string
  active: boolean
}

interface ListOfValuesProps {
  onBack: () => void
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

const ListOfValues = ({ onBack, onError, onSuccess }: ListOfValuesProps) => {
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(false)

  // Service Types State
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [serviceTypeDialog, setServiceTypeDialog] = useState(false)
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null)

  // Cost Types State
  const [costTypes, setCostTypes] = useState<CostTypeModel[]>([])
  const [costTypeDialog, setCostTypeDialog] = useState(false)
  const [editingCostType, setEditingCostType] = useState<CostTypeModel | null>(null)

  // Nationalities State
  const [nationalities, setNationalities] = useState<Nationality[]>([])
  const [nationalityDialog, setNationalityDialog] = useState(false)
  const [editingNationality, setEditingNationality] = useState<Nationality | null>(null)

  const { control: serviceTypeControl, handleSubmit: handleServiceTypeSubmit, reset: resetServiceType, setValue: setServiceTypeValue } = useForm()
  const { control: costTypeControl, handleSubmit: handleCostTypeSubmit, reset: resetCostType, setValue: setCostTypeValue } = useForm()
  const { control: nationalityControl, handleSubmit: handleNationalitySubmit, reset: resetNationality, setValue: setNationalityValue } = useForm()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchServiceTypes(),
        fetchCostTypes(),
        fetchNationalities(),
      ])
    } catch (err) {
      onError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  // Service Types CRUD
  const fetchServiceTypes = async () => {
    try {
      const response = await api.get<ServiceType[]>('/service-types')
      setServiceTypes(response.data || [])
    } catch (err) {
      console.error('Failed to fetch service types:', err)
    }
  }

  const handleSaveServiceType = async (data: any) => {
    try {
      if (editingServiceType) {
        await api.put(`/service-types/${editingServiceType.id}`, data)
        onSuccess('Service type updated successfully')
      } else {
        await api.post('/service-types', data)
        onSuccess('Service type created successfully')
      }
      setServiceTypeDialog(false)
      resetServiceType()
      setEditingServiceType(null)
      fetchServiceTypes()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to save service type')
    }
  }

  const handleDeleteServiceType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service type?')) return
    try {
      await api.delete(`/service-types/${id}`)
      onSuccess('Service type deleted successfully')
      fetchServiceTypes()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to delete service type')
    }
  }

  const openEditServiceType = (serviceType: ServiceType) => {
    setEditingServiceType(serviceType)
    setServiceTypeValue('name', serviceType.name)
    setServiceTypeValue('description', serviceType.description)
    setServiceTypeValue('active', serviceType.active)
    setServiceTypeDialog(true)
  }

  // Cost Types CRUD
  const fetchCostTypes = async () => {
    try {
      const response = await api.get<CostTypeModel[]>('/cost-types')
      setCostTypes(response.data || [])
    } catch (err) {
      console.error('Failed to fetch cost types:', err)
    }
  }

  const handleSaveCostType = async (data: any) => {
    try {
      if (editingCostType) {
        await api.put(`/cost-types/${editingCostType.id}`, data)
        onSuccess('Cost type updated successfully')
      } else {
        await api.post('/cost-types', data)
        onSuccess('Cost type created successfully')
      }
      setCostTypeDialog(false)
      resetCostType()
      setEditingCostType(null)
      fetchCostTypes()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to save cost type')
    }
  }

  const handleDeleteCostType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cost type?')) return
    try {
      await api.delete(`/cost-types/${id}`)
      onSuccess('Cost type deleted successfully')
      fetchCostTypes()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to delete cost type')
    }
  }

  const openEditCostType = (costType: CostTypeModel) => {
    setEditingCostType(costType)
    setCostTypeValue('name', costType.name)
    setCostTypeValue('description', costType.description)
    setCostTypeValue('active', costType.active)
    setCostTypeDialog(true)
  }

  // Nationalities CRUD
  const fetchNationalities = async () => {
    try {
      const response = await api.get<Nationality[]>('/nationalities')
      setNationalities(response.data || [])
    } catch (err) {
      console.error('Failed to fetch nationalities:', err)
    }
  }

  const handleSaveNationality = async (data: any) => {
    try {
      if (editingNationality) {
        await api.put(`/nationalities/${editingNationality.id}`, data)
        onSuccess('Nationality updated successfully')
      } else {
        await api.post('/nationalities', data)
        onSuccess('Nationality created successfully')
      }
      setNationalityDialog(false)
      resetNationality()
      setEditingNationality(null)
      fetchNationalities()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to save nationality')
    }
  }

  const handleDeleteNationality = async (id: string) => {
    if (!confirm('Are you sure you want to delete this nationality?')) return
    try {
      await api.delete(`/nationalities/${id}`)
      onSuccess('Nationality deleted successfully')
      fetchNationalities()
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to delete nationality')
    }
  }

  const openEditNationality = (nationality: Nationality) => {
    setEditingNationality(nationality)
    setNationalityValue('code', nationality.code)
    setNationalityValue('name', nationality.name)
    setNationalityValue('active', nationality.active)
    setNationalityDialog(true)
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
          <Tab label="Service Types" icon={<ServiceIcon />} iconPosition="start" />
          <Tab label="Cost Types" icon={<CategoryIcon />} iconPosition="start" />
          <Tab label="Nationalities" icon={<FlagIcon />} iconPosition="start" />
        </Tabs>

        {/* Service Types Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="flex-end" mb={3}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingServiceType(null)
                resetServiceType()
                setServiceTypeDialog(true)
              }}
            >
              Add Service Type
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceTypes.map((serviceType) => (
                  <TableRow key={serviceType.id}>
                    <TableCell>{serviceType.name}</TableCell>
                    <TableCell>{serviceType.description || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={serviceType.active ? 'Active' : 'Inactive'}
                        color={serviceType.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => openEditServiceType(serviceType)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteServiceType(serviceType.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Cost Types Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="flex-end" mb={3}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingCostType(null)
                resetCostType()
                setCostTypeDialog(true)
              }}
            >
              Add Cost Type
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {costTypes.map((costType) => (
                  <TableRow key={costType.id}>
                    <TableCell>{costType.name}</TableCell>
                    <TableCell>{costType.description || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={costType.active ? 'Active' : 'Inactive'}
                        color={costType.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => openEditCostType(costType)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteCostType(costType.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Nationalities Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box display="flex" justifyContent="flex-end" mb={3}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingNationality(null)
                resetNationality()
                setNationalityDialog(true)
              }}
            >
              Add Nationality
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nationalities.map((nationality) => (
                  <TableRow key={nationality.id}>
                    <TableCell>
                      <Chip label={nationality.code} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{nationality.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={nationality.active ? 'Active' : 'Inactive'}
                        color={nationality.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => openEditNationality(nationality)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteNationality(nationality.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Service Type Dialog */}
      <Dialog open={serviceTypeDialog} onClose={() => setServiceTypeDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleServiceTypeSubmit(handleSaveServiceType)}>
          <DialogTitle>{editingServiceType ? 'Edit Service Type' : 'Add Service Type'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={serviceTypeControl}
                  defaultValue=""
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={serviceTypeControl}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="active"
                  control={serviceTypeControl}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Active"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setServiceTypeDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Cost Type Dialog */}
      <Dialog open={costTypeDialog} onClose={() => setCostTypeDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCostTypeSubmit(handleSaveCostType)}>
          <DialogTitle>{editingCostType ? 'Edit Cost Type' : 'Add Cost Type'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={costTypeControl}
                  defaultValue=""
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={costTypeControl}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={2}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="active"
                  control={costTypeControl}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Active"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCostTypeDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Nationality Dialog */}
      <Dialog open={nationalityDialog} onClose={() => setNationalityDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleNationalitySubmit(handleSaveNationality)}>
          <DialogTitle>{editingNationality ? 'Edit Nationality' : 'Add Nationality'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Controller
                  name="code"
                  control={nationalityControl}
                  defaultValue=""
                  rules={{ 
                    required: 'Code is required',
                    maxLength: { value: 3, message: 'Code must be 3 characters or less' }
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Code"
                      inputProps={{ maxLength: 3 }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || 'e.g., PH, ET, KE'}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <Controller
                  name="name"
                  control={nationalityControl}
                  defaultValue=""
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Name"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="active"
                  control={nationalityControl}
                  defaultValue={true}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Active"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNationalityDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}

export default ListOfValues
