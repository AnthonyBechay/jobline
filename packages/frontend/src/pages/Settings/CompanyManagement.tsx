import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Divider,
  InputAdornment,
} from '@mui/material'
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  PhotoCamera as PhotoCameraIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Language as WebsiteIcon,
  Badge as BadgeIcon,
  AccountBalance as BankIcon,
  Receipt as TaxIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import api from '../../services/api'

interface CompanyManagementProps {
  onBack: () => void
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

interface CompanyData {
  id: string
  name: string
  email: string
  phone: string
  address: string
  website: string
  taxId: string
  logo?: string
  // Additional fields
  molRegistrationNumber?: string
  bankName?: string
  bankAccountNumber?: string
  bankIBAN?: string
  bankSwiftCode?: string
  licenseNumber?: string
  establishedDate?: string
  numberOfEmployees?: number
  contactPersonName?: string
  contactPersonPhone?: string
  contactPersonEmail?: string
}

const CompanyManagement = ({ onBack, onError, onSuccess }: CompanyManagementProps) => {
  const [loading, setLoading] = useState(false)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const { control, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    fetchCompany()
  }, [])

  const fetchCompany = async () => {
    try {
      setLoading(true)
      const response = await api.get<CompanyData>('/company')
      setCompany(response.data)
      reset(response.data)
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to fetch company data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: any) => {
    try {
      setLoading(true)
      const response = await api.put('/company', data)
      setCompany(response.data)
      onSuccess('Company information updated successfully')
    } catch (err: any) {
      onError(err.response?.data?.error || 'Failed to update company information')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // TODO: Implement logo upload functionality
      onError('Logo upload functionality will be implemented in the next version')
    }
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

      <Grid container spacing={3}>
        {/* Logo Section */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Company Logo
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-block', my: 3 }}>
                <Avatar
                  sx={{
                    width: 150,
                    height: 150,
                    bgcolor: 'primary.main',
                    fontSize: '3rem'
                  }}
                  src={company?.logo}
                >
                  <BusinessIcon sx={{ fontSize: 80 }} />
                </Avatar>
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    '&:hover': {
                      bgcolor: 'background.paper',
                    }
                  }}
                >
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handleLogoUpload}
                  />
                  <PhotoCameraIcon />
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Recommended: 200x200px
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PNG, JPG, or SVG
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Company Information Form */}
        <Grid item xs={12} md={9}>
          <form onSubmit={handleSubmit(handleSave)}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon sx={{ mr: 1 }} />
                    Basic Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="name"
                        control={control}
                        defaultValue=""
                        rules={{ required: 'Company name is required' }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Company Name"
                            error={!!errors.name}
                            helperText={errors.name?.message as string}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <BusinessIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="molRegistrationNumber"
                        control={control}
                        defaultValue=""
                        rules={{ required: 'MoL Registration Number is required' }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="MoL Registration Number"
                            error={!!errors.molRegistrationNumber}
                            helperText={errors.molRegistrationNumber?.message as string || 'Ministry of Labour registration number'}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <BadgeIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="licenseNumber"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Business License Number"
                            helperText="Commercial registration number"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="taxId"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Tax ID / VAT Number"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <TaxIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="establishedDate"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Established Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            helperText="When was the company established"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="numberOfEmployees"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Number of Employees"
                            type="number"
                            helperText="Total staff count"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Contact Information */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneIcon sx={{ mr: 1 }} />
                    Contact Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="email"
                        control={control}
                        defaultValue=""
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
                            label="Company Email"
                            type="email"
                            error={!!errors.email}
                            helperText={errors.email?.message as string}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EmailIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="phone"
                        control={control}
                        defaultValue=""
                        rules={{ required: 'Phone number is required' }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Company Phone"
                            error={!!errors.phone}
                            helperText={errors.phone?.message as string}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <PhoneIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Controller
                        name="address"
                        control={control}
                        defaultValue=""
                        rules={{ required: 'Address is required' }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Company Address"
                            multiline
                            rows={2}
                            error={!!errors.address}
                            helperText={errors.address?.message as string}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LocationIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="website"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Website"
                            placeholder="https://www.example.com"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <WebsiteIcon color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Primary Contact Person
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Controller
                        name="contactPersonName"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Contact Person Name"
                            helperText="Primary point of contact"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Controller
                        name="contactPersonPhone"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Contact Person Phone"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Controller
                        name="contactPersonEmail"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Contact Person Email"
                            type="email"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Banking Information */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <BankIcon sx={{ mr: 1 }} />
                    Banking Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="bankName"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Bank Name"
                            helperText="Primary bank for transactions"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="bankAccountNumber"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Bank Account Number"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="bankIBAN"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="IBAN"
                            helperText="International Bank Account Number"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="bankSwiftCode"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="SWIFT/BIC Code"
                            helperText="For international transfers"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" gap={2}>
                  <Button onClick={onBack} color="inherit">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Grid>
      </Grid>
    </Box>
  )
}

export default CompanyManagement
