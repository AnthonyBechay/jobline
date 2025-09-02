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
  Grid,
  Typography,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import api from '../services/api';
import { Client, RefundCalculation } from '../shared/types';

interface GuarantorChangeDialogProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  currentClientName: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface GuarantorChangeFormData {
  toClientId: string;
  reason: string;
  candidateInLebanon: boolean;
  candidateDeparted: boolean;
  customRefundAmount?: number;
  notes: string;
}

const GuarantorChangeDialog: React.FC<GuarantorChangeDialogProps> = ({
  open,
  onClose,
  applicationId,
  candidateName,
  currentClientName,
  onSuccess,
  onError
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [refundCalculation, setRefundCalculation] = useState<RefundCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculatingRefund, setCalculatingRefund] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<GuarantorChangeFormData>({
    defaultValues: {
      toClientId: '',
      reason: '',
      candidateInLebanon: false,
      candidateDeparted: false,
      customRefundAmount: undefined,
      notes: ''
    }
  });

  const watchedCandidateInLebanon = watch('candidateInLebanon');
  const watchedCandidateDeparted = watch('candidateDeparted');

  // Fetch clients when dialog opens
  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  // Calculate refund when conditions change
  useEffect(() => {
    if (open && (watchedCandidateInLebanon !== undefined || watchedCandidateDeparted !== undefined)) {
      calculateRefund();
    }
  }, [open, watchedCandidateInLebanon, watchedCandidateDeparted]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients?limit=1000');
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      onError('Failed to fetch clients');
    }
  };

  const calculateRefund = async () => {
    if (!applicationId) return;

    setCalculatingRefund(true);
    try {
      const response = await api.post('/guarantor-changes/calculate-refund', {
        applicationId,
        candidateInLebanon: watchedCandidateInLebanon,
        candidateDeparted: watchedCandidateDeparted
      });
      setRefundCalculation(response.data);
    } catch (error) {
      console.error('Failed to calculate refund:', error);
      onError('Failed to calculate refund');
    } finally {
      setCalculatingRefund(false);
    }
  };

  const onSubmit = async (data: GuarantorChangeFormData) => {
    setLoading(true);
    try {
      await api.post('/guarantor-changes/process', {
        originalApplicationId: applicationId,
        toClientId: data.toClientId,
        reason: data.reason,
        candidateInLebanon: data.candidateInLebanon,
        candidateDeparted: data.candidateDeparted,
        customRefundAmount: data.customRefundAmount,
        notes: data.notes
      });

      onSuccess('Guarantor change processed successfully');
      handleClose();
    } catch (error: any) {
      console.error('Failed to process guarantor change:', error);
      onError(error.response?.data?.error || 'Failed to process guarantor change');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setRefundCalculation(null);
    setClientSearchTerm('');
    onClose();
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Process Guarantor Change
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Candidate: {candidateName} | Current Client: {currentClientName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* New Client Selection */}
            <Grid item xs={12}>
              <Controller
                name="toClientId"
                control={control}
                rules={{ required: 'New client is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.toClientId}>
                    <InputLabel>New Client (To)</InputLabel>
                    <Select
                      {...field}
                      label="New Client (To)"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        const selectedClient = clients.find(c => c.id === e.target.value);
                        setClientSearchTerm(selectedClient?.name || '');
                      }}
                    >
                      <MenuItem value="">
                        <TextField
                          fullWidth
                          placeholder="Search clients..."
                          value={clientSearchTerm}
                          onChange={(e) => {
                            setClientSearchTerm(e.target.value);
                            field.onChange('');
                          }}
                          onClick={(e) => e.stopPropagation()}
                          size="small"
                        />
                      </MenuItem>
                      {filteredClients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Reason */}
            <Grid item xs={12}>
              <Controller
                name="reason"
                control={control}
                rules={{ required: 'Reason is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Reason for Change"
                    multiline
                    rows={2}
                    error={!!errors.reason}
                    helperText={errors.reason?.message}
                  />
                )}
              />
            </Grid>

            {/* Candidate Status */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Candidate Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Controller
                    name="candidateInLebanon"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            {...field}
                            checked={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              if (e.target.checked) {
                                setValue('candidateDeparted', false);
                              }
                            }}
                          />
                        }
                        label="Candidate is in Lebanon"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Controller
                    name="candidateDeparted"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            {...field}
                            checked={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              if (e.target.checked) {
                                setValue('candidateInLebanon', false);
                              }
                            }}
                          />
                        }
                        label="Candidate has departed"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Refund Calculation */}
            {refundCalculation && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Refund Calculation
                </Typography>
                
                {calculatingRefund ? (
                  <Box display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={20} />
                    <Typography>Calculating refund...</Typography>
                  </Box>
                ) : (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Paid: ${refundCalculation.totalPaid.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Calculated Refund: ${refundCalculation.calculatedRefund.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Refund Breakdown */}
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Payment Type</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">Refund</TableCell>
                            <TableCell align="center">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {refundCalculation.refundBreakdown.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.paymentType}</TableCell>
                              <TableCell align="right">${item.amount.toFixed(2)}</TableCell>
                              <TableCell align="right">${item.refundAmount.toFixed(2)}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={item.isRefundable ? 'Refundable' : 'Non-refundable'}
                                  color={item.isRefundable ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Custom Refund Amount */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Controller
                        name="customRefundAmount"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Custom Refund Amount (Optional)"
                            type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            helperText="Leave empty to use calculated amount"
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value ? parseFloat(value) : undefined);
                            }}
                          />
                        )}
                      />
                    </Grid>

                    <Alert severity="info" sx={{ mt: 2 }}>
                      Final refund amount: ${refundCalculation.finalRefund.toFixed(2)}
                    </Alert>
                  </Box>
                )}
              </Grid>
            )}

            {/* Notes */}
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Additional Notes"
                    multiline
                    rows={3}
                    helperText="Any additional information about this guarantor change"
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={loading || calculatingRefund}
        >
          {loading ? <CircularProgress size={20} /> : 'Process Guarantor Change'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GuarantorChangeDialog;

