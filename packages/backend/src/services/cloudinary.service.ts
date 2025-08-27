import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadOptions {
  folder?: string;
  public_id?: string;
  resource_type?: 'auto' | 'image' | 'video' | 'raw';
}

export const uploadToCloudinary = (
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'jobline',
      public_id: options.public_id,
      resource_type: options.resource_type || 'auto',
      ...options,
    };
    
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

export const getCloudinaryUrl = (publicId: string, options: any = {}): string => {
  return cloudinary.url(publicId, options);
};

export default cloudinary;
