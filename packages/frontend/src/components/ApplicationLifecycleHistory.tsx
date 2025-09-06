import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  FlightTakeoff as FlightIcon,
  Home as HomeIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import api from '../services/api'


interface LifecycleEvent {
  id: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  fromClientId?: string;
  toClientId?: string;
  candidateStatusBefore?: string;
  candidateStatusAfter?: string;
  financialImpact?: {
    type: string;
    amount: number;
    currency: string;
    description: string;
  };
  notes?: string;
  performedBy: {
    name: string;
    email: string;
  };
  performedAt: string;
}

interface ApplicationLifecycleHistoryProps {
  applicationId: string;
  candidateName: string;
  clientName: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

const ApplicationLifecycleHistory: React.FC<ApplicationLifecycleHistoryProps> = ({
  applicationId,
  candidateName,
  clientName,
  currentStatus,
  onStatusChange
}) => {
  const [events, setEvents] = useState<LifecycleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [addEventDialog, setAddEventDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    action: '',
    notes: '',
    financialImpact: {
      type: '',
      amount: 0,
      currency: 'USD',
      description: ''
    }
  });

  const actionTypes = [
    'status_change',
    'client_assignment',
    'client_change',
    'cancellation',
    'arrival',
    'departure',
    'document_update',
    'payment',
    'refund',
    'cost_logged',
    'note_added'
  ];

  const financialImpactTypes = [
    'payment_received',
    'refund_issued',
    'cost_incurred',
    'fee_calculated',
    'penalty_applied'
  ];

  const currencies = ['USD', 'LBP', 'EUR'];

  useEffect(() => {
    fetchLifecycleHistory();
  }, [applicationId]);

