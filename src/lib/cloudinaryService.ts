import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { quality, format } from '@cloudinary/url-gen/actions/delivery';

// Initialize Cloudinary with environment variables
const cld = new Cloudinary({ 
  cloud: { 
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dainvbpyo',
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '548957641943123',
    apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET || '0Ejvzrf2UJBartKE_5tvk5rpquY'
  } 
});

export interface UpscaleOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | 'good' | 'best' | 'eco';
  upscaleLevel?: number;
}

export const cloudinaryService = {
  /**
   * Generate an upscaled image URL using Cloudinary
   */
  getUpscaledImageUrl(publicId: string, options: UpscaleOptions = {}): string {
    const {
      width = 1000,
      height = 1000,
      quality = 'auto',
      upscaleLevel = 2
    } = options;

    const image = cld
      .image(publicId)
      .format('auto') // Optimize format (webp, avif, etc.)
      .quality(quality) // Auto quality optimization
      .resize(auto().gravity(autoGravity()).width(width).height(height)); // Smart resize

    // Add upscale parameter correctly to Cloudinary URL
    const baseUrl = image.toURL();
    // Cloudinary upscale parameter should be added as a query parameter
    const separator = baseUrl.includes('?') ? '&' : '?';
    const upscaleParam = upscaleLevel ? `${separator}e_upscale:${upscaleLevel}` : '';
    return `${baseUrl}${upscaleParam}`;
  },

  /**
   * Upload an image to Cloudinary and return the public ID
   */
  async uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'unsigned'); // Use unsigned preset
      formData.append('folder', 'upscaled_images'); // Organize in folder

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dainvbpyo'}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.public_id;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  },

  /**
   * Extract public ID from a Cloudinary URL
   */
  extractPublicIdFromUrl(url: string): string {
    // Handle Cloudinary URLs
    if (url.includes('cloudinary.com')) {
      const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?\.(?:jpg|jpeg|png|gif|webp|avif))/);
      if (matches && matches[1]) {
        return matches[1].split('.')[0];
      }
    }
    
    // If it's not a Cloudinary URL, return the URL as-is (will need to upload first)
    return url;
  },

  /**
   * Check if a URL is a Cloudinary URL
   */
  isCloudinaryUrl(url: string): boolean {
    return url.includes('cloudinary.com') && url.includes(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dainvbpyo');
  },

  /**
   * Generate multiple upscale variations
   */
  getUpscaleVariations(publicId: string, baseWidth: number = 1000) {
    return [
      {
        name: 'Small (500x500)',
        url: this.getUpscaledImageUrl(publicId, { width: 500, height: 500, upscaleLevel: 2 })
      },
      {
        name: 'Medium (1000x1000)',
        url: this.getUpscaledImageUrl(publicId, { width: 1000, height: 1000, upscaleLevel: 2 })
      },
      {
        name: 'Large (1500x1500)',
        url: this.getUpscaledImageUrl(publicId, { width: 1500, height: 1500, upscaleLevel: 3 })
      },
      {
        name: 'Extra Large (2000x2000)',
        url: this.getUpscaledImageUrl(publicId, { width: 2000, height: 2000, upscaleLevel: 4 })
      }
    ];
  }
};
