import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  FolderOpen as FolderOpenIcon,
  Description as FileIcon,
  Business as CompanyIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  Clear as ClearIcon,
  CloudDownload as CloudDownloadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import { format } from 'date-fns';

interface DocumentManagementProps {
  onBack: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

interface SearchResult {
  key: string;
  fileName: string;
  size: number;
  lastModified: string;
  url: string;
  entityInfo: {
    type?: string;
    applicationNumber?: string;
  };
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DocumentManagement: React.FC<DocumentManagementProps> = ({ onBack, onError, onSuccess }) => {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<SearchResult | null>(null);
  const [searchParams, setSearchParams] = useState({
    entityType: '',
    entityName: '',
    year: '',
    month: '',
    documentType: '',
  });
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    byType: {} as Record<string, number>
  });

  const handleSearch = async () => {
    try {
      setSearching(true);
      setSelectedFiles(new Set());
      
      const params = new URLSearchParams();
      if (searchParams.entityType) params.append('entityType', searchParams.entityType);
      if (searchParams.entityName) params.append('entityName', searchParams.entityName);
      if (searchParams.year) params.append('year', searchParams.year);
      if (searchParams.month) params.append('month', searchParams.month);
      if (searchParams.documentType) params.append('documentType', searchParams.documentType);
      params.append('limit', '500');
      
      const response = await api.get(`/documents/search?${params.toString()}`);
      const files = response.data.files || [];
      setResults(files);
      
      // Calculate stats
      let totalSize = 0;
      const byType: Record<string, number> = {};
      
      files.forEach((file: SearchResult) => {
        totalSize += file.size;
        const type = file.entityInfo?.type || 'other';
        byType[type] = (byType[type] || 0) + 1;
      });
      
      setStats({
        totalFiles: files.length,
        totalSize,
        byType
      });
      
      if (files.length === 0) {
        onSuccess('No documents found matching your search criteria');
      } else {
        onSuccess(`Found ${files.length} document${files.length !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      onError('Failed to search documents. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleDownload = async (file: SearchResult) => {
    try {
      const response = await api.post('/documents/refresh-url', {
        key: file.key,
        expiresIn: 3600,
      });
      
      window.open(response.data.url, '_blank');
      onSuccess(`Downloading ${file.fileName}`);
    } catch (error) {
      console.error('Download error:', error);
      onError('Failed to download file. Please try again.');
    }
  };

  const handleDelete = async (file: SearchResult) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    try {
      // Note: Backend implementation needed
      onSuccess('File deletion functionality will be implemented in the next update');
      
      // When implemented:
      // await apiClient.delete(`/files/${fileToDelete.key}`);
      // setResults(results.filter(r => r.key !== fileToDelete.key));
      // onSuccess(`Deleted ${fileToDelete.fileName}`);
      
    } catch (error) {
      console.error('Delete error:', error);
      onError('Failed to delete file. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleBulkDownload = async () => {
    const filesToDownload = results.filter(f => selectedFiles.has(f.key));
    
    for (const file of filesToDownload) {
      await handleDownload(file);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const toggleFileSelection = (key: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    setSelectedFiles(newSelection);
  };

  const selectAll = () => {
    if (selectedFiles.size === results.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(results.map(r => r.key)));
    }
  };

  const clearFilters = () => {
    setSearchParams({
      entityType: '',
      entityName: '',
      year: '',
      month: '',
      documentType: '',
    });
    setResults([]);
    setStats({
      totalFiles: 0,
      totalSize: 0,
      byType: {}
    });
  };

  const getEntityIcon = (type?: string) => {
    switch (type) {
      case 'application':
        return <WorkIcon sx={{ fontSize: 20 }} />;
      case 'client':
      case 'candidate':
        return <PersonIcon sx={{ fontSize: 20 }} />;
      case 'company':
        return <CompanyIcon sx={{ fontSize: 20 }} />;
      default:
        return <FileIcon sx={{ fontSize: 20 }} />;
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={onBack} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">Document Management</Typography>
      </Box>

      {/* Search Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search Documents
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Search and manage documents across all applications, clients, and candidates
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={searchParams.entityType}
                  onChange={(e) => setSearchParams({ ...searchParams, entityType: e.target.value })}
                  label="Document Type"
                >
                  <MenuItem value="">All types</MenuItem>
                  <MenuItem value="application">Application Documents</MenuItem>
                  <MenuItem value="client">Client Documents</MenuItem>
                  <MenuItem value="candidate">Candidate Documents</MenuItem>
                  <MenuItem value="company">Company Documents</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Name (Client/Candidate)"
                placeholder="e.g., John Doe"
                value={searchParams.entityName}
                onChange={(e) => setSearchParams({ ...searchParams, entityName: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={searchParams.year}
                  onChange={(e) => setSearchParams({ ...searchParams, year: e.target.value })}
                  label="Year"
                >
                  <MenuItem value="">All years</MenuItem>
                  {years.map((year) => (
                    <MenuItem key={year} value={year.toString()}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={searchParams.month}
                  onChange={(e) => setSearchParams({ ...searchParams, month: e.target.value })}
                  label="Month"
                >
                  <MenuItem value="">All months</MenuItem>
                  {months.map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Document Name/Type"
                placeholder="e.g., passport, contract, invoice"
                value={searchParams.documentType}
                onChange={(e) => setSearchParams({ ...searchParams, documentType: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={searching}
                  startIcon={searching ? <CircularProgress size={20} /> : <SearchIcon />}
                >
                  {searching ? 'Searching...' : 'Search Documents'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  disabled={searching}
                  startIcon={<ClearIcon />}
                >
                  Clear
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      {results.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Search Results Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Files
                  </Typography>
                  <Typography variant="h4">{stats.totalFiles}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Size
                  </Typography>
                  <Typography variant="h4">{formatBytes(stats.totalSize)}</Typography>
                </Box>
              </Grid>
              {Object.entries(stats.byType).map(([type, count]) => (
                <Grid item xs={6} md={3} key={type}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {type}
                    </Typography>
                    <Typography variant="h4">{count}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Documents ({results.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {selectedFiles.size > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleBulkDownload}
                    startIcon={<CloudDownloadIcon />}
                  >
                    Download Selected ({selectedFiles.size})
                  </Button>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  onClick={selectAll}
                >
                  {selectedFiles.size === results.length ? 'Deselect All' : 'Select All'}
                </Button>
              </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedFiles.size === results.length && results.length > 0}
                        onChange={selectAll}
                      />
                    </TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>File Name</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Modified</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((file) => (
                    <TableRow key={file.key} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedFiles.has(file.key)}
                          onChange={() => toggleFileSelection(file.key)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getEntityIcon(file.entityInfo?.type)}
                          <Typography variant="body2">
                            {file.entityInfo?.type || 'Document'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {file.fileName}
                          </Typography>
                          {file.entityInfo?.applicationNumber && (
                            <Typography variant="caption" color="text.secondary">
                              App: {file.entityInfo.applicationNumber}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatBytes(file.size)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2">
                            {format(new Date(file.lastModified), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Download">
                          <IconButton size="small" onClick={() => handleDownload(file)}>
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(file)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {results.length === 0 && !searching && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <FolderOpenIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No documents to display
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the search filters above to find documents across your applications, clients, and candidates.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{fileToDelete?.fileName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentManagement;