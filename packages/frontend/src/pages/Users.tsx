import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { User, UserRole } from '../shared/types'
import api from '../services/api'

const Users = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dialog, setDialog] = useState<{
    open: boolean
    user: User | null
  }>({ open: false, user: null })

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get<User[]>('/users')
      setUsers(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveUser = async (data: any) => {
    try {
      setLoading(true)
      if (dialog.user) {
        await api.patch(`/users/${dialog.user.id}`, data)
        setSuccess('User updated successfully')
      } else {
        await api.post('/users', data)
        setSuccess('User created successfully')
      }
      setDialog({ open: false, user: null })
      reset()
      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`)
        setSuccess('User deleted successfully')
        fetchUsers()
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete user')
      }
    }
  }

  const openDialog = (user: User | null) => {
    if (user) {
      setValue('name', user.name)
      setValue('email', user.email)
      setValue('role', user.role)
    } else {
      reset()
    }
    setDialog({ open: true, user })
  }

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    {
      field: 'role',
      headerName: 'Role',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ')}
          color={params.value === UserRole.SUPER_ADMIN ? 'error' : 'primary'}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
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
            onClick={() => handleDeleteUser(params.row.id)}
            disabled={params.row.email === 'admin@jobline.com'} // Protect default admin
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
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openDialog(null)}
        >
          Add User
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

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={users || []}
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

      {/* User Dialog */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, user: null })}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleSaveUser)}>
          <DialogTitle>
            {dialog.user ? 'Edit User' : 'Add User'}
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
                      label="Name"
                      error={!!errors.name}
                      helperText={errors.name?.message as string}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      disabled={!!dialog.user}
                      error={!!errors.email}
                      helperText={errors.email?.message as string}
                    />
                  )}
                />
              </Grid>
              {!dialog.user && (
                <Grid item xs={12}>
                  <Controller
                    name="password"
                    control={control}
                    rules={{
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Password"
                        type="password"
                        error={!!errors.password}
                        helperText={errors.password?.message as string}
                      />
                    )}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <Controller
                  name="role"
                  control={control}
                  defaultValue={UserRole.ADMIN}
                  rules={{ required: 'Role is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Role"
                      error={!!errors.role}
                      helperText={errors.role?.message as string}
                    >
                      {Object.values(UserRole).map((role) => (
                        <MenuItem key={role} value={role}>
                          {role.replace('_', ' ')}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog({ open: false, user: null })}>
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

export default Users
