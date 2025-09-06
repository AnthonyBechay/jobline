import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Collapse,
  Avatar,
  Stack,
  Slider,
  FormHelperText
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon,
  Gavel as GavelIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as CopyIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import api from '../services/api'

interface CancellationSetting {
  id: string;
  cancellationType: string;
  name: string;
  penaltyFee: number;
  refundPercentage: number;
  nonRefundableComponents: string[];  // Changed from nonRefundableFees
  monthlyServiceFee: number;
  maxRefundAmount?: number;
  description?: string;
  active: boolean;
}

interface LawyerServiceSetting {
  id: string;
  lawyerFeeCost: number;
  lawyerFeeCharge: number;
  description?: string;
  active: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`business-settings-tabpanel-${index}`}
      aria-labelledby={`business-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const BusinessSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [cancellationSettings, setCancellationSettings] = useState<CancellationSetting[]>([]);
  const [lawyerServiceSetting, setLawyerServiceSetting] = useState<LawyerServiceSetting | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingLawyer, setEditingLawyer] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  // Dialog states
  const [cancellationDialog, setCancellationDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data: Partial<CancellationSetting>;
  }>({
    open: false,
    mode: 'create',
    data: {}
  });

  const cancellationTypes = [
    { 
      value: 'pre_arrival_client', 
      label: 'Pre-Arrival Client Cancellation',
      description: 'Client cancels before worker arrives in Lebanon',
      color: '#FFA726',
      icon: '💼'
    },
    { 
      value: 'pre_arrival_candidate', 
      label: 'Pre-Arrival Candidate Cancellation',
      description: 'Candidate refuses to come before arrival',
      color: '#9C27B0',
      icon: '👤'
    },
    { 
      value: 'post_arrival_within_3_months', 
      label: 'Post-Arrival (Within 3 Months)',
      description: 'Cancellation during probation period',
      color: '#66BB6A',
      icon: '📅'
    },
    { 
      value: 'post_arrival_after_3_months', 
      label: 'Post-Arrival (After 3 Months)',
      description: 'Cancellation after probation period',
      color: '#42A5F5',
      icon: '📆'
    },
    { 
      value: 'candidate_cancellation', 
      label: 'Candidate Cancellation',
      description: 'Worker initiates the cancellation',
      color: '#EF5350',
      icon: '👤'
    }
  ];

  const nonRefundableComponentOptions = [
    'Visa Processing',
    'Medical Examination',
    'Government Documentation',
    'Transportation',
    'Legal Fees',
    'Administrative Fees',
    'Insurance',
    'Training Costs',
    'Ticket',
    'Government Fees',
    'Office Service',
    'Processing Fee'
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const [cancellationResponse, lawyerResponse] = await Promise.all([
        api.get('/business-settings/cancellation'),
        api.get('/business-settings/lawyer-service')
      ]);
      
      setCancellationSettings(cancellationResponse.data.data || []);
      setLawyerServiceSetting(lawyerResponse.data.data || null);
    } catch (error: any) {
      console.error('Failed to fetch business settings:', error);
      setError('Failed to load business settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleOpenCancellationDialog = (mode: 'create' | 'edit', data?: CancellationSetting) => {
    if (mode === 'create') {
      // Check which types are already configured
      const existingTypes = cancellationSettings.map(s => s.cancellationType);
      const availableTypes = cancellationTypes.filter(t => !existingTypes.includes(t.value));
      
      if (availableTypes.length === 0) {
        setError('All cancellation types are already configured');
        return;
      }
      
      setCancellationDialog({
        open: true,
        mode: 'create',
        data: {
          cancellationType: availableTypes[0].value,
          name: availableTypes[0].label,
          penaltyFee: 0,
          refundPercentage: 100,
          nonRefundableComponents: [],
          monthlyServiceFee: 0,
          active: true
        }
      });
    } else if (data) {
      setCancellationDialog({
        open: true,
        mode: 'edit',
        data: { ...data }
      });
    }
  };

  const handleCloseCancellationDialog = () => {
    setCancellationDialog({
      open: false,
      mode: 'create',
      data: {}
    });
  };

  const handleSaveCancellationSetting = async () => {
    try {
      setLoading(true);
      const { data, mode } = cancellationDialog;
      
      if (mode === 'create') {
        await api.post('/business-settings/cancellation', data);
        setSuccess('Cancellation setting created successfully');
      } else {
        await api.put(`/business-settings/cancellation/${data.id}`, data);
        setSuccess('Cancellation setting updated successfully');
      }
      
      handleCloseCancellationDialog();
      fetchSettings();
    } catch (error: any) {
      console.error('❌ Cancellation setting error:', error.response?.data);
      const errorMessage = error.response?.data?.error || 'Failed to save cancellation setting';
      const details = error.response?.data?.details;
      setError(details ? `${errorMessage}: ${JSON.stringify(details)}` : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancellationSetting = async (id: string, type: string) => {
    if (!confirm(`Are you sure you want to delete the ${getCancellationTypeLabel(type)} setting?`)) return;
    
    try {
      await api.delete(`/business-settings/cancellation/${type}`);
      setSuccess('Cancellation setting deleted successfully');
      fetchSettings();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete cancellation setting');
    }
  };

  const handleUpdateLawyerServiceSetting = async (setting: LawyerServiceSetting) => {
    try {
      if (setting.id) {
        await api.put(`/business-settings/lawyer-service/${setting.id}`, setting);
      } else {
        await api.post('/business-settings/lawyer-service', setting);
      }
      setSuccess('Lawyer service setting updated successfully');
      setEditingLawyer(false);
      fetchSettings();
    } catch (error: any) {
      console.error('Failed to update lawyer service setting:', error);
      setError(error.response?.data?.error || 'Failed to update lawyer service setting');
    }
  };

  const handleLawyerServiceSettingChange = (field: keyof LawyerServiceSetting, value: any) => {
    setLawyerServiceSetting(prev => 
      prev ? { ...prev, [field]: value } : null
    );
  };

  const getCancellationTypeLabel = (type: string) => {
    const found = cancellationTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getCancellationTypeInfo = (type: string) => {
    return cancellationTypes.find(t => t.value === type);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleCopyTemplate = (setting: CancellationSetting) => {
    const existingTypes = cancellationSettings.map(s => s.cancellationType);
    const availableTypes = cancellationTypes.filter(t => !existingTypes.includes(t.value));
    
    if (availableTypes.length === 0) {
      setError('All cancellation types are already configured');
      return;
    }
    
    setCancellationDialog({
      open: true,
      mode: 'create',
      data: {
        ...setting,
        id: undefined,
        cancellationType: availableTypes[0].value,
        name: availableTypes[0].label,
        description: `Copied from ${getCancellationTypeLabel(setting.cancellationType)}`
      }
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <SettingsIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Business Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure cancellation policies and service fees
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              label="Cancellation Policies" 
              icon={<GavelIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Lawyer Service" 
              icon={<BusinessIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Cancellation Fee Templates
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Define refund policies and penalty fees for different cancellation scenarios
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenCancellationDialog('create')}
              sx={{ borderRadius: 2 }}
            >
              Add New Policy
            </Button>
          </Box>

          <Grid container spacing={3}>
            {cancellationSettings.length === 0 ? (
              <Grid item xs={12}>
                <Paper 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    borderRadius: 2,
                    bgcolor: 'grey.50'
                  }}
                >
                  <WarningIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No Cancellation Policies Configured
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Set up cancellation policies to handle refunds and penalties automatically
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenCancellationDialog('create')}
                  >
                    Create First Policy
                  </Button>
                </Paper>
              </Grid>
            ) : (
              cancellationSettings.map((setting) => {
                const typeInfo = getCancellationTypeInfo(setting.cancellationType);
                const isExpanded = expandedCard === setting.id;
                
                return (
                  <Grid item xs={12} md={6} key={setting.id}>
                    <Card 
                      sx={{ 
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: setting.active ? typeInfo?.color : 'grey.300',
                        opacity: setting.active ? 1 : 0.7,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box display="flex" alignItems="center" flex={1}>
                            <Avatar 
                              sx={{ 
                                bgcolor: typeInfo?.color, 
                                mr: 2,
                                width: 48,
                                height: 48
                              }}
                            >
                              <Typography fontSize={24}>{typeInfo?.icon}</Typography>
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="h6" fontWeight="bold">
                                {setting.name || typeInfo?.label}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {typeInfo?.description}
                              </Typography>
                            </Box>
                          </Box>
                          <Box>
                            <Chip 
                              label={setting.active ? 'Active' : 'Inactive'}
                              color={setting.active ? 'success' : 'default'}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Key Metrics */}
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Penalty Fee
                              </Typography>
                              <Typography variant="h6" color="error.dark" fontWeight="bold">
                                {formatCurrency(setting.penaltyFee)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Refund Rate
                              </Typography>
                              <Typography variant="h6" color="success.dark" fontWeight="bold">
                                {setting.refundPercentage}%
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>

                        <Box 
                          sx={{ 
                            mt: 2, 
                            cursor: 'pointer',
                            p: 1,
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                          onClick={() => setExpandedCard(isExpanded ? null : setting.id)}
                        >
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Typography variant="body2" color="primary">
                              {isExpanded ? 'Hide' : 'Show'} Details
                            </Typography>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </Box>
                        </Box>

                        <Collapse in={isExpanded}>
                          <Box sx={{ mt: 2 }}>
                            {setting.monthlyServiceFee > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Monthly Service Fee
                                </Typography>
                                <Typography variant="subtitle1" fontWeight="medium">
                                  {formatCurrency(setting.monthlyServiceFee)}
                                </Typography>
                              </Box>
                            )}
                            
                            {setting.maxRefundAmount && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Max Refund Limit
                                </Typography>
                                <Typography variant="subtitle1" fontWeight="medium">
                                  {formatCurrency(setting.maxRefundAmount)}
                                </Typography>
                              </Box>
                            )}
                            
                            {setting.nonRefundableComponents && setting.nonRefundableComponents.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Non-Refundable Items
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={0.5}>
                                  {setting.nonRefundableComponents.map((component, index) => (
                                    <Chip
                                      key={index}
                                      label={component}
                                      size="small"
                                      variant="outlined"
                                      color="warning"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                            
                            {setting.description && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Notes
                                </Typography>
                                <Typography variant="body2">
                                  {setting.description}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <Box>
                          <Tooltip title="Copy as template">
                            <IconButton size="small" onClick={() => handleCopyTemplate(setting)}>
                              <CopyIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Box>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenCancellationDialog('edit', setting)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteCancellationSetting(setting.id, setting.cancellationType)}
                          >
                            Delete
                          </Button>
                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Lawyer Service Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set up lawyer service fees and client charges
          </Typography>

          {lawyerServiceSetting ? (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Lawyer Fee Cost (Actual Cost to Office)"
                      type="number"
                      value={editingLawyer ? lawyerServiceSetting.lawyerFeeCost : lawyerServiceSetting.lawyerFeeCost}
                      onChange={(e) => handleLawyerServiceSettingChange(
                        'lawyerFeeCost', 
                        parseFloat(e.target.value) || 0
                      )}
                      disabled={!editingLawyer}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Client Charge (What Client Pays)"
                      type="number"
                      value={editingLawyer ? lawyerServiceSetting.lawyerFeeCharge : lawyerServiceSetting.lawyerFeeCharge}
                      onChange={(e) => handleLawyerServiceSettingChange(
                        'lawyerFeeCharge', 
                        parseFloat(e.target.value) || 0
                      )}
                      disabled={!editingLawyer}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={editingLawyer ? lawyerServiceSetting.description || '' : lawyerServiceSetting.description || ''}
                      onChange={(e) => handleLawyerServiceSettingChange('description', e.target.value)}
                      disabled={!editingLawyer}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editingLawyer ? lawyerServiceSetting.active : lawyerServiceSetting.active}
                          onChange={(e) => handleLawyerServiceSettingChange('active', e.target.checked)}
                          disabled={!editingLawyer}
                        />
                      }
                      label="Service Active"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Commission Display */}
                <Typography variant="h6" gutterBottom>
                  Commission Analysis
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Office Profit
                      </Typography>
                      <Typography variant="h5" color="success.dark" fontWeight="bold">
                        {formatCurrency(lawyerServiceSetting.lawyerFeeCharge - lawyerServiceSetting.lawyerFeeCost)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Profit Margin
                      </Typography>
                      <Typography variant="h5" color="info.dark" fontWeight="bold">
                        {lawyerServiceSetting.lawyerFeeCost > 0 
                          ? `${(((lawyerServiceSetting.lawyerFeeCharge - lawyerServiceSetting.lawyerFeeCost) / lawyerServiceSetting.lawyerFeeCharge) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={lawyerServiceSetting.active ? 'Active' : 'Inactive'}
                        color={lawyerServiceSetting.active ? 'success' : 'default'}
                        sx={{ mt: 1 }}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                {editingLawyer ? (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => setEditingLawyer(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={() => handleUpdateLawyerServiceSetting(lawyerServiceSetting)}
                    >
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setEditingLawyer(true)}
                  >
                    Edit Settings
                  </Button>
                )}
              </CardActions>
            </Card>
          ) : (
            <Alert severity="info">
              No lawyer service settings configured. Please contact your administrator.
            </Alert>
          )}
        </TabPanel>
      </Card>

      {/* Cancellation Setting Dialog */}
      <Dialog 
        open={cancellationDialog.open} 
        onClose={handleCloseCancellationDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <GavelIcon sx={{ mr: 1, color: 'primary.main' }} />
            {cancellationDialog.mode === 'create' ? 'Create' : 'Edit'} Cancellation Policy
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Cancellation Type</InputLabel>
                <Select
                  value={cancellationDialog.data.cancellationType || ''}
                  onChange={(e) => {
                    const selectedType = cancellationTypes.find(t => t.value === e.target.value);
                    setCancellationDialog(prev => ({
                      ...prev,
                      data: { 
                        ...prev.data, 
                        cancellationType: e.target.value,
                        name: selectedType?.label || e.target.value
                      }
                    }))
                  }}
                  label="Cancellation Type"
                  disabled={cancellationDialog.mode === 'edit'}
                >
                  {cancellationDialog.mode === 'create' ? (
                    cancellationTypes
                      .filter(type => !cancellationSettings.some(s => s.cancellationType === type.value))
                      .map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box display="flex" alignItems="center">
                            <Typography sx={{ mr: 1 }}>{type.icon}</Typography>
                            <Box>
                              <Typography>{type.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {type.description}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))
                  ) : (
                    cancellationTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))
                  )}
                </Select>
                <FormHelperText>
                  {cancellationTypes.find(t => t.value === cancellationDialog.data.cancellationType)?.description}
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Penalty Fee"
                type="number"
                value={cancellationDialog.data.penaltyFee || 0}
                onChange={(e) => setCancellationDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, penaltyFee: parseFloat(e.target.value) || 0 }
                }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                helperText="Fixed fee deducted from refund"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Typography gutterBottom>
                  Refund Percentage: {cancellationDialog.data.refundPercentage || 100}%
                </Typography>
                <Slider
                  value={cancellationDialog.data.refundPercentage || 100}
                  onChange={(e, value) => setCancellationDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, refundPercentage: value as number }
                  }))}
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={100}
                  sx={{
                    '& .MuiSlider-thumb': {
                      bgcolor: 
                        (cancellationDialog.data.refundPercentage || 100) >= 75 ? 'success.main' :
                        (cancellationDialog.data.refundPercentage || 100) >= 50 ? 'warning.main' :
                        'error.main'
                    },
                    '& .MuiSlider-track': {
                      bgcolor: 
                        (cancellationDialog.data.refundPercentage || 100) >= 75 ? 'success.main' :
                        (cancellationDialog.data.refundPercentage || 100) >= 50 ? 'warning.main' :
                        'error.main'
                    }
                  }}
                />
                <FormHelperText>
                  Percentage of payment to refund (before penalty)
                </FormHelperText>
              </Box>
            </Grid>

            {(cancellationDialog.data.cancellationType === 'post_arrival_after_3_months' || 
              cancellationDialog.data.cancellationType === 'post_arrival_within_3_months') && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Monthly Service Fee"
                  type="number"
                  value={cancellationDialog.data.monthlyServiceFee || 0}
                  onChange={(e) => setCancellationDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, monthlyServiceFee: parseFloat(e.target.value) || 0 }
                  }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  helperText="Deducted per month since arrival"
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Refund Amount (Optional)"
                type="number"
                value={cancellationDialog.data.maxRefundAmount || ''}
                onChange={(e) => setCancellationDialog(prev => ({
                  ...prev,
                  data: { 
                    ...prev.data, 
                    maxRefundAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                  }
                }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                helperText="Leave empty for no limit"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Non-Refundable Items</InputLabel>
                <Select
                  multiple
                  value={cancellationDialog.data.nonRefundableComponents || []}
                  onChange={(e) => setCancellationDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, nonRefundableComponents: e.target.value as string[] }
                  }))}
                  label="Non-Refundable Items"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {nonRefundableComponentOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select fees that won't be refunded to the client
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes / Description (Optional)"
                multiline
                rows={2}
                value={cancellationDialog.data.description || ''}
                onChange={(e) => setCancellationDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, description: e.target.value }
                }))}
                helperText="Additional notes about this policy"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={cancellationDialog.data.active !== false}
                    onChange={(e) => setCancellationDialog(prev => ({
                      ...prev,
                      data: { ...prev.data, active: e.target.checked }
                    }))}
                  />
                }
                label="Policy Active"
              />
            </Grid>

            {/* Preview Section */}
            <Grid item xs={12}>
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="subtitle2" gutterBottom>
                  Refund Calculation Preview
                </Typography>
                <Typography variant="body2">
                  For a $1000 payment:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary={`Base refund (${cancellationDialog.data.refundPercentage || 100}%)`}
                      secondary={formatCurrency((1000 * (cancellationDialog.data.refundPercentage || 100)) / 100)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Minus penalty fee"
                      secondary={`-${formatCurrency(cancellationDialog.data.penaltyFee || 0)}`}
                    />
                  </ListItem>
                  {cancellationDialog.data.monthlyServiceFee ? (
                    <ListItem>
                      <ListItemText 
                        primary="Minus monthly fees (example: 2 months)"
                        secondary={`-${formatCurrency((cancellationDialog.data.monthlyServiceFee || 0) * 2)}`}
                      />
                    </ListItem>
                  ) : null}
                  <ListItem>
                    <ListItemText 
                      primary={<strong>Final refund</strong>}
                      secondary={
                        <strong>
                          {formatCurrency(
                            Math.max(
                              0,
                              ((1000 * (cancellationDialog.data.refundPercentage || 100)) / 100) - 
                              (cancellationDialog.data.penaltyFee || 0) -
                              ((cancellationDialog.data.monthlyServiceFee || 0) * 2)
                            )
                          )}
                        </strong>
                      }
                    />
                  </ListItem>
                </List>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancellationDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveCancellationSetting} 
            variant="contained" 
            disabled={loading || !cancellationDialog.data.cancellationType}
          >
            {cancellationDialog.mode === 'create' ? 'Create' : 'Update'} Policy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BusinessSettings;
