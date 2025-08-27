import React, { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Alert,
  Paper,
  Chip,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
} from '@mui/icons-material'
import api from '../services/api'

interface FileUploadProps {
  entityType: 'application' | 'client' | 'candidate'
  entityId: string
  fileType?: 'document' | 'image' | 'any'
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
  onUploadComplete?: (files: UploadedFile[]) => void
  existingFiles?: UploadedFile[]
}

export interface UploadedFile {
  id: string
  fileName: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedAt: string
  uploadedBy?: string
}

const FileUpload: React.FC<FileUploadProps> = ({
  entityType,
  entityId,
  fileType = 'any',
  maxFiles = 10,
  maxSizeMB = 10,
  accept,
  onUploadComplete,
  existingFiles = [],
}) => {
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const getAcceptTypes = () => {
    if (accept) return accept
    switch (fileType) {
      case 'document':
        return '.pdf,.doc,.docx,.txt,.rtf'
      case 'image':
        return 'image/*'
      default:
        return '.pdf,.doc,.docx,.txt,.rtf,image/*'
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon />
    if (mimeType === 'application/pdf') return <PdfIcon />
    if (mimeType.includes('word') || mimeType.includes('document')) return <DocIcon />
    return <FileIcon />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles) return

    // Validate file count
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Validate file sizes
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    const oversizedFiles = Array.from(selectedFiles).filter(f => f.size > maxSizeBytes)
    if (oversizedFiles.length > 0) {
      setError(`Files must be smaller than ${maxSizeMB}MB`)
      return
    }

    setError('')
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      Array.from(selectedFiles).forEach(file => {
        formData.append('files', file)
      })
      formData.append('entityType', entityType)
      formData.append('entityId', entityId)

      const response = await api.post<UploadedFile[]>('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setUploadProgress(progress)
        },
      })

      const uploadedFiles = response.data || []
      const updatedFiles = [...files, ...uploadedFiles]
      setFiles(updatedFiles)
      
      if (onUploadComplete) {
        onUploadComplete(updatedFiles)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload files')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // Reset input
      event.target.value = ''
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return
    }

    try {
      await api.delete(`/files/${fileId}`)
      const updatedFiles = files.filter(f => f.id !== fileId)
      setFiles(updatedFiles)
      
      if (onUploadComplete) {
        onUploadComplete(updatedFiles)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete file')
    }
  }

  const handleViewFile = (file: UploadedFile) => {
    // Open file in new tab
    window.open(file.url, '_blank')
  }

  return (
    <Box>
      <Box mb={2}>
        <input
          type="file"
          accept={getAcceptTypes()}
          multiple={maxFiles > 1}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="file-upload-input"
          disabled={uploading}
        />
        <label htmlFor="file-upload-input">
          <Button
            variant="outlined"
            component="span"
            startIcon={<UploadIcon />}
            disabled={uploading || files.length >= maxFiles}
          >
            Upload Files
          </Button>
        </label>
        <Typography variant="caption" display="block" color="textSecondary" mt={1}>
          {fileType === 'image' ? 'Images only' : fileType === 'document' ? 'Documents only' : 'Any file type'}.
          Max {maxSizeMB}MB per file. {maxFiles - files.length} of {maxFiles} slots available.
        </Typography>
      </Box>

      {uploading && (
        <Box mb={2}>
          <Typography variant="body2" gutterBottom>
            Uploading...
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {files.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Uploaded Files ({files.length})
          </Typography>
          <List dense>
            {files.map((file) => (
              <ListItem
                key={file.id}
                button
                onClick={() => handleViewFile(file)}
              >
                <Box display="flex" alignItems="center" gap={1} width="100%">
                  {getFileIcon(file.mimeType)}
                  <ListItemText
                    primary={file.originalName}
                    secondary={
                      <Box display="flex" gap={1} alignItems="center">
                        <Typography variant="caption">
                          {formatFileSize(file.size)}
                        </Typography>
                        <Typography variant="caption">
                          • {new Date(file.uploadedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFile(file.id)
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  )
}

export default FileUpload
