import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Configure Backblaze B2 using S3-compatible API with AWS SDK v3
const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT || 'https://s3.eu-central-003.backblazeb2.com',
  region: process.env.B2_REGION || 'eu-central-003',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: true, // Required for B2
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'jobline-files';

interface UploadOptions {
  folder?: string;
  fileName?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
}

/**
 * Generate organized file path based on entity type and metadata
 * Structure:
 * - /company-{companyId}/
 *   - /clients/{clientName}-{clientId}/
 *     - /documents/{year}/{month}/{docType}/{filename}
 *   - /candidates/{candidateName}-{candidateId}/
 *     - /profile/photo.jpg
 *     - /documents/{year}/{month}/{docType}/{filename}
 *   - /applications/{appNumber}-{clientName}-{candidateName}/
 *     - /documents/{stage}/{docType}/{filename}
 *     - /payments/{year}/{month}/receipt-{date}.pdf
 *     - /costs/{year}/{month}/invoice-{date}.pdf
 */
const generateOrganizedPath = (
  entityType: string,
  entityId: string,
  originalName: string,
  metadata?: Record<string, string>
): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timestamp = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Clean filename: remove special characters, keep extension
  const fileExt = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, fileExt)
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .substring(0, 50); // Limit filename length
  
  // Generate unique but readable filename
  const uniqueId = uuidv4().split('-')[0]; // Just first 8 chars for readability
  
  const companyId = metadata?.companyId || 'unknown';
  const companyFolder = `company-${companyId}`;
  
  let filePath = '';
  
  switch (entityType) {
    case 'candidate': {
      const candidateName = metadata?.candidateName || 'unnamed';
      const cleanCandidateName = candidateName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const candidateFolder = `candidates/${cleanCandidateName}-${entityId.substring(0, 8)}`;
      
      // Check if it's a profile photo
      if (metadata?.documentType === 'photo' || originalName.match(/photo|profile|picture/i)) {
        filePath = `${companyFolder}/${candidateFolder}/profile/photo-${timestamp}${fileExt}`;
      } else {
        const docType = metadata?.documentType || 'general';
        filePath = `${companyFolder}/${candidateFolder}/documents/${year}/${month}/${docType}/${baseName}-${uniqueId}${fileExt}`;
      }
      break;
    }
    
    case 'client': {
      const clientName = metadata?.clientName || 'unnamed';
      const cleanClientName = clientName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const clientFolder = `clients/${cleanClientName}-${entityId.substring(0, 8)}`;
      
      const docType = metadata?.documentType || 'general';
      filePath = `${companyFolder}/${clientFolder}/documents/${year}/${month}/${docType}/${baseName}-${uniqueId}${fileExt}`;
      break;
    }
    
    case 'application': {
      const appNumber = metadata?.applicationNumber || entityId.substring(0, 8);
      const clientName = metadata?.clientName || 'client';
      const candidateName = metadata?.candidateName || 'candidate';
      const cleanClientName = clientName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const cleanCandidateName = candidateName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      
      const appFolder = `applications/${appNumber}-${cleanClientName}-${cleanCandidateName}`;
      
      // Organize by document category
      if (metadata?.documentCategory === 'payment') {
        filePath = `${companyFolder}/${appFolder}/payments/${year}/${month}/receipt-${timestamp}-${uniqueId}${fileExt}`;
      } else if (metadata?.documentCategory === 'cost') {
        filePath = `${companyFolder}/${appFolder}/costs/${year}/${month}/invoice-${timestamp}-${uniqueId}${fileExt}`;
      } else {
        const stage = metadata?.stage || 'general';
        const docType = metadata?.documentType || 'document';
        filePath = `${companyFolder}/${appFolder}/documents/${stage}/${docType}/${baseName}-${uniqueId}${fileExt}`;
      }
      break;
    }
    
    case 'company': {
      // Company documents like logo, certificates, etc.
      const docType = metadata?.documentType || 'general';
      if (docType === 'logo') {
        filePath = `${companyFolder}/branding/logo-${timestamp}${fileExt}`;
      } else {
        filePath = `${companyFolder}/documents/${year}/${month}/${docType}/${baseName}-${uniqueId}${fileExt}`;
      }
      break;
    }
    
    default:
      // Fallback for any other entity types
      filePath = `${companyFolder}/misc/${entityType}/${year}/${month}/${baseName}-${uniqueId}${fileExt}`;
  }
  
  return filePath;
};

/**
 * Upload a file to Backblaze B2 with organized folder structure
 */
