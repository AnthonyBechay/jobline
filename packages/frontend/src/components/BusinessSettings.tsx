import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon
} from '@mui/icons-material';
import api from '../services/api'

interface CancellationSetting {
  id: string;
  cancellationType: string;
  penaltyFee: number;
  refundPercentage: number;
  nonRefundableFees: string[];
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
  const [editingCancellation, setEditingCancellation] = useState<string | null>(null);
  const [editingLawyer, setEditingLawyer] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCancellationSetting, setNewCancellationSetting] = useState<Partial<CancellationSetting>>({
    cancellationType: 'pre_arrival',
    penaltyFee: 0,
    refundPercentage: 100,
    nonRefundableFees: [],
    monthlyServiceFee: 0,
    active: true
  });

  const cancellationTypes = [
    { value: 'pre_arrival', label: 'Pre-Arrival Cancellation' },
    { value: 'post_arrival', label: 'Post-Arrival Cancellation' },
    { value: 'candidate_cancellation', label: 'Candidate Cancellation' },
    { value: 'contract_termination', label: 'Contract Termination' }
  ];

  const nonRefundableFeeOptions = [
    'Visa Processing',
    'Medical Examination',
    'Documentation',
    'Transportation',
    'Legal Fees',
    'Administrative Fees'
  ];

  useEffect(() => {
    // Add error boundary for component mounting
    try {
      fetchSettings();
    } catch (error) {
      console.error('❌ BusinessSettings component error:', error);
      setError('Failed to initialize business settings');
      setLoading(false);
    }
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔧 Fetching business settings...');
      
      const [cancellationResponse, lawyerResponse] = await Promise.all([
        api.get('/business-settings/cancellation'),
        api.get('/business-settings/lawyer-service')
      ]);

      console.log('✅ Business settings loaded successfully');
      console.log('📊 Cancellation settings:', cancellationResponse.data.data);
      console.log('⚖️ Lawyer service settings:', lawyerResponse.data.data);
      
      setCancellationSettings(cancellationResponse.data.data || []);
      setLawyerServiceSetting(lawyerResponse.data.data || null);
    } catch (error: any) {
      console.error('❌ Failed to fetch business settings:', error);
      
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. Super Admin privileges required.');
      } else if (error.response?.status === 404) {
        setError('Business settings not found. Please contact support.');
      } else {
        setError('Failed to load business settings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleUpdateCancellationSetting = async (setting: CancellationSetting) => {
    try {
      await api.put(`/business-settings/cancellation/${setting.id}`, setting);
      setSuccess('Cancellation setting updated successfully');
      setEditingCancellation(null);
      fetchSettings();
    } catch (error: any) {
      console.error('Failed to update cancellation setting:', error);
      setError(error.response?.data?.error || 'Failed to update cancellation setting');
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

  const handleCancellationSettingChange = (id: string, field: keyof CancellationSetting, value: any) => {
    setCancellationSettings(prev => 
      prev.map(setting => 
        setting.id === id ? { ...setting, [field]: value } : setting
      )
    );
  };

  const handleLawyerServiceSettingChange = (field: keyof LawyerServiceSetting, value: any) => {
    setLawyerServiceSetting(prev => 
      prev ? { ...prev, [field]: value } : null
    );
  };

  const handleCreateCancellationSetting = async () => {
    try {
      setLoading(true);
      const response = await api.post('/business-settings/cancellation', newCancellationSetting);
      setCancellationSettings(prev => [...prev, response.data.data]);
      setCreateDialogOpen(false);
      setNewCancellationSetting({
        cancellationType: 'pre_arrival',
        penaltyFee: 0,
        refundPercentage: 100,
        nonRefundableFees: [],
        monthlyServiceFee: 0,
        active: true
      });
      setSuccess('Cancellation setting created successfully');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create cancellation setting');
    } finally {
      setLoading(false);
    }
  };

  const getCancellationTypeLabel = (type: string) => {
    const found = cancellationTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Business Settings
      </Typography>

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

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Cancellation Settings" />
            <Tab label="Lawyer Service Settings" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Cancellation Fee Templates
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure fee templates for different cancellation scenarios
          </Typography>

          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Create New Cancellation Setting
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Penalty Fee</TableCell>
                  <TableCell>Refund %</TableCell>
                  <TableCell>Monthly Service Fee</TableCell>
                  <TableCell>Max Refund</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cancellationSettings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {getCancellationTypeLabel(setting.cancellationType)}
                      </Typography>
                      {setting.description && (
                        <Typography variant="body2" color="text.secondary">
                          {setting.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCancellation === setting.id ? (
                        <TextField
                          size="small"
                          type="number"
                          value={setting.penaltyFee}
                          onChange={(e) => handleCancellationSettingChange(
                            setting.id, 
                            'penaltyFee', 
                            parseFloat(e.target.value) || 0
                          )}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      ) : (
                        formatCurrency(setting.penaltyFee)
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCancellation === setting.id ? (
                        <TextField
                          size="small"
                          type="number"
                          value={setting.refundPercentage}
                          onChange={(e) => handleCancellationSettingChange(
                            setting.id, 
                            'refundPercentage', 
                            parseFloat(e.target.value) || 0
                          )}
                          inputProps={{ min: 0, max: 100, step: 0.01 }}
                        />
                      ) : (
                        `${setting.refundPercentage}%`
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCancellation === setting.id ? (
                        <TextField
                          size="small"
                          type="number"
                          value={setting.monthlyServiceFee}
                          onChange={(e) => handleCancellationSettingChange(
                            setting.id, 
                            'monthlyServiceFee', 
                            parseFloat(e.target.value) || 0
                          )}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      ) : (
                        formatCurrency(setting.monthlyServiceFee)
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCancellation === setting.id ? (
                        <TextField
                          size="small"
                          type="number"
                          value={setting.maxRefundAmount || ''}
                          onChange={(e) => handleCancellationSettingChange(
                            setting.id, 
                            'maxRefundAmount', 
                            parseFloat(e.target.value) || undefined
                          )}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      ) : (
                        setting.maxRefundAmount ? formatCurrency(setting.maxRefundAmount) : 'No limit'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCancellation === setting.id ? (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={setting.active}
                              onChange={(e) => handleCancellationSettingChange(
                                setting.id, 
                                'active', 
                                e.target.checked
                              )}
                            />
                          }
                          label=""
                        />
                      ) : (
                        <Chip
                          label={setting.active ? 'Active' : 'Inactive'}
                          color={setting.active ? 'success' : 'default'}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCancellation === setting.id ? (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateCancellationSetting(setting)}
                            color="primary"
                          >
                            <SaveIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setEditingCancellation(null)}
                            color="error"
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => setEditingCancellation(setting.id)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Lawyer Service Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure lawyer service fees and charges
          </Typography>

          {lawyerServiceSetting ? (
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Lawyer Fee Cost (Actual Cost)"
                      type="number"
                      value={editingLawyer ? lawyerServiceSetting.lawyerFeeCost : lawyerServiceSetting.lawyerFeeCost}
                      onChange={(e) => handleLawyerServiceSettingChange(
                        'lawyerFeeCost', 
                        parseFloat(e.target.value) || 0
                      )}
                      disabled={!editingLawyer}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Lawyer Fee Charge (Client Charge)"
                      type="number"
                      value={editingLawyer ? lawyerServiceSetting.lawyerFeeCharge : lawyerServiceSetting.lawyerFeeCharge}
                      onChange={(e) => handleLawyerServiceSettingChange(
                        'lawyerFeeCharge', 
                        parseFloat(e.target.value) || 0
                      )}
                      disabled={!editingLawyer}
                      inputProps={{ min: 0, step: 0.01 }}
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
                      label="Active"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {editingLawyer ? (
                        <>
                          <Button
                            variant="contained"
                            startIcon={<SaveIcon />}
                            onClick={() => handleUpdateLawyerServiceSetting(lawyerServiceSetting)}
                          >
                            Save Changes
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={() => setEditingLawyer(false)}
                          >
                            Cancel
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
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Commission Calculation
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Office Commission
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {formatCurrency(lawyerServiceSetting.lawyerFeeCharge - lawyerServiceSetting.lawyerFeeCost)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Commission Rate
                        </Typography>
                        <Typography variant="h6">
                          {lawyerServiceSetting.lawyerFeeCost > 0 
                            ? `${(((lawyerServiceSetting.lawyerFeeCharge - lawyerServiceSetting.lawyerFeeCost) / lawyerServiceSetting.lawyerFeeCharge) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">
                          Status
                        </Typography>
                        <Chip
                          label={lawyerServiceSetting.active ? 'Active' : 'Inactive'}
                          color={lawyerServiceSetting.active ? 'success' : 'default'}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Alert severity="info">
              No lawyer service settings found. Contact your administrator to set up lawyer service configuration.
            </Alert>
          )}
        </TabPanel>
      </Card>

      {/* Create Cancellation Setting Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Cancellation Setting</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Cancellation Type</InputLabel>
                <Select
                  value={newCancellationSetting.cancellationType}
                  onChange={(e) => setNewCancellationSetting(prev => ({ ...prev, cancellationType: e.target.value }))}
                  label="Cancellation Type"
                >
                  {cancellationTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Penalty Fee"
                type="number"
                value={newCancellationSetting.penaltyFee}
                onChange={(e) => setNewCancellationSetting(prev => ({ ...prev, penaltyFee: parseFloat(e.target.value) || 0 }))}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Refund Percentage"
                type="number"
                value={newCancellationSetting.refundPercentage}
                onChange={(e) => setNewCancellationSetting(prev => ({ ...prev, refundPercentage: parseFloat(e.target.value) || 0 }))}
                InputProps={{ endAdornment: '%' }}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monthly Service Fee"
                type="number"
                value={newCancellationSetting.monthlyServiceFee}
                onChange={(e) => setNewCancellationSetting(prev => ({ ...prev, monthlyServiceFee: parseFloat(e.target.value) || 0 }))}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Refund Amount (Optional)"
                type="number"
                value={newCancellationSetting.maxRefundAmount || ''}
                onChange={(e) => setNewCancellationSetting(prev => ({ ...prev, maxRefundAmount: parseFloat(e.target.value) || undefined }))}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newCancellationSetting.active}
                    onChange={(e) => setNewCancellationSetting(prev => ({ ...prev, active: e.target.checked }))}
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                multiline
                rows={2}
                value={newCancellationSetting.description || ''}
                onChange={(e) => setNewCancellationSetting(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCancellationSetting} variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BusinessSettings;
