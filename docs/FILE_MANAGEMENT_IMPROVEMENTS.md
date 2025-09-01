# Jobline File Management & PDF Export Improvements

## Overview
This document outlines the improvements made to the Jobline platform's file management system, PDF export functionality, and document organization on Blackblaze B2 storage.

## Changes Made

### 1. PDF Export Enhancements

#### Candidate PDF Export Improvements
- **Added candidate photos**: The PDF now properly fetches and embeds candidate face and full-body photos from Blackblaze
- **Added height and weight fields**: These physical attributes are now displayed in the Personal Information section
- **Improved photo handling**: 
  - Automatically generates signed URLs for private images
  - Gracefully handles missing images with placeholder frames
  - Supports both face and full-body photos
- **Company branding**: PDF footer now includes the actual company name instead of generic text

#### Technical Implementation
- Uses `node-fetch` to download images from Blackblaze URLs
- Converts images to buffers for embedding in PDFs
- Generates fresh signed URLs for expired links
- Includes proper error handling for failed image loads

### 2. Blackblaze B2 File Organization

#### Improved Folder Structure
The new organization system provides a cleaner, more searchable structure:

```
/jobline-companies/
  /{company-name}-{company-id}/
    /candidates/
      /{firstname}-{lastname}-{id}/
        /photos/
          /face-{date}.jpg
          /full-body-{date}.jpg
        /documents/
          /{year}/{month}/{doctype}/
    /clients/
      /{client-name}-{id}/
        /documents/{year}/{month}/{doctype}/
    /applications/
      /{year}/{month}/
        /{app-number}-{client}-{candidate}/
          /documents/{stage}/{doctype}/
          /payments/receipt-{date}.pdf
          /costs/invoice-{date}.pdf
    /company-documents/
      /branding/logo.png
      /certificates/{year}/
      /legal-documents/{year}/
```

#### Benefits of New Structure
- **Company isolation**: Each company's files are completely separated
- **Time-based organization**: Applications organized by year/month for easy archival
- **Descriptive naming**: Folders include names for easier identification
- **Document categorization**: Clear separation between different document types
- **Searchability**: Structured paths make it easy to find old documents

### 3. Document Search Functionality

#### New Search API Endpoints
- `GET /api/documents/search` - Search for documents with filters
- `GET /api/documents/metadata` - Get detailed file metadata
- `POST /api/documents/refresh-url` - Generate new signed URLs

#### Search Capabilities
- Filter by entity type (application, client, candidate, company)
- Search by entity name (partial matching supported)
- Filter by year and month
- Search by document type/name
- Returns signed URLs valid for 1 hour

#### Frontend Search Component
- User-friendly interface for searching documents
- Displays results in a sortable table
- One-click download with automatic URL refresh
- Shows file metadata (size, modified date, type)

### 4. Enhanced File Service Features

#### New Backblaze Service Methods
- `searchFiles()` - Search for files across different time periods and entities
- `listFiles()` - List all files in a specific folder with pagination
- `getFileMetadata()` - Get detailed metadata for a file
- `moveFile()` - Move/rename files within B2 storage

#### Improved Upload Process
- Automatically determines optimal folder structure
- Includes rich metadata with each upload
- Generates readable, sortable filenames
- Handles company name retrieval from database

### 5. Security Improvements

#### Signed URL Management
- All file URLs are now signed and expire after 1 hour
- Automatic URL refresh when accessing files
- Prevents unauthorized access to sensitive documents
- URLs can be regenerated on-demand

#### Access Control
- Files are organized by company ID
- Strict validation of company ownership
- Role-based access control maintained

## Installation Instructions

### 1. Install Dependencies
Run the provided installation script:

**Windows:**
```batch
install-pdf-deps.bat
```

**Linux/Mac:**
```bash
chmod +x install-pdf-deps.sh
./install-pdf-deps.sh
```

Or manually install:
```bash
cd packages/backend
npm install node-fetch@2.7.0 @types/node-fetch@2.6.11
```

### 2. Restart Services
After installation, restart both frontend and backend development servers:
```bash
npm run dev
```

## Usage Guide

### Exporting Candidate PDFs
1. Navigate to the Candidates page
2. Click on a candidate to view details
3. Click the "Export PDF" button
4. The PDF will download with photos and all information included

### Searching for Old Documents
1. Click the "Search Documents" button (add this to your UI where needed)
2. Select filters:
   - Document type (application, client, candidate, company)
   - Entity name (partial matching supported)
   - Year and month
   - Document name/type
3. Click "Search Documents"
4. Results will show with download buttons
5. Click download to get the file

### File Upload Best Practices
When uploading files, provide metadata for better organization:
- Always include `entityType` and `entityId`
- Add `documentType` for categorization
- For applications, include the `stage` (status)
- For photos, use `documentType: 'face-photo'` or `'full-body-photo'`

## API Examples

### Search for Application Documents
```javascript
// Search for all documents from January 2025 applications
const response = await apiClient.get('/documents/search', {
  params: {
    entityType: 'application',
    year: 2025,
    month: 1,
    limit: 50
  }
});
```

### Upload with Metadata
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('entityType', 'application');
formData.append('entityId', applicationId);
formData.append('documentType', 'passport');
formData.append('documentName', 'Candidate Passport');

const response = await apiClient.post('/files/upload', formData);
```

### Refresh Expired URL
```javascript
const response = await apiClient.post('/documents/refresh-url', {
  key: fileKey,
  expiresIn: 3600 // 1 hour
});
const newUrl = response.data.url;
```

## Migration Notes

### Existing Files
- Existing files remain accessible with their current paths
- New uploads will use the improved structure
- Consider running a migration script to reorganize old files (optional)

### Database Compatibility
- No database schema changes required
- File records maintain backward compatibility
- The `cloudinaryId` field now stores B2 file keys

## Troubleshooting

### PDF Export Issues
- **Images not showing**: Check if B2 credentials are configured correctly
- **Slow generation**: Large images may take time to download; consider image optimization
- **Missing height/weight**: Ensure candidate records have these fields populated

### File Search Issues
- **No results found**: Check if files exist in the new folder structure
- **Access denied**: Verify user has proper role permissions
- **URLs expired**: Use the refresh-url endpoint to get new signed URLs

### Blackblaze Configuration
Ensure these environment variables are set in `packages/backend/.env`:
```
B2_KEY_ID=your_key_id
B2_APPLICATION_KEY=your_app_key
B2_BUCKET_NAME=your_bucket_name
B2_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
B2_REGION=eu-central-003
```

## Benefits Summary

1. **Better Organization**: Files are now organized in a logical, searchable structure
2. **Enhanced Security**: All files use signed URLs with expiration
3. **Improved PDFs**: Candidate exports include photos and physical attributes
4. **Historical Access**: Easy searching and retrieval of old application documents
5. **Company Isolation**: Each company's data is completely separated
6. **Scalability**: Structure supports growth and long-term archival

## Future Enhancements

Consider these additional improvements:
1. Bulk file operations (download multiple files as ZIP)
2. Automatic file archival after X months
3. File versioning for document updates
4. OCR for searchable PDF content
5. Thumbnail generation for images
6. Audit log for file access
7. Automated backup to secondary storage

## Support

For issues or questions:
1. Check the error logs in the backend console
2. Verify B2 credentials and bucket configuration
3. Ensure proper role permissions for users
4. Contact the development team for assistance