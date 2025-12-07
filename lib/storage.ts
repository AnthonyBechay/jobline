import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';

if (!process.env.R2_ACCOUNT_ID) {
  throw new Error('R2_ACCOUNT_ID is not set');
}

if (!process.env.R2_ACCESS_KEY_ID) {
  throw new Error('R2_ACCESS_KEY_ID is not set');
}

if (!process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error('R2_SECRET_ACCESS_KEY is not set');
}

if (!process.env.R2_BUCKET_NAME) {
  throw new Error('R2_BUCKET_NAME is not set');
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

export interface UploadResult {
  key: string;
  url: string;
  publicUrl?: string;
}

export async function uploadToR2(
  file: File,
  folder: string = 'uploads'
): Promise<UploadResult> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${nanoid()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await r2Client.send(command);

    // Generate presigned URL for private access
    const url = await getPresignedUrl(fileName);

    // Public URL (if R2 bucket has public access configured)
    const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${fileName}` : undefined;

    return {
      key: fileName,
      url,
      publicUrl,
    };
  } catch (error) {
    console.error('Upload to R2 error:', error);
    throw new Error('Failed to upload file');
  }
}

export async function uploadBufferToR2(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  try {
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    const url = await getPresignedUrl(key);
    const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : undefined;

    return {
      key,
      url,
      publicUrl,
    };
  } catch (error) {
    console.error('Upload buffer to R2 error:', error);
    throw new Error('Failed to upload file');
  }
}

export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Get presigned URL error:', error);
    throw new Error('Failed to generate presigned URL');
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error('Delete from R2 error:', error);
    throw new Error('Failed to delete file');
  }
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop() || '';
}

export function generateFileName(originalName: string, prefix: string = ''): string {
  const extension = getFileExtension(originalName);
  const uniqueId = nanoid();
  return prefix ? `${prefix}-${uniqueId}.${extension}` : `${uniqueId}.${extension}`;
}
