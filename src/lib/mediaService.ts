import { supabase } from '@/integrations/supabase/client';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
  product_id?: string;
  product_name?: string;
}

export const mediaService = {
  // Get all media files from products
  async getAllMedia(): Promise<MediaItem[]> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, images')
        .not('images', 'is', null);

      if (error) throw error;

      const mediaItems: MediaItem[] = [];
      
      (products || []).forEach((product, productIndex) => {
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach((image, imageIndex) => {
            // Only include valid image URLs
            if (image && typeof image === 'string' && image !== '/placeholder.svg') {
              mediaItems.push({
                id: `${product.id}-${imageIndex}`,
                name: `${product.name} - Image ${imageIndex + 1}`,
                url: image,
                size: 0, // We'll estimate this
                type: 'image/jpeg', // Default type
                created_at: new Date().toISOString(),
                product_id: product.id,
                product_name: product.name,
              });
            }
          });
        }
      });

      return mediaItems;
    } catch (error) {
      console.error('Error fetching media:', error);
      return [];
    }
  },

  // Get media by product ID
  async getMediaByProductId(productId: string): Promise<MediaItem[]> {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, images')
        .eq('id', productId)
        .single();

      if (error) throw error;

      const mediaItems: MediaItem[] = [];
      
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((image, index) => {
          if (image && typeof image === 'string' && image !== '/placeholder.svg') {
            mediaItems.push({
              id: `${product.id}-${index}`,
              name: `${product.name} - Image ${index + 1}`,
              url: image,
              size: 0,
              type: 'image/jpeg',
              created_at: new Date().toISOString(),
              product_id: product.id,
              product_name: product.name,
            });
          }
        });
      }

      return mediaItems;
    } catch (error) {
      console.error('Error fetching product media:', error);
      return [];
    }
  },

  // Upload file to Supabase Storage
  async uploadFile(file: File, productId?: string): Promise<string | null> {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = productId ? `products/${productId}/${fileName}` : `general/${fileName}`;

      // Use the existing 'public' bucket
      const { data, error } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error instanceof Error) {
        throw error;
      }
      return null;
    }
  },

  // Delete file from storage
  async deleteFile(url: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('public') + 1).join('/');

      const { error } = await supabase.storage
        .from('public')
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  },

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file type from URL
  getFileType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    if (extension) {
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        return `image/${extension}`;
      }
    }
    return 'application/octet-stream';
  },

  // Generate unique filename
  generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.split('.').slice(0, -1).join('.');
    return `${nameWithoutExt}-${timestamp}-${random}.${extension}`;
  }
};
