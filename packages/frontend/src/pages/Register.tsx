import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, TextField, Button, Typography, Alert, Container, Divider } from '@mui/material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Register company and super admin
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        companyName: formData.companyName,
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // Store token and redirect
      localStorage.setItem('token', response.data.token);
      
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard'; // Force reload to update auth context
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography variant="h4" align="center" gutterBottom>
            Create Your Recruitment Office
          </Typography>
          
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
            Set up your agency account to start managing domestic worker recruitment
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Registration successful! Setting up your office...
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Company Information */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Office Information
            </Typography>
            
            <TextField
              fullWidth
              margin="normal"
              label="Company/Office Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              placeholder="e.g., Beirut Recruitment Agency"
              helperText="This will be your office name in the system"
            />

            <Divider sx={{ my: 3 }} />

            {/* Admin Information */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Administrator Account
            </Typography>
            
            <TextField
              fullWidth
              margin="normal"
              label="Your Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              helperText="You'll use this to login"
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              helperText="At least 6 characters"
            />
            
            <TextField
              fullWidth
              margin="normal"
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || success}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? 'Creating Office...' : 'Create Office & Admin Account'}
            </Button>
          </form>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Already have an office account?
            </Typography>
            <Button
              color="primary"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Login to existing office
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;