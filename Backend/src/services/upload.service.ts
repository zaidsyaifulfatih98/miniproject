import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadService = {
  /**
   * Extract image URL from multer file uploaded to Cloudinary
   */
  getImageUrl(file: Express.Multer.File | undefined): string | null {
    if (!file) return null;
    
    // For Cloudinary storage, the secure_url is available in the file object
    const fileWithUrl = file as any;
    return fileWithUrl.path || null;
  },

  /**
   * Delete image from Cloudinary by URL
   */
  async deleteImage(imageUrl: string | null | undefined): Promise<void> {
    if (!imageUrl) return;

    try {
      // Extract public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}
      const match = imageUrl.match(/\/([^\/]+)$/);
      if (!match) return;

      const publicId = match[1].split('.')[0]; // Remove file extension
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      // Don't throw error, just log it
    }
  },

  /**
   * Get secure URL from file object
   */
  getSecureUrl(file: Express.Multer.File | undefined): string | null {
    if (!file) return null;
    const fileWithUrl = file as any;
    return fileWithUrl.path || null;
  },
};