  const fetchLifecycleHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/applications/${applicationId}/lifecycle-history`);
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch lifecycle history:', error);
      setError('Failed to load lifecycle history');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!newEvent.action.trim()) {
      setError('Please select an action type');
      return;
    }

    try {
      await api.post(`/applications/${applicationId}/lifecycle-history`, newEvent);
      setAddEventDialog(false);
      setNewEvent({
        action: '',
        notes: '',
        financialImpact: {
          type: '',
          amount: 0,
          currency: 'USD',
          description: ''
        }
      });
      fetchLifecycleHistory();
    } catch (error: any) {
      console.error('Failed to add lifecycle event:', error);
      setError(error.response?.data?.error || 'Failed to add lifecycle event');
    }
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'status_change':
        return <CheckCircleIcon />;
      case 'client_assignment':
      case 'client_change':
        return <BusinessIcon />;
      case 'cancellation':
        return <CancelIcon />;
      case 'arrival':
        return <FlightIcon />;
      case 'departure':
        return <HomeIcon />;
      case 'document_update':
        return <AssignmentIcon />;
      case 'payment':
      case 'refund':
        return <MoneyIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'status_change':
        return 'primary';
      case 'client_assignment':
      case 'client_change':
        return 'secondary';
      case 'cancellation':
        return 'error';
      case 'arrival':
        return 'success';
      case 'departure':
        return 'warning';
      case 'payment':
        return 'success';
      case 'refund':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusChip = (status: string) => {
    const statusColors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' } = {
      'PENDING': 'warning',
      'IN_PROGRESS': 'info',
      'DOCUMENTS_REQUIRED': 'warning',
      'READY_FOR_ARRIVAL': 'primary',
      'ARRIVED': 'success',
      'ACTIVE': 'success',
      'COMPLETED': 'success',
      'CANCELLED_PRE_ARRIVAL': 'error',
      'CANCELLED_POST_ARRIVAL': 'error',
      'CANCELLED_CANDIDATE': 'error'
    };

    return (
      <Chip
        label={status.replace(/_/g, ' ')}
        size="small"
        color={statusColors[status] || 'default'}
        variant="outlined"
      />
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionDescription = (event: LifecycleEvent) => {
    switch (event.action) {
      case 'status_change':
        return `Status changed from ${event.fromStatus} to ${event.toStatus}`;
      case 'client_assignment':
        return `Assigned to client: ${clientName}`;
      case 'client_change':
        return `Client changed from ${event.fromClientId} to ${event.toClientId}`;
      case 'cancellation':
        return `Application cancelled`;
      case 'arrival':
        return `Candidate arrived in Lebanon`;
      case 'departure':
        return `Candidate departed`;
      case 'document_update':
        return `Document status updated`;
      case 'payment':
        return `Payment received`;
      case 'refund':
        return `Refund issued`;
      default:
        return event.action.replace(/_/g, ' ');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Application Lifecycle History
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddEventDialog(true)}
        >
          Add Event
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {candidateName} - {clientName} | Current Status: {getStatusChip(currentStatus)}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {events.length === 0 ? (
        <Alert severity="info">
          No lifecycle events found for this application.
        </Alert>
      ) : (
        <Timeline>
          {events.map((event, index) => (
            <TimelineItem key={event.id}>
              <TimelineOppositeContent
                sx={{ m: 'auto 0' }}
                align="right"
                variant="body2"
                color="text.secondary"
              >
                {formatDate(event.performedAt)}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineConnector />
                <TimelineDot color={getActionColor(event.action)}>
                  {getActionIcon(event.action)}
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent sx={{ py: '12px', px: 2 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" component="span">
                          {getActionDescription(event)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Performed by: {event.performedBy.name} ({event.performedBy.email})
                        </Typography>
                        
                        {event.notes && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {event.notes}
                          </Typography>
                        )}

                        {event.financialImpact && (
                          <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Financial Impact
                            </Typography>
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Type: {event.financialImpact.type.replace(/_/g, ' ')}
                                </Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                  Amount: {formatCurrency(event.financialImpact.amount, event.financialImpact.currency)}
                                </Typography>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2">
                                  {event.financialImpact.description}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Paper>
                        )}

                        {(event.fromStatus || event.toStatus || event.candidateStatusBefore || event.candidateStatusAfter) && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Status Changes:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {event.fromStatus && (
                                <>
                                  <Typography variant="body2">From:</Typography>
                                  {getStatusChip(event.fromStatus)}
                                </>
                              )}
                              {event.toStatus && (
                                <>
                                  <Typography variant="body2">To:</Typography>
                                  {getStatusChip(event.toStatus)}
                                </>
                              )}
                            </Box>
                            {(event.candidateStatusBefore || event.candidateStatusAfter) && (
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                {event.candidateStatusBefore && (
                                  <>
                                    <Typography variant="body2">Candidate Status Before:</Typography>
                                    <Chip label={event.candidateStatusBefore} size="small" variant="outlined" />
                                  </>
                                )}
                                {event.candidateStatusAfter && (
                                  <>
                                    <Typography variant="body2">After:</Typography>
                                    <Chip label={event.candidateStatusAfter} size="small" variant="outlined" />
                                  </>
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}

      {/* Add Event Dialog */}
      <Dialog open={addEventDialog} onClose={() => setAddEventDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Lifecycle Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={newEvent.action}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, action: e.target.value }))}
                  label="Action Type"
                >
                  {actionTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace(/_/g, ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={newEvent.notes}
                onChange={(e) => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Financial Impact (Optional)
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Impact Type</InputLabel>
                <Select
                  value={newEvent.financialImpact.type}
                  onChange={(e) => setNewEvent(prev => ({
                    ...prev,
                    financialImpact: { ...prev.financialImpact, type: e.target.value }
                  }))}
                  label="Impact Type"
                >
                  {financialImpactTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace(/_/g, ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={newEvent.financialImpact.amount}
                onChange={(e) => setNewEvent(prev => ({
                  ...prev,
                  financialImpact: { ...prev.financialImpact, amount: parseFloat(e.target.value) || 0 }
                }))}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={newEvent.financialImpact.currency}
                  onChange={(e) => setNewEvent(prev => ({
                    ...prev,
                    financialImpact: { ...prev.financialImpact, currency: e.target.value }
                  }))}
                  label="Currency"
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                value={newEvent.financialImpact.description}
                onChange={(e) => setNewEvent(prev => ({
                  ...prev,
                  financialImpact: { ...prev.financialImpact, description: e.target.value }
                }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddEventDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddEvent}
            variant="contained"
            disabled={!newEvent.action.trim()}
          >
            Add Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationLifecycleHistory;
