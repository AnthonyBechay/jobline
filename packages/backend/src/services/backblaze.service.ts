import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { prisma } from '../index';

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

// Use the actual bucket name from environment or default
const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'jobline';

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
 * 
 * Improved structure:
 * /jobline-companies/
 *   /{company-name}-{company-id}/
 *     /candidates/
 *       /{firstname}-{lastname}-{id}/
 *         /photos/
 *           /face-{date}.jpg
 *           /full-body-{date}.jpg
 *         /documents/
 *           /{year}/{month}/{doctype}/
 *     /clients/
 *       /{client-name}-{id}/
 *         /documents/{year}/{month}/{doctype}/
 *     /applications/
 *       /{year}/{month}/
 *         /{app-number}-{client}-{candidate}/
 *           /documents/{stage}/{doctype}/
 *           /payments/receipt-{date}.pdf
 *           /costs/invoice-{date}.pdf
 *     /company-documents/
 *       /branding/logo.png
 *       /certificates/{year}/
 *       /legal-documents/{year}/
 */
const generateOrganizedPath = async (
  entityType: string,
  entityId: string,
  originalName: string,
  metadata?: Record<string, string>
): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timestamp = `${year}${month}${day}`; // YYYYMMDD format for better sorting
  
  // Clean filename: remove special characters, keep extension
  const fileExt = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, fileExt)
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .substring(0, 50); // Limit filename length
  
  // Generate unique but readable ID (8 chars)
  const uniqueId = uuidv4().split('-')[0];
  
  // Get company information
  let companyName = 'unknown-company';
  let companyId = metadata?.companyId || 'unknown';
  
  try {
    if (metadata?.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: metadata.companyId }
      });
      if (company?.name) {
        companyName = company.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      }
    }
  } catch (error) {
    console.error('Error fetching company info:', error);
  }
  
  // Root folder for all companies
  const rootFolder = 'jobline-companies';
  const companyFolder = `${companyName}-${companyId.substring(0, 8)}`;
  
  let filePath = '';
  
  switch (entityType) {
    case 'candidate': {
      const candidateName = metadata?.candidateName || 'unnamed-candidate';
      const [firstName, ...lastNameParts] = candidateName.split(' ');
      const lastName = lastNameParts.join(' ') || '';
      
      const cleanFirstName = firstName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const cleanLastName = lastName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const candidateId = entityId === 'temp' ? 'temp' : entityId.substring(0, 8);
      
      const candidateFolder = `${cleanFirstName}-${cleanLastName}-${candidateId}`.replace(/-+/g, '-');
      
      // Check if it's a photo
      const isPhoto = metadata?.documentType === 'photo' || 
                     metadata?.documentType === 'face-photo' || 
                     metadata?.documentType === 'full-body-photo' ||
                     originalName.match(/photo|picture|image|jpg|jpeg|png/i);
      
      if (isPhoto) {
        // Determine photo type
        let photoType = 'general';
        if (metadata?.documentType === 'face-photo' || originalName.match(/face|portrait|head/i)) {
          photoType = 'face';
        } else if (metadata?.documentType === 'full-body-photo' || originalName.match(/full|body/i)) {
          photoType = 'full-body';
        }
        
        filePath = `${rootFolder}/${companyFolder}/candidates/${candidateFolder}/photos/${photoType}-${timestamp}-${uniqueId}${fileExt}`;
      } else {
        // Regular document
        const docType = metadata?.documentType || 'general';
        filePath = `${rootFolder}/${companyFolder}/candidates/${candidateFolder}/documents/${year}/${month}/${docType}/${baseName}-${uniqueId}${fileExt}`;
      }
      break;
    }
    
    case 'client': {
      const clientName = metadata?.clientName || 'unnamed-client';
      const cleanClientName = clientName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const clientId = entityId.substring(0, 8);
      const clientFolder = `${cleanClientName}-${clientId}`;
      
      const docType = metadata?.documentType || 'general';
      filePath = `${rootFolder}/${companyFolder}/clients/${clientFolder}/documents/${year}/${month}/${docType}/${baseName}-${uniqueId}${fileExt}`;
      break;
    }
    
    case 'application': {
      const appNumber = metadata?.applicationNumber || entityId.substring(0, 8);
      const clientName = metadata?.clientName || 'client';
      const candidateName = metadata?.candidateName || 'candidate';
      
      const cleanClientName = clientName.replace(/[^a-z0-9]/gi, '-').toLowerCase().substring(0, 20);
      const cleanCandidateName = candidateName.replace(/[^a-z0-9]/gi, '-').toLowerCase().substring(0, 20);
      
      const appFolder = `${appNumber}-${cleanClientName}-${cleanCandidateName}`;
      
      // Organize by document category
      if (metadata?.documentCategory === 'payment' || originalName.match(/payment|receipt/i)) {
        filePath = `${rootFolder}/${companyFolder}/applications/${year}/${month}/${appFolder}/payments/receipt-${timestamp}-${uniqueId}${fileExt}`;
      } else if (metadata?.documentCategory === 'cost' || originalName.match(/invoice|cost|bill/i)) {
        filePath = `${rootFolder}/${companyFolder}/applications/${year}/${month}/${appFolder}/costs/invoice-${timestamp}-${uniqueId}${fileExt}`;
      } else {
        const stage = metadata?.stage?.toLowerCase().replace(/_/g, '-') || 'general';
        const docType = metadata?.documentType || 'document';
        filePath = `${rootFolder}/${companyFolder}/applications/${year}/${month}/${appFolder}/documents/${stage}/${docType}/${baseName}-${uniqueId}${fileExt}`;
      }
      break;
    }
    
    case 'company': {
      const docType = metadata?.documentType || 'general';
      
      if (docType === 'logo' || originalName.match(/logo/i)) {
        filePath = `${rootFolder}/${companyFolder}/company-documents/branding/logo-${timestamp}${fileExt}`;
      } else if (docType === 'certificate' || originalName.match(/certificate|license/i)) {
        filePath = `${rootFolder}/${companyFolder}/company-documents/certificates/${year}/${baseName}-${uniqueId}${fileExt}`;
      } else if (docType === 'legal' || originalName.match(/legal|contract|agreement/i)) {
        filePath = `${rootFolder}/${companyFolder}/company-documents/legal-documents/${year}/${baseName}-${uniqueId}${fileExt}`;
      } else {
        filePath = `${rootFolder}/${companyFolder}/company-documents/${year}/${month}/${docType}/${baseName}-${uniqueId}${fileExt}`;
      }
      break;
    }
    
    default:
      // Fallback for any other entity types
      filePath = `${rootFolder}/${companyFolder}/misc/${entityType}/${year}/${month}/${baseName}-${uniqueId}${fileExt}`;
  }
  
  // Ensure no double slashes and clean up the path
  filePath = filePath.replace(/\/+/g, '/').replace(/-+/g, '-');
  
  return filePath;
};

