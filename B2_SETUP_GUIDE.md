# Backblaze B2 Setup & File Organization Guide

## Date: August 30, 2025

---

## 🚨 URGENT: Fix B2 Credentials on Render

The error "Malformed Access Key Id" indicates your Backblaze B2 credentials are not properly set in Render. 

### Steps to Fix:

1. **Go to Backblaze B2 Console:**
   - Log in to your Backblaze account
   - Navigate to "App Keys" section
   - Create a new Application Key or use existing one
   - You'll get:
     - `keyID` (looks like: `0026aeee819e83`)
     - `applicationKey` (looks like: `K003c802de1edc88d4c4f76f7dfdf55ea95137ec46a`)

2. **Update Render Environment Variables:**
   Go to your Render dashboard > Your Service > Environment

   ```bash
   B2_KEY_ID=0026aeee819e83  # Your actual key ID (no quotes)
   B2_APPLICATION_KEY=K003c802de1edc88d4c4f76f7dfdf55ea95137ec46a  # Your actual app key
   B2_BUCKET_NAME=jobline-files
   B2_BUCKET_ID=d2765acefe9ee8b1998e0813  # From your bucket details
   B2_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
   B2_REGION=eu-central-003
   ```

   ⚠️ **IMPORTANT:** 
   - Do NOT include quotes around the values
   - Make sure there are no extra spaces
   - The key ID should be about 12-13 characters
   - The application key should be about 31 characters

3. **Restart your Render service** after updating variables

---

## 📁 New Organized Folder Structure

I've implemented a highly organized folder structure for all uploads. Files are now organized in a clean, exportable hierarchy:

### Folder Structure Pattern:

```
/company-{companyId}/
  ├── /branding/
  │   └── logo-2025-08-30.jpg
  │
  ├── /clients/{clientName}-{clientId}/
  │   └── /documents/{year}/{month}/{docType}/
  │       ├── client-id-{uniqueId}.pdf
  │       └── custom-doc-{uniqueId}.pdf
  │
  ├── /candidates/{candidateName}-{candidateId}/
  │   ├── /profile/
  │   │   └── photo-2025-08-30.jpg
  │   └── /documents/{year}/{month}/{docType}/
  │       └── passport-{uniqueId}.pdf
  │
  └── /applications/{appNumber}-{clientName}-{candidateName}/
      ├── /documents/{stage}/{docType}/
      │   ├── mol-authorization-{uniqueId}.pdf
      │   └── visa-application-{uniqueId}.pdf
      ├── /payments/{year}/{month}/
      │   └── receipt-2025-08-30-{uniqueId}.pdf
      └── /costs/{year}/{month}/
          └── invoice-2025-08-30-{uniqueId}.pdf
```

### Real Example:
```
/company-9a37a873/
  ├── /clients/john-smith-a1b2c3d4/
  │   └── /documents/2025/08/client-id/
  │       └── national-id-f6b110f4.pdf
  │
  ├── /candidates/maria-santos-e5f6g7h8/
  │   ├── /profile/
  │   │   └── photo-2025-08-30.jpg
  │   └── /documents/2025/08/passport/
  │       └── passport-scan-i9j0k1l2.pdf
  │
  └── /applications/A1B2C3D4-john-smith-maria-santos/
      ├── /documents/PENDING_MOL/authorization/
      │   └── mol-form-m3n4o5p6.pdf
      └── /payments/2025/08/
          └── receipt-2025-08-30-q7r8s9t0.pdf
```

---

## 🎯 Benefits of This Structure

### 1. **Clean Organization**
- Files are logically grouped by entity
- Easy to find any document
- Clear naming conventions

### 2. **Export Ready**
- Can easily export all files for a specific:
  - Company
  - Client
  - Candidate
  - Application
- Maintains folder structure for archiving

### 3. **Audit Trail**
- Date-based organization for documents
- Clear timestamps in filenames
- Stage-based organization for applications

### 4. **Scalable**
- Works for single company or multi-company setup
- No filename conflicts
- Efficient storage usage

### 5. **Compliance**
- Easy to provide all documents for audits
- Clear document history
- Organized by year/month for retention policies

---

## 🔧 Implementation Details

### File Naming Convention:
- **Spaces** → replaced with hyphens
- **Special characters** → removed
- **Unique ID** → 8-character suffix prevents duplicates
- **Timestamps** → YYYY-MM-DD format
- **Max length** → 50 characters for base name

### Metadata Stored:
- Original filename
- Upload date
- Uploaded by (user ID and name)
- Entity associations
- Document type
- Company ID

---

## 📤 How to Export Files

### Export All Files for a Client:
```bash
# Using AWS CLI (works with B2)
aws s3 sync s3://jobline-files/company-{companyId}/clients/{clientName}-{clientId}/ ./export/client/

# Or using b2 CLI
b2 sync b2://jobline-files/company-{companyId}/clients/{clientName}-{clientId}/ ./export/client/
```

### Export All Application Documents:
```bash
aws s3 sync s3://jobline-files/company-{companyId}/applications/{appFolder}/ ./export/application/
```

### Export Everything for a Company:
```bash
aws s3 sync s3://jobline-files/company-{companyId}/ ./export/company/
```

---

## 🔐 Security Considerations

1. **Signed URLs:** All file access uses time-limited signed URLs
2. **Company Isolation:** Each company's files are completely separated
3. **Access Control:** Files can only be accessed by authenticated users of the same company
4. **Audit Trail:** Every upload is logged with user information

---

## 📝 Frontend Integration

When uploading files, include metadata for better organization:

```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('entityType', 'client');
formData.append('entityId', clientId);
formData.append('documentType', 'client-id'); // or 'passport', 'contract', etc.
formData.append('documentName', 'National ID Card');
```

---

## 🚀 Next Steps

1. **Fix B2 Credentials** on Render (see top of document)
2. **Test Upload** with the new structure
3. **Consider Adding:**
   - Bulk export functionality
   - Archive old files after X years
   - Duplicate detection
   - File versioning

---

## 📊 Storage Estimation

With this structure, for a typical agency:
- **100 clients** × 5 documents = 500 files
- **200 candidates** × 10 documents = 2,000 files  
- **150 applications** × 15 documents = 2,250 files
- **Total:** ~5,000 files

At average 500KB per file = 2.5GB storage needed

Backblaze B2 pricing: $0.005/GB/month = **$0.0125/month** for storage

---

## ⚠️ Important Notes

1. **Don't change** existing file keys in the database
2. **New uploads** will use the new structure
3. **Old files** will remain accessible at their current locations
4. Files are **never deleted** from B2 unless explicitly requested
5. **Test in development** before deploying to production

---

**Document prepared by:** Claude
**Date:** August 30, 2025
**Version:** 1.0
