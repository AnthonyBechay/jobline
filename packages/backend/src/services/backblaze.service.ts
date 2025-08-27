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
}

interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
}

/**
 * Upload a file to Backblaze B2
 */
export const uploadToB2 = async (
  buffer: Buffer,
  originalName: string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    // Generate unique file name
    const fileExt = path.extname(originalName);
    const fileName = options.fileName || `${uuidv4()}${fileExt}`;
    const folder = options.folder || 'uploads';
    const key = `${folder}/${fileName}`;
    
    // Prepare upload parameters
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: options.contentType || getMimeType(originalName),
      Metadata: {
        originalName: originalName,
        uploadDate: new Date().toISOString(),
      },
    });
    
    // Upload to B2
    await s3Client.send(command);
    
    // Generate a signed URL for the file
    const url = await getSignedUrlForB2(key);
    
    return {
      key,
      url,
      bucket: BUCKET_NAME,
      size: buffer.length,
    };
  } catch (error) {
    console.error('B2 upload error:', error);
    throw new Error('Failed to upload file to Backblaze B2');
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
