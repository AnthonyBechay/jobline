import { useEffect, useState } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  People as PeopleIcon,
  PersonSearch as CandidateIcon,
  Assignment as ApplicationIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { DashboardStats } from '@jobline/shared'
import api from '../services/api'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get<DashboardStats>('/dashboard/stats')
      setStats(response.data)
    } catch (err: any) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!stats) {
    return <Alert severity="info">No data available</Alert>
  }

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: <PeopleIcon fontSize="large" />,
      color: '#1976d2',
    },
    {
      title: 'Total Candidates',
      value: stats.totalCandidates,
      icon: <CandidateIcon fontSize="large" />,
      color: '#2e7d32',
    },
    {
      title: 'Active Applications',
      value: stats.activeApplications,
      icon: <ApplicationIcon fontSize="large" />,
      color: '#ed6c02',
    },
    {
      title: 'Pending Documents',
      value: stats.pendingDocuments,
      icon: <WarningIcon fontSize="large" />,
      color: '#d32f2f',
    },
  ]

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stat Cards */}
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4">
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Financial Summary (Super Admin Only) */}
        {user?.role === 'SUPER_ADMIN' && stats.financialSummary && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Financial Summary (This Month)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">
                        Revenue
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${stats.financialSummary.revenue.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">
                        Costs
                      </Typography>
                      <Typography variant="h6" color="error">
                        ${stats.financialSummary.costs.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">
                        Profit
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        ${stats.financialSummary.profit.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Attention Required
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Pending Payments"
                    secondary={`${stats.pendingPayments} applications awaiting payment`}
                  />
                  <Chip label={stats.pendingPayments} color="warning" size="small" />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Upcoming Renewals"
                    secondary={`${stats.upcomingRenewals} permits expiring soon`}
                  />
                  <Chip label={stats.upcomingRenewals} color="error" size="small" />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Documents Pending"
                    secondary={`${stats.pendingDocuments} documents to be collected`}
                  />
                  <Chip label={stats.pendingDocuments} color="info" size="small" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Application Pipeline */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Application Pipeline
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Visual pipeline will be displayed here showing applications at each stage
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard
