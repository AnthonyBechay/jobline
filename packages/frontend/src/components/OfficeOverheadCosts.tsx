import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Grid,
  Alert,
  FormControlLabel,
  Checkbox,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import api from '../services/api';


interface OverheadCost {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  costDate: string;
  category: string;
  recurring: boolean;
  recurringFrequency?: string;
  createdAt: string;
  createdBy: {
    name: string;
  };
}

interface OverheadCostFormData {
  name: string;
  description: string;
  amount: number;
  currency: string;
  costDate: string;
  category: string;
  recurring: boolean;
  recurringFrequency: string;
}

const OfficeOverheadCosts: React.FC = () => {
  const [costs, setCosts] = useState<OverheadCost[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<OverheadCost | null>(null);
  const [formData, setFormData] = useState<OverheadCostFormData>({
    name: '',
    description: '',
    amount: 0,
    currency: 'USD',
    costDate: new Date().toISOString().split('T')[0],
    category: '',
    recurring: false,
    recurringFrequency: 'monthly'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categories = [
    'Rent',
    'Utilities',
    'Salaries',
    'Office Supplies',
    'Marketing',
    'Insurance',
    'Legal Fees',
    'Technology',
    'Travel',
    'Other'
  ];

  const currencies = ['USD', 'LBP', 'EUR'];
  const recurringFrequencies = ['monthly', 'quarterly', 'yearly'];

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/office-overhead');
      setCosts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch overhead costs:', error);
      setError('Failed to load overhead costs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cost?: OverheadCost) => {
    if (cost) {
      setEditingCost(cost);
      setFormData({
        name: cost.name,
        description: cost.description || '',
        amount: cost.amount,
        currency: cost.currency,
        costDate: cost.costDate.split('T')[0],
        category: cost.category,
        recurring: cost.recurring,
        recurringFrequency: cost.recurringFrequency || 'monthly'
      });
    } else {
      setEditingCost(null);
      setFormData({
        name: '',
        description: '',
        amount: 0,
        currency: 'USD',
        costDate: new Date().toISOString().split('T')[0],
        category: '',
        recurring: false,
        recurringFrequency: 'monthly'
      });
    }
    setDialogOpen(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCost(null);
    setError(null);
  };

  const handleInputChange = (field: keyof OverheadCostFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.category || formData.amount <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      if (editingCost) {
        await api.put(`/office-overhead/${editingCost.id}`, formData);
        setSuccess('Overhead cost updated successfully');
      } else {
        await api.post('/office-overhead', formData);
        setSuccess('Overhead cost created successfully');
      }
      
      handleCloseDialog();
      fetchCosts();
    } catch (error: any) {
      console.error('Failed to save overhead cost:', error);
      setError(error.response?.data?.error || 'Failed to save overhead cost');
    }
  };

  const handleDelete = async (costId: string) => {
    if (!window.confirm('Are you sure you want to delete this overhead cost?')) {
      return;
    }

    try {
      await api.delete(`/office-overhead/${costId}`);
      setSuccess('Overhead cost deleted successfully');
      fetchCosts();
    } catch (error: any) {
      console.error('Failed to delete overhead cost:', error);
      setError(error.response?.data?.error || 'Failed to delete overhead cost');
    }
  };

  const getTotalByCategory = () => {
    const totals: { [key: string]: number } = {};
    costs.forEach(cost => {
      totals[cost.category] = (totals[cost.category] || 0) + cost.amount;
    });
    return totals;
  };

  const getTotalAmount = () => {
    return costs.reduce((sum, cost) => sum + cost.amount, 0);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Office Overhead Costs
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Cost
        </Button>
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

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Overhead Costs
              </Typography>
              <Typography variant="h4">
                {formatCurrency(getTotalAmount(), 'USD')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="secondary">
                Total Records
              </Typography>
              <Typography variant="h4">
                {costs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Costs by Category
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(getTotalByCategory()).map(([category, total]) => (
              <Grid item key={category}>
                <Chip
                  label={`${category}: ${formatCurrency(total, 'USD')}`}
                  color="primary"
                  variant="outlined"
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Costs Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Recurring</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {costs.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{cost.name}</Typography>
                      {cost.description && (
                        <Typography variant="body2" color="text.secondary">
                          {cost.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={cost.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {formatCurrency(cost.amount, cost.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(cost.costDate)}</TableCell>
                    <TableCell>
                      {cost.recurring ? (
                        <Chip
                          label={cost.recurringFrequency}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip label="One-time" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>{cost.createdBy.name}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(cost)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(cost.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCost ? 'Edit Overhead Cost' : 'Add New Overhead Cost'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cost Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
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
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
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
                label="Cost Date"
                type="date"
                value={formData.costDate}
                onChange={(e) => handleInputChange('costDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.recurring}
                    onChange={(e) => handleInputChange('recurring', e.target.checked)}
                  />
                }
                label="Recurring Cost"
              />
            </Grid>
            {formData.recurring && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={formData.recurringFrequency}
                    onChange={(e) => handleInputChange('recurringFrequency', e.target.value)}
                    label="Frequency"
                  >
                    {recurringFrequencies.map((frequency) => (
                      <MenuItem key={frequency} value={frequency}>
                        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name.trim() || !formData.category || formData.amount <= 0}
          >
            {editingCost ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfficeOverheadCosts;
