import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import {
  TrendingUp as ProfitIcon,
  TrendingDown as LossIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Assessment as ReportIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Payment, Cost, CostType, Application, PaginatedResponse } from '../shared/types'
import api from '../services/api'

interface FinancialSummary {
  totalRevenue: number
  totalCosts: number
  profit: number
  revenueByMonth: { month: string; amount: number }[]
  costsByType: { type: string; amount: number }[]
  profitByMonth: { month: string; revenue: number; costs: number; profit: number }[]
}

// Helper function to calculate monthly data
const calculateMonthlyData = (payments: Payment[], costs: Cost[]) => {
  const monthlyRevenue: { [key: string]: number } = {}
  const monthlyCosts: { [key: string]: number } = {}

  // Process payments
  payments.forEach(payment => {
    const month = new Date(payment.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + payment.amount
  })

  // Process costs
  costs.forEach(cost => {
    const month = new Date(cost.costDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    monthlyCosts[month] = (monthlyCosts[month] || 0) + cost.amount
  })

  // Combine all months
  const allMonths = [...new Set([...Object.keys(monthlyRevenue), ...Object.keys(monthlyCosts)])].sort()

  const revenueByMonth = allMonths.map(month => ({
    month,
    amount: monthlyRevenue[month] || 0
  }))

  const profitByMonth = allMonths.map(month => ({
    month,
    revenue: monthlyRevenue[month] || 0,
    costs: monthlyCosts[month] || 0,
    profit: (monthlyRevenue[month] || 0) - (monthlyCosts[month] || 0)
  }))

  return { revenueByMonth, profitByMonth }
}

// Helper function to calculate costs by type
const calculateCostsByType = (costs: Cost[]) => {
  const costsByType: { [key: string]: number } = {}

  costs.forEach(cost => {
    const type = cost.costType.replace(/_/g, ' ')
    costsByType[type] = (costsByType[type] || 0) + cost.amount
  })

  return Object.entries(costsByType).map(([type, amount]) => ({ type, amount }))
}

const Financial = () => {
  const [tabValue, setTabValue] = useState(0)
  const [payments, setPayments] = useState<Payment[]>([])
  const [costs, setCosts] = useState<Cost[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [costDialog, setCostDialog] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  })

  const { control: paymentControl, handleSubmit: handlePaymentSubmit, reset: resetPayment } = useForm()
  const { control: costControl, handleSubmit: handleCostSubmit, reset: resetCost } = useForm()

  useEffect(() => {
    fetchFinancialData()
    fetchApplications()
  }, [selectedDateRange])

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('startDate', selectedDateRange.startDate.toISOString())
      params.append('endDate', selectedDateRange.endDate.toISOString())

      // Fetch payments and costs from applications
      // Note: These endpoints might need to be created in the backend
      // For now, we'll use the application endpoints to get payment/cost data
      let allPayments: Payment[] = []
      let allCosts: Cost[] = []
      
      try {
        // Get all applications first
        const applicationsRes = await api.get<any>('/applications?limit=100')
        const applications = applicationsRes.data?.applications || applicationsRes.data?.data || []
        
        // Fetch payments and costs for each application
        if (applications.length > 0) {
          const promises = applications.map(async (app: any) => {
            try {
              const [paymentsRes, costsRes] = await Promise.all([
                api.get<Payment[]>(`/applications/${app.id}/payments`).catch(() => ({ data: [] })),
                api.get<Cost[]>(`/applications/${app.id}/costs`).catch(() => ({ data: [] })),
              ])
              return { payments: paymentsRes.data || [], costs: costsRes.data || [] }
            } catch {
              return { payments: [], costs: [] }
            }
          })
          
          const results = await Promise.all(promises)
          allPayments = results.flatMap(r => r.payments)
          allCosts = results.flatMap(r => r.costs)
          
          // Filter by date range
          allPayments = allPayments.filter(p => {
            const date = new Date(p.paymentDate)
            return date >= selectedDateRange.startDate && date <= selectedDateRange.endDate
          })
          
          allCosts = allCosts.filter(c => {
            const date = new Date(c.costDate)
            return date >= selectedDateRange.startDate && date <= selectedDateRange.endDate
          })
        }
      } catch (err) {
        console.error('Error fetching financial data:', err)
      }

      setPayments(allPayments)
      setCosts(allCosts)

      // Calculate summary from the data
      const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0)
      const totalCosts = allCosts.reduce((sum, c) => sum + c.amount, 0)
      const profit = totalRevenue - totalCosts

      // Group by month for charts
      const monthlyData = calculateMonthlyData(allPayments, allCosts)
      const costsByType = calculateCostsByType(allCosts)

      setSummary({
        totalRevenue,
        totalCosts,
        profit,
        revenueByMonth: monthlyData.revenueByMonth,
        costsByType,
        profitByMonth: monthlyData.profitByMonth,
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch financial data')
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      const response = await api.get<any>('/applications?limit=100')
      // Handle both response formats
      const apps = response.data?.applications || response.data?.data || []
      // Ensure each application has the needed fields populated
      const populatedApps = apps.filter((app: any) => app && app.id)
      setApplications(populatedApps)
    } catch (err) {
      console.error('Failed to fetch applications:', err)
      setApplications([])
    }
  }

  const handleAddPayment = async (data: any) => {
    try {
      await api.post('/payments', {
        ...data,
        paymentDate: data.paymentDate || new Date(),
        currency: 'USD',
      })
      setPaymentDialog(false)
      resetPayment()
      fetchFinancialData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add payment')
    }
  }

  const handleAddCost = async (data: any) => {
    try {
      await api.post('/costs', {
        ...data,
        costDate: data.costDate || new Date(),
        currency: 'USD',
      })
      setCostDialog(false)
      resetCost()
      fetchFinancialData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add cost')
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Financial Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Revenue
                    </Typography>
                    <Typography variant="h5" color="primary">
                      ${summary.totalRevenue.toLocaleString()}
                    </Typography>
                  </Box>
                  <MoneyIcon fontSize="large" color="primary" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Costs
                    </Typography>
                    <Typography variant="h5" color="error">
                      ${summary.totalCosts.toLocaleString()}
                    </Typography>
                  </Box>
                  <ReceiptIcon fontSize="large" color="error" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Net Profit
                    </Typography>
                    <Typography 
                      variant="h5" 
                      color={summary.profit >= 0 ? 'success.main' : 'error.main'}
                    >
                      ${summary.profit.toLocaleString()}
                    </Typography>
                  </Box>
                  {summary.profit >= 0 ? (
                    <ProfitIcon fontSize="large" color="success" />
                  ) : (
                    <LossIcon fontSize="large" color="error" />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Profit Margin
                    </Typography>
                    <Typography variant="h5">
                      {summary.totalRevenue > 0 
                        ? `${((summary.profit / summary.totalRevenue) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </Typography>
                  </Box>
                  <CalculateIcon fontSize="large" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Date Range Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <DatePicker
              label="Start Date"
              value={selectedDateRange.startDate}
              onChange={(date) => date && setSelectedDateRange(prev => ({ ...prev, startDate: date }))}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <DatePicker
              label="End Date"
              value={selectedDateRange.endDate}
              onChange={(date) => date && setSelectedDateRange(prev => ({ ...prev, endDate: date }))}
              slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button fullWidth variant="contained" onClick={fetchFinancialData}>
              Update Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Charts */}
      {summary && summary.profitByMonth.length > 0 && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Revenue vs Costs by Month
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={summary.profitByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#4caf50" name="Revenue" />
                  <Line type="monotone" dataKey="costs" stroke="#f44336" name="Costs" />
                  <Line type="monotone" dataKey="profit" stroke="#2196f3" name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Costs by Type
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary.costsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#ff9800" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tabs for Payments and Costs */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Payments (Revenue)" />
            <Tab label="Costs" />
            <Tab label="Application Profitability" />
          </Tabs>
        </Box>

        {/* Payments Tab */}
        {tabValue === 0 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Payment Records</Typography>
              <Button
                variant="contained"
                startIcon={<MoneyIcon />}
                onClick={() => setPaymentDialog(true)}
              >
                Add Payment
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Application</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell>{payment.client?.name || '-'}</TableCell>
                      <TableCell>{payment.application ? `#${payment.application.id.substring(0, 8)}` : '-'}</TableCell>
                      <TableCell>${payment.amount}</TableCell>
                      <TableCell>{payment.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Costs Tab */}
        {tabValue === 1 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Cost Records</Typography>
              <Button
                variant="contained"
                startIcon={<ReceiptIcon />}
                onClick={() => setCostDialog(true)}
              >
                Add Cost
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Application</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {costs.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>{new Date(cost.costDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={cost.costType.replace(/_/g, ' ')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{cost.application ? `#${cost.application.id.substring(0, 8)}` : '-'}</TableCell>
                      <TableCell>${cost.amount}</TableCell>
                      <TableCell>{cost.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Application Profitability Tab */}
        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Application Profitability Analysis</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Application ID</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Revenue</TableCell>
                    <TableCell>Costs</TableCell>
                    <TableCell>Profit</TableCell>
                    <TableCell>Margin</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications && applications.length > 0 ? applications.map((app) => {
                    const appPayments = payments.filter(p => p.applicationId === app.id)
                    const appCosts = costs.filter(c => c.applicationId === app.id)
                    const revenue = appPayments.reduce((sum, p) => sum + p.amount, 0)
                    const totalCosts = appCosts.reduce((sum, c) => sum + c.amount, 0)
                    const profit = revenue - totalCosts
                    const margin = revenue > 0 ? (profit / revenue) * 100 : 0

                    return (
                      <TableRow key={app.id}>
                        <TableCell>#{app.id.substring(0, 8)}</TableCell>
                        <TableCell>{app.client?.name || '-'}</TableCell>
                        <TableCell>
                          {app.candidate ? `${app.candidate.firstName} ${app.candidate.lastName}` : '-'}
                        </TableCell>
                        <TableCell>${revenue}</TableCell>
                        <TableCell>${totalCosts}</TableCell>
                        <TableCell>
                          <Typography color={profit >= 0 ? 'success.main' : 'error.main'}>
                            ${profit}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${margin.toFixed(1)}%`}
                            color={margin >= 20 ? 'success' : margin >= 0 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No applications found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Add Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handlePaymentSubmit(handleAddPayment)}>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="applicationId"
                  control={paymentControl}
                  rules={{ required: 'Application is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Application"
                    >
                      {applications && applications.length > 0 ? (
                        applications.map((app) => (
                          <MenuItem key={app.id} value={app.id}>
                            #{app.id.substring(0, 8)} - {app.client?.name || 'Unknown Client'} - {app.candidate?.firstName || ''} {app.candidate?.lastName || 'Unknown Candidate'}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>
                          No applications available
                        </MenuItem>
                      )}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="amount"
                  control={paymentControl}
                  rules={{ required: 'Amount is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Amount"
                      type="number"
                      InputProps={{ startAdornment: '$' }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="paymentDate"
                  control={paymentControl}
                  render={({ field }) => (
                    <DatePicker
                      label="Payment Date"
                      value={field.value || new Date()}
                      onChange={field.onChange}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={paymentControl}
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
            <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add Payment</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Cost Dialog */}
      <Dialog open={costDialog} onClose={() => setCostDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCostSubmit(handleAddCost)}>
          <DialogTitle>Add Cost</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="applicationId"
                  control={costControl}
                  rules={{ required: 'Application is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Application"
                    >
                      {applications && applications.length > 0 ? (
                        applications.map((app) => (
                          <MenuItem key={app.id} value={app.id}>
                            #{app.id.substring(0, 8)} - {app.client?.name || 'Unknown Client'} - {app.candidate?.firstName || ''} {app.candidate?.lastName || 'Unknown Candidate'}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="" disabled>
                          No applications available
                        </MenuItem>
                      )}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="costType"
                  control={costControl}
                  rules={{ required: 'Cost type is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      select
                      label="Cost Type"
                    >
                      {Object.values(CostType).map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="amount"
                  control={costControl}
                  rules={{ required: 'Amount is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Amount"
                      type="number"
                      InputProps={{ startAdornment: '$' }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="costDate"
                  control={costControl}
                  render={({ field }) => (
                    <DatePicker
                      label="Cost Date"
                      value={field.value || new Date()}
                      onChange={field.onChange}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={costControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCostDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add Cost</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}

export default Financial
