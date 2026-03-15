import { supabase } from '@/integrations/supabase/client';

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

export const uploadService = {
  // Upload without compression - original quality
  async uploadImage(file: File): Promise<UploadedFile> {
    try {
      console.log('Processing image:', file.name, 'Size:', (file.size / 1024).toFixed(1), 'KB');
      
      // Upload original file without compression
      const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.name.split('.').pop() || 'jpg'}`;
      
      const { data, error } = await supabase.storage
        .from('public')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        name: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload image');
    }
  },

  // Upload multiple images in parallel without compression
  async uploadMultipleImages(files: File[]): Promise<UploadedFile[]> {
    const uploads = files.map(async (file) => {
      try {
        return await this.uploadImage(file);
      } catch (error) {
        console.error('Failed to upload:', file.name, error);
        throw error;
      }
    });
    
    return Promise.all(uploads);
  },

  // Delete image
  async deleteImage(url: string): Promise<void> {
    if (url.includes('supabase')) {
      try {
        const path = url.split('/public/')[1];
        if (path) {
          await supabase.storage.from('public').remove([path]);
        }
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  }
};