/**
 * Generate a signed URL for private file access (internal with custom client)
 */
const getSignedUrlForB2Internal = async (
  client: S3Client,
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const url = await getS3SignedUrl(client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('B2 signed URL error:', error);
    throw new Error('Failed to generate signed URL');
  }
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

    // Fix common Key ID issues
    let keyId = process.env.B2_KEY_ID.trim();
    
    // If the key ID doesn't start with '00', it might be missing the prefix
    // Backblaze key IDs typically start with '00' followed by 10 more characters
    if (keyId.length === 10 && !keyId.startsWith('00')) {
      console.warn('B2 Key ID might be missing "00" prefix, adding it...');
      keyId = '00' + keyId;
    } else if (keyId.length === 11 && !keyId.startsWith('00')) {
      console.warn('B2 Key ID might be missing "0" prefix, adding it...');
      keyId = '0' + keyId;
    }
    
    // Ensure the key is properly formatted (no extra characters)
    keyId = keyId.replace(/[^a-zA-Z0-9]/g, '');

    // Create a new S3 client with the corrected credentials
    const s3ClientCorrected = new S3Client({
      endpoint: process.env.B2_ENDPOINT || 'https://s3.eu-central-003.backblazeb2.com',
      region: process.env.B2_REGION || 'eu-central-003',
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: process.env.B2_APPLICATION_KEY!.trim(),
      },
      forcePathStyle: true,
    });
    
    // Generate organized file path
    let key: string;
    if (options.metadata) {
      // Use new organized structure if metadata is provided
      const [entityType, entityId] = (options.folder || 'misc/unknown').split('/');
      key = await generateOrganizedPath(
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
        companyId: options.metadata?.companyId || '',
        entityType: options.metadata?.entityType || '',
        entityId: options.metadata?.entityId || '',
        uploadedBy: options.metadata?.uploadedBy || '',
        documentType: options.metadata?.documentType || '',
      },
    });
    
    // Upload to B2
    await s3ClientCorrected.send(command);
    
    // Generate a signed URL for the file
    const url = await getSignedUrlForB2Internal(s3ClientCorrected, key);
    
    console.log('Upload successful:', { key, bucket: BUCKET_NAME });
    
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
    console.log('File deleted from B2:', { key, bucket: BUCKET_NAME });
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
 * Note: This should only be used if the bucket is public
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
 * List files in a folder/prefix
 * Useful for finding old documents or browsing the structure
 */
