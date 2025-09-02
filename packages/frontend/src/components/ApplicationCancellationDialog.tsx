import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import api from '../services/api';

interface ApplicationCancellationDialogProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  applicationStatus: string;
  candidateName: string;
  clientName: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface CancellationOptions {
  canCancel: boolean;
  availableTypes: string[];
  warnings: string[];
  refundEstimate?: {
    totalPaid: number;
    refundableAmount: number;
    nonRefundableAmount: number;
    calculatedRefund: number;
    finalRefund: number;
    description: string;
  };
}

interface CancellationFormData {
  cancellationType: string;
  reason: string;
  notes: string;
  customRefundAmount?: number;
  candidateInLebanon: boolean;
  candidateDeparted: boolean;
  newClientId?: string;
  deportCandidate: boolean;
}

const ApplicationCancellationDialog: React.FC<ApplicationCancellationDialogProps> = ({
  open,
  onClose,
  applicationId,
  applicationStatus,
  candidateName,
  clientName,
  onSuccess,
  onError
}) => {
  const [options, setOptions] = useState<CancellationOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CancellationFormData>({
    cancellationType: '',
    reason: '',
    notes: '',
    candidateInLebanon: false,
    candidateDeparted: false,
    deportCandidate: false
  });
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetchCancellationOptions();
      fetchClients();
    }
  }, [open, applicationId]);

  const fetchCancellationOptions = async () => {
    try {
      const response = await api.get(`/applications/${applicationId}/cancellation-options`);
      setOptions(response.data);
      if (response.data.availableTypes.length > 0) {
        setFormData(prev => ({
          ...prev,
          cancellationType: response.data.availableTypes[0]
        }));
      }
    } catch (error) {
      console.error('Failed to fetch cancellation options:', error);
      onError('Failed to load cancellation options');
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const handleInputChange = (field: keyof CancellationFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.cancellationType) {
      onError('Please select a cancellation type');
      return;
    }

    if (!formData.reason.trim()) {
      onError('Please provide a reason for cancellation');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/applications/${applicationId}/cancel`, formData);
      
      onSuccess(response.data.message);
      onClose();
    } catch (error: any) {
      console.error('Cancellation failed:', error);
      onError(error.response?.data?.error || 'Failed to process cancellation');
    } finally {
      setLoading(false);
    }
  };

  const getCancellationTypeLabel = (type: string) => {
    switch (type) {
      case 'pre_arrival':
        return 'Pre-Arrival Cancellation';
      case 'post_arrival':
        return 'Post-Arrival Cancellation';
      case 'candidate_cancellation':
        return 'Candidate Cancellation';
      default:
        return type;
    }
  };

  const getCancellationTypeDescription = (type: string) => {
    switch (type) {
      case 'pre_arrival':
        return 'Cancel before worker arrives in Lebanon. Full refund minus penalty fee.';
      case 'post_arrival':
        return 'Cancel after worker arrives. Refund calculation based on probation period and non-refundable fees.';
      case 'candidate_cancellation':
        return 'Candidate initiated cancellation. Full refund to client, all costs absorbed by office.';
      default:
        return '';
    }
  };

  if (!options) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Cancel Application
        <Typography variant="body2" color="text.secondary">
          {candidateName} - {clientName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {!options.canCancel && (
          <Alert severity="error" sx={{ mb: 2 }}>
            This application cannot be cancelled in its current state.
          </Alert>
        )}

        {options.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Warnings:</Typography>
            <ul>
              {options.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </Alert>
        )}

        {options.refundEstimate && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Refund Estimate
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">Total Paid:</Typography>
                  <Typography variant="h6">${options.refundEstimate.totalPaid}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Estimated Refund:</Typography>
                  <Typography variant="h6" color="success.main">
                    ${options.refundEstimate.finalRefund}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    {options.refundEstimate.description}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Cancellation Type</InputLabel>
            <Select
              value={formData.cancellationType}
              onChange={(e) => handleInputChange('cancellationType', e.target.value)}
              label="Cancellation Type"
            >
              {options.availableTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {getCancellationTypeLabel(type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {formData.cancellationType && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {getCancellationTypeDescription(formData.cancellationType)}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Reason for Cancellation"
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Additional Notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          {(formData.cancellationType === 'post_arrival_within_3_months' || formData.cancellationType === 'post_arrival_after_3_months') && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Next Actions for Candidate
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.candidateInLebanon}
                    onChange={(e) => handleInputChange('candidateInLebanon', e.target.checked)}
                  />
                }
                label="Candidate is currently in Lebanon"
                sx={{ mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.candidateDeparted}
                    onChange={(e) => handleInputChange('candidateDeparted', e.target.checked)}
                  />
                }
                label="Candidate has departed/left"
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Reassign to New Client</InputLabel>
                <Select
                  value={formData.newClientId || ''}
                  onChange={(e) => handleInputChange('newClientId', e.target.value)}
                  label="Reassign to New Client"
                >
                  <MenuItem value="">Select a client...</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.deportCandidate}
                    onChange={(e) => handleInputChange('deportCandidate', e.target.checked)}
                  />
                }
                label="Deport candidate (return to home country)"
                sx={{ mb: 2 }}
              />
            </>
          )}

          {formData.cancellationType === 'pre_arrival' && (
            <TextField
              fullWidth
              label="Custom Refund Amount (optional)"
              type="number"
              value={formData.customRefundAmount || ''}
              onChange={(e) => handleInputChange('customRefundAmount', parseFloat(e.target.value) || undefined)}
              sx={{ mb: 2 }}
              helperText="Leave empty to use default calculation"
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={loading || !options.canCancel || !formData.cancellationType || !formData.reason.trim()}
        >
          {loading ? 'Processing...' : 'Confirm Cancellation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationCancellationDialog;
