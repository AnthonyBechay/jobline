# Bug Fixes - August 29, 2025

## Issues Fixed

### 1. Candidate Screen - Nationalities API Error (404)
**Problem:** The nationalities endpoint was returning 404 because it required Super Admin permissions.

**Solution:** Modified `/packages/backend/src/routes/setting.routes.ts` to:
- Move the `/nationalities` endpoint before the `superAdminOnly` middleware
- Made it accessible to all authenticated users (Admin and Super Admin)
- Kept the default nationalities list fallback

**Changes:**
- The nationalities endpoint is now accessible at `/api/settings/nationalities` for all authenticated users
- The frontend will no longer get 404 errors when fetching nationalities

### 2. Financial Page - Applications Dropdown Not Showing
**Problem:** The applications dropdown in the Financial page was empty or not showing applications properly.

**Solution:** Modified `/packages/frontend/src/pages/Financial.tsx` to:
- Handle both response formats from the applications API (`applications` and `data` fields)
- Filter out invalid applications without IDs
- Add fallback text for missing client/candidate names
- Improved error handling for the dropdown

**Changes:**
- Applications dropdown now properly displays all applications
- Shows "Unknown Client" or "Unknown Candidate" if data is missing
- More robust data fetching that handles different API response formats

### 3. Applications Page - Document Upload Feature
**Problem:** Documents in the application page didn't have upload functionality.

**Solution:** Enhanced `/packages/frontend/src/pages/Applications.tsx` to:
- Added file upload buttons next to each document
- Integrated with existing Backblaze B2 backend service
- Added visual indicator for required documents (red "Required" chip)
- Added upload progress indicator (circular progress)
- Automatically updates document status to "Received" after successful upload
- Shows list of uploaded files with download links
- Supports multiple file types (images, PDFs, Word, Excel, text, CSV)

**Features Added:**
- Upload button next to each document (both office and client documents)
- Required documents are clearly marked with a red chip
- Upload progress indicator during file upload
- Automatic status update to "Received" after upload
- Uploaded files section showing all files with download links
- File size validation (max 10MB)
- Support for various file formats

## Testing Instructions

### 1. Test Nationalities Fix:
1. Login as a regular Admin user
2. Go to Candidates page
3. Click "Add Candidate"
4. The nationality dropdown should populate without errors

### 2. Test Financial Page:
1. Go to Financial page
2. Click "Add Payment" or "Add Cost"
3. The Application dropdown should show all applications with format:
   `#[ID] - [Client Name] - [Candidate Name]`

### 3. Test Document Upload:
1. Go to Applications page
2. Open any application details
3. In the Document Checklist section:
   - Required documents will show a red "Required" chip
   - Click the upload icon next to any document
   - Select a file (max 10MB)
   - The upload icon will show a progress spinner
   - After upload, the document status automatically changes to "Received"
   - Uploaded files appear in the "Uploaded Files" section below
   - Click the download icon to verify file access

## Backend Requirements
The following environment variables must be set for file uploads to work:
- `B2_ENDPOINT`
- `B2_REGION`
- `B2_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET_NAME`
- `B2_BUCKET_ID` (optional, for public URLs)

## Notes
- All file uploads are stored in Backblaze B2
- Files are organized by company/entity type/entity ID
- Signed URLs are generated for secure file access (expire after 1 hour by default)
- The system supports uploading documents for applications, candidates, and clients