export const listFiles = async (
  prefix: string,
  maxKeys: number = 1000
): Promise<{
  files: Array<{
    key: string;
    size: number;
    lastModified: Date;
  }>;
  hasMore: boolean;
  nextToken?: string;
}> => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });
    
    const result = await s3Client.send(command);
    
    const files = (result.Contents || []).map(item => ({
      key: item.Key!,
      size: item.Size!,
      lastModified: item.LastModified!,
    }));
    
    return {
      files,
      hasMore: result.IsTruncated || false,
      nextToken: result.NextContinuationToken,
    };
  } catch (error) {
    console.error('B2 list files error:', error);
    throw new Error('Failed to list files from Backblaze B2');
  }
};

/**
 * Search for files across different time periods and entities
 * Useful for finding old application documents
 */
export const searchFiles = async (
  companyId: string,
  searchParams: {
    entityType?: 'application' | 'client' | 'candidate' | 'company';
    entityName?: string;
    year?: number;
    month?: number;
    documentType?: string;
  }
): Promise<Array<{ key: string; size: number; lastModified: Date }>> => {
  try {
    // Get company info for building the search prefix
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    const companyName = company.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const companyFolder = `${companyName}-${companyId.substring(0, 8)}`;
    
    // Build search prefix based on parameters
    let searchPrefix = `jobline-companies/${companyFolder}/`;
    
    if (searchParams.entityType) {
      searchPrefix += `${searchParams.entityType}s/`;
      
      if (searchParams.entityType === 'application' && searchParams.year) {
        searchPrefix += `${searchParams.year}/`;
        if (searchParams.month) {
          searchPrefix += `${String(searchParams.month).padStart(2, '0')}/`;
        }
      }
      
      if (searchParams.entityName) {
        const cleanName = searchParams.entityName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        // This will match any folder containing the name
        // Note: For more precise matching, we'd need to list and filter
      }
    }
    
    const result = await listFiles(searchPrefix, 1000);
    
    // Filter results if entity name was provided
    let files = result.files;
    if (searchParams.entityName) {
      const cleanName = searchParams.entityName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      files = files.filter(file => file.key.toLowerCase().includes(cleanName));
    }
    
    // Filter by document type if provided
    if (searchParams.documentType) {
      const docType = searchParams.documentType.toLowerCase();
      files = files.filter(file => file.key.toLowerCase().includes(docType));
    }
    
    return files;
  } catch (error) {
    console.error('B2 search files error:', error);
    throw new Error('Failed to search files in Backblaze B2');
  }
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (key: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
  metadata: Record<string, string>;
}> => {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const result = await s3Client.send(command);
    
    return {
      size: result.ContentLength || 0,
      contentType: result.ContentType || 'application/octet-stream',
      lastModified: result.LastModified || new Date(),
      metadata: result.Metadata || {},
    };
  } catch (error) {
    console.error('B2 metadata error:', error);
    throw new Error('Failed to get file metadata');
  }
};

/**
 * Move/rename a file in B2
 * Note: B2 doesn't support move directly, so we copy and delete
 */
export const moveFile = async (oldKey: string, newKey: string): Promise<void> => {
  try {
    // First, get the file
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: oldKey,
    });
    
    const file = await s3Client.send(getCommand);
    
    if (!file.Body) {
      throw new Error('File not found');
    }
    
    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of file.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // Upload to new location
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: newKey,
      Body: buffer,
      ContentType: file.ContentType,
      Metadata: file.Metadata,
    });
    
    await s3Client.send(putCommand);
    
    // Delete old file
    await deleteFromB2(oldKey);
    
    console.log('File moved successfully:', { from: oldKey, to: newKey });
  } catch (error) {
    console.error('B2 move file error:', error);
    throw new Error('Failed to move file in Backblaze B2');
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
    '.webp': 'image/webp',
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
  searchFiles,
  getFileMetadata,
  moveFile,
};