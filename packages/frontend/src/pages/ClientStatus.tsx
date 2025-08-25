import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { APPLICATION_STATUS_LABELS, DOCUMENT_STATUS_LABELS } from '@jobline/shared'
import axios from 'axios'

const ClientStatus = () => {
  const { shareableLink } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchApplicationStatus()
  }, [shareableLink])

  const fetchApplicationStatus = async () => {
    try {
      const response = await axios.get(`/api/public/status/${shareableLink}`)
      setData(response.data)
    } catch (err: any) {
      setError('Application not found or invalid link')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!data) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">No data available</Alert>
      </Container>
    )
  }

  const getStatusColor = (status: string) => {
    if (status.includes('PENDING')) return 'warning'
    if (status.includes('RECEIVED') || status.includes('PROCESSING')) return 'info'
    if (status.includes('ACTIVE') || status === 'SUBMITTED') return 'success'
    return 'default'
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Application Status
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Application Details
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Chip 
              label={APPLICATION_STATUS_LABELS[data.status as keyof typeof APPLICATION_STATUS_LABELS] || data.status}
              color={getStatusColor(data.status)}
            />
            <Chip 
              label={data.type === 'NEW_CANDIDATE' ? 'New Candidate' : 'Guarantor Change'}
              variant="outlined"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Worker Information
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="Name"
                secondary={`${data.candidate.firstName} ${data.candidate.lastName}`}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Nationality"
                secondary={data.candidate.nationality}
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Required Documents
          </Typography>
          <List>
            {data.documents.map((doc: any, index: number) => (
              <ListItem key={index}>
                <ListItemText 
                  primary={doc.name}
                  secondary={
                    <Chip 
                      label={DOCUMENT_STATUS_LABELS[doc.status as keyof typeof DOCUMENT_STATUS_LABELS]}
                      size="small"
                      color={getStatusColor(doc.status)}
                    />
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Financial Summary
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography>Total Paid:</Typography>
            <Typography variant="h6" color="primary">
              {data.financials.currency} {data.financials.totalPaid.toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography>Outstanding Balance:</Typography>
            <Typography variant="h6" color={data.financials.outstandingBalance > 0 ? 'error' : 'success.main'}>
              {data.financials.currency} {data.financials.outstandingBalance.toLocaleString()}
            </Typography>
          </Box>

          {data.financials.payments.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                Payment History
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.financials.payments.map((payment: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          {payment.currency} {Number(payment.amount).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>

        {data.permitExpiryDate && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Permit Information
              </Typography>
              <ListItem>
                <ListItemText 
                  primary="Permit Expiry Date"
                  secondary={new Date(data.permitExpiryDate).toLocaleDateString()}
                />
              </ListItem>
            </Box>
          </>
        )}

        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            For questions or assistance, please contact the agency office.
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

export default ClientStatus
