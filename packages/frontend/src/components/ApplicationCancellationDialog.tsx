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
  Radio,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  InputAdornment,
  Collapse,
  IconButton,
  Tooltip,
  Autocomplete
} from '@mui/material';
import {
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Info as InfoIcon,
  Flight as FlightIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  SwapHoriz as SwapIcon,
  LocalShipping as DeportIcon,
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../shared/types';

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
  overrideFee?: number;
  candidateInLebanon: boolean;
  candidateDeparted: boolean;
  newClientId?: string;
  deportCandidate: boolean;
  nextAction?: string;
  keepWaiting?: boolean;
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
  const { user } = useAuth();
  const [options, setOptions] = useState<CancellationOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<CancellationFormData>({
    cancellationType: '',
    reason: '',
    notes: '',
    candidateInLebanon: false,
    candidateDeparted: false,
    deportCandidate: false,
    nextAction: '',
    newClientId: undefined,
    keepWaiting: false
  });

  useEffect(() => {
    if (open) {
      fetchCancellationOptions();
      fetchClients();
      resetForm();
    }
  }, [open, applicationId]);

  // Set candidateInLebanon based on cancellation type (not application status)
  useEffect(() => {
    console.log('useEffect triggered with formData.cancellationType:', formData.cancellationType);
    
    // Show next actions for ANY post-arrival cancellation type
    const isPostArrival = Boolean(formData.cancellationType && (
      formData.cancellationType.includes('post_arrival') || 
      formData.cancellationType === 'post_arrival_within_3_months' ||
      formData.cancellationType === 'post_arrival_after_3_months'
    ));
    
    console.log('Is post-arrival cancellation:', isPostArrival);
    setFormData(prev => ({
      ...prev,
      candidateInLebanon: isPostArrival
    }));
  }, [formData.cancellationType]);

  const resetForm = () => {
    setFormData({
      cancellationType: '',
      reason: '',
      notes: '',
      candidateInLebanon: false,
      candidateDeparted: false,
      deportCandidate: false,
      nextAction: '',
      newClientId: undefined,
      keepWaiting: false
    });
    setActiveStep(0);
    setShowAdvanced(false);
  };


  const fetchCancellationOptions = async () => {
    try {
      const response = await api.get(`/cancellations/${applicationId}/cancellation-options`);
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

  const handleNext = () => {
    if (activeStep === 0 && !formData.cancellationType) {
      onError('Please select a cancellation type');
      return;
    }
    if (activeStep === 1 && !formData.reason.trim()) {
      onError('Please provide a reason for cancellation');
      return;
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow clicking on previous steps or current step
    if (stepIndex <= activeStep) {
      setActiveStep(stepIndex);
    }
  };

  const handleSubmit = async () => {
    if (!formData.cancellationType || !formData.reason.trim()) {
      onError('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/cancellations/${applicationId}/cancel`, formData);
      
      onSuccess(response.data.message || 'Application cancelled successfully');
      onClose();
    } catch (error: any) {
      console.error('Cancellation failed:', error);
      onError(error.response?.data?.error || 'Failed to process cancellation');
    } finally {
      setLoading(false);
    }
  };

  const getCancellationTypeInfo = (type: string) => {
    switch (type) {
      case 'pre_arrival':
        return {
          label: 'Pre-Arrival Cancellation',
          description: 'Cancel before worker arrives in Lebanon. Full refund minus penalty fee.',
          icon: <FlightIcon />,
          color: 'warning'
        };
      case 'post_arrival_within_3_months':
        return {
          label: 'Post-Arrival (Within 3 Months)',
          description: 'Cancel within probation period. Partial refund based on settings.',
          icon: <HomeIcon />,
          color: 'info'
        };
      case 'post_arrival_after_3_months':
        return {
          label: 'Post-Arrival (After 3 Months)',
          description: 'Cancel after probation period. Limited refund may apply.',
          icon: <HomeIcon />,
          color: 'error'
        };
      case 'candidate_cancellation':
        return {
          label: 'Candidate Cancellation',
          description: 'Candidate initiated cancellation. Full refund to client.',
          icon: <PersonIcon />,
          color: 'secondary'
        };
      default:
        return {
          label: type,
          description: '',
          icon: <CancelIcon />,
          color: 'default' as any
        };
    }
  };

  const isPostArrival = formData.cancellationType?.includes('post_arrival');
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  if (!options) {
    return null;
  }

  const steps = [
    'Select Cancellation Type',
    'Provide Reason',
    'Next Actions for Candidate (Post-Arrival Only)',
    'Review & Confirm'
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h5" component="div" fontWeight="bold">
            Cancel Application
          </Typography>
          <Box display="flex" alignItems="center" mt={1}>
            <Chip 
              label={candidateName} 
              icon={<PersonIcon />}
              size="small"
              sx={{ mr: 1 }}
            />
            <Typography variant="body2" color="text.secondary">→</Typography>
            <Chip 
              label={clientName}
              size="small"
              sx={{ ml: 1 }}
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!options.canCancel && (
          <Alert severity="error" sx={{ mb: 2 }}>
            This application cannot be cancelled in its current state.
          </Alert>
        )}

        {options.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold">Important:</Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              {options.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Select Cancellation Type */}
          <Step>
            <StepLabel 
              onClick={() => handleStepClick(0)}
              sx={{ cursor: activeStep >= 0 ? 'pointer' : 'default' }}
            >
              Select Cancellation Type
            </StepLabel>
            <StepContent>
              <Grid container spacing={2}>
                {options.availableTypes.map((type) => {
                  const typeInfo = getCancellationTypeInfo(type);
                  return (
                    <Grid item xs={12} key={type}>
                      <Paper
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: '2px solid',
                          borderColor: formData.cancellationType === type ? `${typeInfo.color}.main` : 'grey.300',
                          bgcolor: formData.cancellationType === type ? `${typeInfo.color}.50` : 'transparent',
                          '&:hover': { bgcolor: `${typeInfo.color}.50` },
                          transition: 'all 0.3s'
                        }}
                        onClick={() => handleInputChange('cancellationType', type)}
                      >
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ bgcolor: `${typeInfo.color}.main`, mr: 2 }}>
                            {typeInfo.icon}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {typeInfo.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {typeInfo.description}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button onClick={handleNext} variant="contained" disabled={!formData.cancellationType}>
                  Next
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 2: Provide Reason */}
          <Step>
            <StepLabel 
              onClick={() => handleStepClick(1)}
              sx={{ cursor: activeStep >= 1 ? 'pointer' : 'default' }}
            >
              Provide Reason
            </StepLabel>
            <StepContent>
              <TextField
                fullWidth
                label="Reason for Cancellation"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                multiline
                rows={3}
                required
                sx={{ mb: 2 }}
                placeholder="Please explain why this application is being cancelled..."
              />
              
              <TextField
                fullWidth
                label="Additional Notes (Optional)"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                multiline
                rows={2}
                sx={{ mb: 2 }}
                placeholder="Any additional information..."
              />

              <Box sx={{ mt: 2 }}>
                <Button onClick={handleBack} sx={{ mr: 1 }}>
                  Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  variant="contained" 
                  disabled={!formData.reason.trim()}
                >
                  Next
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Next Actions for Candidate */}
          <Step>
            <StepLabel 
              onClick={() => handleStepClick(2)}
              sx={{ cursor: activeStep >= 2 ? 'pointer' : 'default' }}
            >
              Next Actions for Candidate (Post-Arrival Only)
            </StepLabel>
            <StepContent>
              <Grid container spacing={2}>

                {(() => {
                  console.log('Rendering step content, candidateInLebanon:', formData.candidateInLebanon);
                  return formData.candidateInLebanon;
                })() ? (
                    <>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" gutterBottom>
                          Next Actions for Candidate
                        </Typography>
                        
                        {/* Move to another client option */}
                        <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.50' }}>
                          <FormControlLabel
                            control={
                              <Radio
                                checked={formData.nextAction === 'move_to_client'}
                                onChange={() => {
                                  handleInputChange('nextAction', 'move_to_client');
                                  handleInputChange('deportCandidate', false);
                                  handleInputChange('keepWaiting', false);
                                }}
                              />
                            }
                            label={
                              <Box display="flex" alignItems="center">
                                <SwapIcon sx={{ mr: 1 }} />
                                Move to another client (Create guarantor change application)
                              </Box>
                            }
                          />
                          
                          {formData.nextAction === 'move_to_client' && (
                            <Box sx={{ mt: 2 }}>
                              <Autocomplete
                                fullWidth
                                options={clients}
                                getOptionLabel={(client) => client.name}
                                value={clients.find(c => c.id === formData.newClientId) || null}
                                onChange={(_, newValue) => {
                                  handleInputChange('newClientId', newValue?.id || '');
                                }}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    label="Select New Client"
                                    placeholder="Type to search clients..."
                                    InputProps={{
                                      ...params.InputProps,
                                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                    }}
                                  />
                                )}
                                renderOption={(props, client) => (
                                  <Box component="li" {...props}>
                                    {client.name}
                                  </Box>
                                )}
                                isOptionEqualToValue={(option, value) => option.id === value?.id}
                                noOptionsText="No clients found"
                              />
                            </Box>
                          )}
                        </Paper>

                        {/* Deport candidate option */}
                        <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.50' }}>
                          <FormControlLabel
                            control={
                              <Radio
                                checked={formData.nextAction === 'deport'}
                                onChange={() => {
                                  handleInputChange('nextAction', 'deport');
                                  handleInputChange('deportCandidate', true);
                                  handleInputChange('newClientId', undefined);
                                  handleInputChange('keepWaiting', false);
                                }}
                              />
                            }
                            label={
                              <Box display="flex" alignItems="center">
                                <DeportIcon sx={{ mr: 1 }} />
                                Deport Candidate (Set status to Deported - not available anymore)
                              </Box>
                            }
                          />
                          {formData.nextAction === 'deport' && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              Candidate will be marked as Deported and will use specific cancellation fee template to calculate loss
                            </Alert>
                          )}
                        </Paper>

                        {/* Keep waiting option */}
                        <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
                          <FormControlLabel
                            control={
                              <Radio
                                checked={formData.nextAction === 'keep_waiting'}
                                onChange={() => {
                                  handleInputChange('nextAction', 'keep_waiting');
                                  handleInputChange('keepWaiting', true);
                                  handleInputChange('newClientId', undefined);
                                  handleInputChange('deportCandidate', false);
                                }}
                              />
                            }
                            label={
                              <Box display="flex" alignItems="center">
                                <PersonIcon sx={{ mr: 1 }} />
                                Keep waiting for client (Set status to Available In Lebanon)
                              </Box>
                            }
                          />
                          {formData.nextAction === 'keep_waiting' && (
                            <Alert severity="success" sx={{ mt: 1 }}>
                              Candidate will be marked as Available In Lebanon. When a new application is created with this candidate, the old client can be retrieved.
                            </Alert>
                          )}
                        </Paper>
                      </Grid>
                    </>
                  ) : (
                    <Grid item xs={12}>
                      <Alert severity="info">
                        <Typography variant="subtitle2" fontWeight="bold">
                          Pre-Arrival Cancellation
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          This is a pre-arrival cancellation. The candidate will be marked as available abroad and no additional actions are required.
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Back
                  </Button>
                  <Button onClick={handleNext} variant="contained">
                    Next
                  </Button>
                </Box>
              </StepContent>
            </Step>

          {/* Step 4: Review & Confirm */}
          <Step>
            <StepLabel 
              onClick={() => handleStepClick(3)}
              sx={{ cursor: activeStep >= 3 ? 'pointer' : 'default' }}
            >
              Review & Confirm
            </StepLabel>
            <StepContent>
              {/* Refund Estimate */}
              {options.refundEstimate && (
                <Card sx={{ mb: 2, bgcolor: 'success.50' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <MoneyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Refund Calculation
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Paid:
                        </Typography>
                        <Typography variant="h6">
                          ${options.refundEstimate.totalPaid}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Estimated Refund:
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          ${options.refundEstimate.finalRefund}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {isSuperAdmin && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                          <Button
                            size="small"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          >
                            Advanced Options
                          </Button>
                          
                          <Collapse in={showAdvanced}>
                            <Box sx={{ mt: 2 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <TextField
                                    fullWidth
                                    label="Override Refund Amount"
                                    type="number"
                                    value={formData.customRefundAmount || ''}
                                    onChange={(e) => handleInputChange(
                                      'customRefundAmount', 
                                      e.target.value ? parseFloat(e.target.value) : undefined
                                    )}
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    helperText="Leave empty to use calculated amount"
                                    size="small"
                                  />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <TextField
                                    fullWidth
                                    label="Override Cancellation Fee"
                                    type="number"
                                    value={formData.overrideFee || ''}
                                    onChange={(e) => handleInputChange(
                                      'overrideFee', 
                                      e.target.value ? parseFloat(e.target.value) : undefined
                                    )}
                                    InputProps={{
                                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    helperText="Custom penalty fee"
                                    size="small"
                                  />
                                </Grid>
                              </Grid>
                              <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="caption">
                                  These overrides will replace the calculated values for this cancellation only.
                                </Typography>
                              </Alert>
                            </Box>
                          </Collapse>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Summary */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cancellation Summary
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Type"
                        secondary={getCancellationTypeInfo(formData.cancellationType).label}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Reason"
                        secondary={formData.reason}
                      />
                    </ListItem>
                    {formData.notes && (
                      <ListItem>
                        <ListItemIcon>
                          <InfoIcon color="info" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Notes"
                          secondary={formData.notes}
                        />
                      </ListItem>
                    )}
                    {formData.newClientId && (
                      <ListItem>
                        <ListItemIcon>
                          <SwapIcon color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Action"
                          secondary={`Reassign to ${clients.find(c => c.id === formData.newClientId)?.name}`}
                        />
                      </ListItem>
                    )}
                    {formData.deportCandidate && (
                      <ListItem>
                        <ListItemIcon>
                          <DeportIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Action"
                          secondary="Deport candidate"
                        />
                      </ListItem>
                    )}
                    {formData.customRefundAmount !== undefined && (
                      <ListItem>
                        <ListItemIcon>
                          <MoneyIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Custom Refund"
                          secondary={`$${formData.customRefundAmount}`}
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  This action cannot be undone
                </Typography>
                <Typography variant="body2">
                  The application will be cancelled, and the appropriate refunds and status changes will be processed.
                </Typography>
              </Alert>

              <Box sx={{ mt: 2 }}>
                <Button onClick={handleBack} sx={{ mr: 1 }}>
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  variant="contained" 
                  color="error"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Confirm Cancellation'}
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationCancellationDialog;