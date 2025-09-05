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
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  RadioGroup,
  Radio,
  FormLabel
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import api from '../services/api';
import { Client, RefundCalculation, ApplicationStatus } from '../shared/types';

interface ApplicationActionDialogProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  currentClientName: string;
  applicationStatus: ApplicationStatus;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface ActionFormData {
  actionType: 'cancel' | 'change_guarantor';
  cancellationType?: string;
  toClientId?: string;
  reason: string;
  candidateInLebanon?: boolean;
  candidateDeparted?: boolean;
  customRefundAmount?: number;
  notes: string;
}

interface CancellationOptions {
  canCancel: boolean;
  availableTypes: string[];
  warnings: string[];
  refundEstimate?: RefundCalculation;
}

const ApplicationActionDialog: React.FC<ApplicationActionDialogProps> = ({
  open,
  onClose,
  applicationId,
  candidateName,
  currentClientName,
  applicationStatus,
  onSuccess,
  onError
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [cancellationOptions, setCancellationOptions] = useState<CancellationOptions | null>(null);
  const [refundCalculation, setRefundCalculation] = useState<RefundCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculatingRefund, setCalculatingRefund] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ActionFormData>({
    defaultValues: {
      actionType: 'cancel',
      cancellationType: '',
      toClientId: '',
      reason: '',
      candidateInLebanon: false,
      candidateDeparted: false,
      customRefundAmount: undefined,
      notes: ''
    }
  });

  const watchedActionType = watch('actionType');
  const watchedCancellationType = watch('cancellationType');
  const watchedCandidateInLebanon = watch('candidateInLebanon');
  const watchedCandidateDeparted = watch('candidateDeparted');

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetchCancellationOptions();
      fetchClients();
    }
  }, [open]);

  // Calculate refund when conditions change
  useEffect(() => {
    if (open && watchedActionType === 'cancel' && watchedCancellationType) {
      calculateRefund();
    }
  }, [open, watchedActionType, watchedCancellationType]);

  const fetchCancellationOptions = async () => {
    try {
      const response = await api.get(`/applications/${applicationId}/cancellation-options`);
      setCancellationOptions(response.data);
      if (response.data.availableTypes.length > 0) {
        setValue('cancellationType', response.data.availableTypes[0]);
      }
    } catch (error) {
      console.error('Failed to fetch cancellation options:', error);
      onError('Failed to load cancellation options');
    }
  };

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
    if (!applicationId || !watchedCancellationType) return;

    setCalculatingRefund(true);
    try {
      const response = await api.post('/applications/calculate-refund', {
        applicationId,
        cancellationType: watchedCancellationType,
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

  const onSubmit = async (data: ActionFormData) => {
    setLoading(true);
    try {
      if (data.actionType === 'cancel') {
        await api.post(`/applications/${applicationId}/cancel`, {
          cancellationType: data.cancellationType,
          reason: data.reason,
          candidateInLebanon: data.candidateInLebanon,
          candidateDeparted: data.candidateDeparted,
          customRefundAmount: data.customRefundAmount,
          notes: data.notes
        });
        onSuccess('Application cancelled successfully');
      } else {
        // Guarantor change workflow: Cancel current application and create new one
        await api.post('/guarantor-changes/process', {
          originalApplicationId: applicationId,
          toClientId: data.toClientId,
          reason: data.reason,
          candidateInLebanon: data.candidateInLebanon,
          candidateDeparted: data.candidateDeparted,
          customRefundAmount: data.customRefundAmount,
          notes: data.notes
        });
        onSuccess('Guarantor change processed successfully - new application created');
      }
      handleClose();
    } catch (error: any) {
      console.error('Failed to process action:', error);
      onError(error.response?.data?.error || 'Failed to process action');
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

  const getCancellationTypeInfo = (type: string) => {
    const typeInfo: Record<string, { label: string; description: string; color: string }> = {
      'pre_arrival': {
        label: 'Pre-Arrival Cancellation',
        description: 'Client cancels before candidate arrival',
        color: 'warning'
      },
      'post_arrival_within_3_months': {
        label: 'Post-Arrival (Within 3 months)',
        description: 'Client cancels within 3 months of arrival',
        color: 'info'
      },
      'post_arrival_after_3_months': {
        label: 'Post-Arrival (After 3 months)',
        description: 'Client cancels after 3 months of arrival',
        color: 'error'
      },
      'candidate_cancellation': {
        label: 'Candidate Cancellation',
        description: 'Candidate decides to terminate contract',
        color: 'secondary'
      }
    };
    return typeInfo[type] || { label: type, description: '', color: 'default' };
  };

  const isPreArrival = applicationStatus === ApplicationStatus.PENDING_MOL || 
                      applicationStatus === ApplicationStatus.MOL_AUTH_RECEIVED ||
                      applicationStatus === ApplicationStatus.VISA_PROCESSING ||
                      applicationStatus === ApplicationStatus.VISA_RECEIVED;

  const isPostArrival = applicationStatus === ApplicationStatus.WORKER_ARRIVED ||
                       applicationStatus === ApplicationStatus.LABOUR_PERMIT_PROCESSING ||
                       applicationStatus === ApplicationStatus.RESIDENCY_PERMIT_PROCESSING ||
                       applicationStatus === ApplicationStatus.ACTIVE_EMPLOYMENT;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Application Actions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Candidate: {candidateName} | Current Client: {currentClientName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* Action Type Selection */}
            <Grid item xs={12}>
              <FormLabel component="legend">Choose Action</FormLabel>
              <Controller
                name="actionType"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    {...field}
                    row
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setValue('cancellationType', '');
                      setValue('toClientId', '');
                    }}
                  >
                    <FormControlLabel 
                      value="cancel" 
                      control={<Radio />} 
                      label="Cancel Application" 
                    />
                    <FormControlLabel 
                      value="change_guarantor" 
                      control={<Radio />} 
                      label="Change Guarantor" 
                    />
                  </RadioGroup>
                )}
              />
            </Grid>

            {/* Cancellation Type Selection */}
            {watchedActionType === 'cancel' && cancellationOptions && (
              <Grid item xs={12}>
                <Controller
                  name="cancellationType"
                  control={control}
                  rules={{ required: 'Cancellation type is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.cancellationType}>
                      <InputLabel>Cancellation Type</InputLabel>
                      <Select
                        {...field}
                        label="Cancellation Type"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        {cancellationOptions.availableTypes.map((type) => {
                          const typeInfo = getCancellationTypeInfo(type);
                          return (
                            <MenuItem key={type} value={type}>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {typeInfo.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {typeInfo.description}
                                </Typography>
                              </Box>
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            )}

            {/* New Client Selection - Only for Guarantor Change */}
            {watchedActionType === 'change_guarantor' && (
              <Grid item xs={12}>
                <Controller
                  name="toClientId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.toClientId}>
                      <InputLabel>New Client (To) - Optional</InputLabel>
                      <Select
                        {...field}
                        label="New Client (To) - Optional"
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
            )}

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
                    label={watchedActionType === 'cancel' ? 'Reason for Cancellation' : 'Reason for Change'}
                    multiline
                    rows={2}
                    error={!!errors.reason}
                    helperText={errors.reason?.message}
                  />
                )}
              />
            </Grid>

            {/* Candidate Status - Only for Post-Arrival Cancellations */}
            {watchedActionType === 'cancel' && isPostArrival && (
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
                          label="Candidate is staying in Lebanon"
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
            )}

            {/* Refund Calculation */}
            {watchedActionType === 'cancel' && refundCalculation && (
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

            {/* Warnings */}
            {cancellationOptions?.warnings && cancellationOptions.warnings.length > 0 && (
              <Grid item xs={12}>
                {cancellationOptions.warnings.map((warning, index) => (
                  <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                    {warning}
                  </Alert>
                ))}
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
                    helperText="Any additional information about this action"
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
          {loading ? <CircularProgress size={20} /> : 
           watchedActionType === 'cancel' ? 'Process Cancellation' : 'Process Guarantor Change'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationActionDialog;