export const uploadToB2 = async (
  buffer: Buffer,
  originalName: string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    // Check if B2 credentials are configured
    if (!process.env.B2_KEY_ID || !process.env.B2_APPLICATION_KEY) {
      console.error('Backblaze B2 credentials not configured');
      throw new Error('Storage service not configured. Please contact administrator.');
    }

    // Log credentials (partially, for debugging)
    console.log('B2 Configuration Check:', {
      keyIdLength: process.env.B2_KEY_ID?.length,
      keyIdPrefix: process.env.B2_KEY_ID?.substring(0, 4),
      hasAppKey: !!process.env.B2_APPLICATION_KEY,
      endpoint: process.env.B2_ENDPOINT,
      bucket: BUCKET_NAME
    });
    
    // Generate organized file path
    let key: string;
    if (options.metadata) {
      // Use new organized structure if metadata is provided
      const [entityType, entityId] = (options.folder || 'misc/unknown').split('/');
      key = generateOrganizedPath(
        options.metadata.entityType || entityType,
        options.metadata.entityId || entityId,
        originalName,
        options.metadata
      );
    } else if (options.folder) {
      // Fallback to provided folder structure
      const fileExt = path.extname(originalName);
      const fileName = options.fileName || `${uuidv4()}${fileExt}`;
      key = `${options.folder}/${fileName}`;
    } else {
      // Ultimate fallback
      const fileExt = path.extname(originalName);
      key = `uploads/${uuidv4()}${fileExt}`;
    }
    
    console.log('Uploading to B2 with organized path:', {
      bucket: BUCKET_NAME,
      key,
      contentType: options.contentType || getMimeType(originalName),
      size: buffer.length,
      metadata: options.metadata
    });
    
    // Prepare upload parameters
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: options.contentType || getMimeType(originalName),
      Metadata: {
        originalName: originalName,
        uploadDate: new Date().toISOString(),
        ...options.metadata,
      },
    });
    
    // Upload to B2
    await s3Client.send(command);
    
    // Generate a signed URL for the file
    const url = await getSignedUrlForB2(key);
    
    console.log('Upload successful:', { key, url });
    
    return {
      key,
      url,
      bucket: BUCKET_NAME,
      size: buffer.length,
    };
  } catch (error: any) {
    console.error('B2 upload error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
      bucket: BUCKET_NAME,
      endpoint: process.env.B2_ENDPOINT,
      keyIdConfigured: !!process.env.B2_KEY_ID,
      appKeyConfigured: !!process.env.B2_APPLICATION_KEY
    });
    
    // Provide more specific error messages
    if (error.code === 'NoSuchBucket') {
      throw new Error('Storage bucket not found. Please check configuration.');
    } else if (error.code === 'InvalidAccessKeyId' || error.message?.includes('Malformed Access Key')) {
      throw new Error('Invalid storage credentials. Please verify B2_KEY_ID in environment settings.');
    } else if (error.code === 'SignatureDoesNotMatch') {
      throw new Error('Invalid storage secret key. Please verify B2_APPLICATION_KEY in environment settings.');
    } else if (error.code === 'AccessDenied') {
      throw new Error('Access denied to storage service. Please check bucket permissions.');
    } else {
      throw new Error(`Failed to upload file: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Delete a file from Backblaze B2
 */
export const deleteFromB2 = async (key: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
  } catch (error) {
    console.error('B2 delete error:', error);
    throw new Error('Failed to delete file from Backblaze B2');
  }
};

/**
 * Generate a signed URL for private file access
 * URL expires after specified duration (default: 1 hour)
 */
export const getSignedUrlForB2 = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const url = await getS3SignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('B2 signed URL error:', error);
    throw new Error('Failed to generate signed URL');
  }
};

// Export with both names for compatibility
export { getSignedUrlForB2 as getSignedUrl };

/**
 * Get a permanent public URL (only for public buckets)
 */
export const getPublicUrl = (key: string): string => {
  const bucketId = process.env.B2_BUCKET_ID;
  return `https://f${bucketId}.backblazeb2.com/file/${BUCKET_NAME}/${key}`;
};

/**
 * Check if file exists in B2
 */
export const fileExists = async (key: string): Promise<boolean> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * List files in a folder
 */
export const listFiles = async (prefix: string): Promise<any[]> => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });
    
    const result = await s3Client.send(command);
    return result.Contents || [];
  } catch (error) {
    console.error('B2 list files error:', error);
    throw new Error('Failed to list files from Backblaze B2');
  }
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (key: string): Promise<any> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    return await s3Client.send(command);
  } catch (error) {
    console.error('B2 metadata error:', error);
    throw new Error('Failed to get file metadata');
  }
};

/**
 * Helper function to determine MIME type
 */
const getMimeType = (fileName: string): string => {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};

export default {
  uploadToB2,
  deleteFromB2,
  getSignedUrl: getSignedUrlForB2,
  getPublicUrl,
  fileExists,
  listFiles,
  getFileMetadata,
};
