import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Avatar,
  IconButton,
  Alert,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface CandidatePhotoUploadProps {
  candidateId?: string;
  currentPhotoUrl?: string;
  candidateName?: string;
  onPhotoUploaded: (photoUrl: string) => void;
}

const CandidatePhotoUpload: React.FC<CandidatePhotoUploadProps> = ({
  candidateId,
  currentPhotoUrl,
  candidateName = 'Candidate',
  onPhotoUploaded,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string>(currentPhotoUrl || '');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'candidate');
      formData.append('entityId', candidateId || 'temp');

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const photoUrl = response.data.url;
      setPreview(photoUrl);
      onPhotoUploaded(photoUrl);

      // If we have a candidate ID, update the candidate's photo
      if (candidateId) {
        await api.put(`/candidates/${candidateId}`, { photoUrl });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload photo');
      setPreview(currentPhotoUrl || '');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreview('');
    onPhotoUploaded('');
    if (candidateId) {
      api.put(`/candidates/${candidateId}`, { photoUrl: null })
        .catch(err => console.error('Failed to remove photo:', err));
    }
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
        <Avatar
          src={preview}
          alt={candidateName}
          sx={{
            width: 120,
            height: 120,
            border: '2px solid',
            borderColor: 'divider',
          }}
        >
          {candidateName.split(' ').map(n => n[0]).join('')}
        </Avatar>
        {uploading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
            }}
          >
            <CircularProgress size={40} sx={{ color: 'white' }} />
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Button
          variant="contained"
          component="label"
          startIcon={<PhotoIcon />}
          disabled={uploading}
          size="small"
        >
          {preview ? 'Change Photo' : 'Upload Photo'}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleFileSelect}
          />
        </Button>
        {preview && (
          <IconButton
            color="error"
            onClick={handleRemovePhoto}
            disabled={uploading}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
        Accepted formats: JPG, PNG, GIF (max 5MB)
      </Typography>
    </Box>
  );
};

export default CandidatePhotoUpload;
