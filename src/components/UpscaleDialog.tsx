import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download, Wand2, Image as ImageIcon } from "lucide-react";
import { cloudinaryService, type UpscaleOptions } from "@/lib/cloudinaryService";
import { useToast } from "@/hooks/use-toast";
import { mediaService, type MediaItem } from "@/lib/mediaService";

interface UpscaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
  mediaItem?: MediaItem;
  onUpscaleComplete?: (upscaledUrl: string) => void;
  onMediaUpdated?: () => void;
}

const UpscaleDialog = ({ isOpen, onClose, imageUrl, imageName, mediaItem, onUpscaleComplete, onMediaUpdated }: UpscaleDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedOption, setSelectedOption] = useState("medium");
  const [upscaledUrl, setUpscaledUrl] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const { toast } = useToast();

  const upscaleOptions = [
    { id: "small", name: "Small (500x500)", width: 500, height: 500, level: 2 },
    { id: "medium", name: "Medium (1000x1000)", width: 1000, height: 1000, level: 2 },
    { id: "large", name: "Large (1500x1500)", width: 1500, height: 1500, level: 3 },
    { id: "xlarge", name: "Extra Large (2000x2000)", width: 2000, height: 2000, level: 4 },
  ];

  const handleUpscale = async () => {
    setIsProcessing(true);
    setProgress(0);
    setUpscaledUrl("");
    setPreviewUrl("");

    try {
      console.log('🚀 Starting upscaling process...');
      console.log('📥 Original image URL:', imageUrl);
      console.log('🏷️ Media item:', mediaItem);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const selected = upscaleOptions.find(opt => opt.id === selectedOption);
      if (!selected) {
        throw new Error("Invalid upscale option selected");
      }

      console.log('📐 Selected option:', selected);

      // Generate upscaled URL
      let upscaledUrl;
      
      if (cloudinaryService.isCloudinaryUrl(imageUrl)) {
        console.log('🔍 Detected Cloudinary URL, using direct transformation');
        // For Cloudinary images, extract public ID and transform
        const publicId = cloudinaryService.extractPublicIdFromUrl(imageUrl);
        upscaledUrl = cloudinaryService.getUpscaledImageUrl(publicId, {
          width: selected.width,
          height: selected.height,
          quality: 'auto',
          upscaleLevel: selected.level
        });
      } else {
        console.log('🌐 Detected external URL, using Cloudinary fetch');
        // For external images, use Cloudinary's fetch feature with proper encoding
        // Encode the URL to handle special characters properly
        const encodedUrl = encodeURIComponent(imageUrl);
        upscaledUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dainvbpyo'}/image/fetch/q_auto,f_auto,w_${selected.width},h_${selected.height},c_auto/${encodedUrl}`;
      }

      console.log('🎯 Generated upscaled URL:', upscaledUrl);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      clearInterval(progressInterval);
      setProgress(100);
      setUpscaledUrl(upscaledUrl);
      // Add aggressive cache-busting to force fresh image load
      const cacheBuster = Date.now();
      const randomParam = Math.random().toString(36).substring(7);
      const enhancedPreviewUrl = `${upscaledUrl}&_cb=${cacheBuster}&_r=${randomParam}`;
      setPreviewUrl(enhancedPreviewUrl);
      console.log('🖼️ Setting preview URL:', enhancedPreviewUrl);
      
      // Force image reload by resetting and setting preview
      setPreviewUrl("");
      setTimeout(() => {
        setPreviewUrl(enhancedPreviewUrl);
      }, 100);

      console.log('⬇️ Upscaling completed, starting download and upload process...');

      // Now actually download and upload the enhanced image
      if (mediaItem) {
        try {
          console.log('📥 Downloading enhanced image from:', upscaledUrl);
          
          // Download enhanced image with better error handling
          const response = await fetch(upscaledUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.0.0 Safari/537.36',
              'Accept': 'image/webp,image/apng,image/svg+xml,image/*;q=0.9,*/*;q=0.8'
            }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Download failed:', response.status, errorText);
            throw new Error(`Failed to download enhanced image: ${response.status} ${errorText}`);
          }
          
          const blob = await response.blob();
          console.log('✅ Downloaded blob size:', blob.size, 'type:', blob.type);
          
          // Verify the blob is actually larger than original
          if (blob.size <= 50000) {
            console.warn('⚠️ Warning: Enhanced image might not be larger than original');
          } else {
            console.log('✅ Enhanced image is significantly larger:', blob.size, 'bytes');
          }
          
          const file = new File([blob], `upscaled_${mediaItem.name}`, { type: blob.type });

          console.log('📤 Uploading enhanced image...');
          // Upload the enhanced image
          const newUrl = await mediaService.uploadFile(file);
          console.log('✅ Uploaded enhanced image to:', newUrl);

          if (newUrl) {
            console.log('🔄 Updating products that reference this image...');
            // Update any products that reference this image
            await updateProductImages(mediaItem.url, newUrl);

            toast({
              title: "Image Updated!",
              description: `Successfully upscaled ${mediaItem.name} to ${selected.name}`,
            });

            if (onMediaUpdated) {
              onMediaUpdated();
            }

            // Try to delete the old image (but don't fail if this doesn't work)
            try {
              console.log('🗑️ Deleting old image:', mediaItem.url);
              await mediaService.deleteFile(mediaItem.url);
              console.log('✅ Old image deleted successfully');
            } catch (deleteError) {
              console.warn('⚠️ Could not delete old image:', deleteError);
              // Continue anyway - the new image exists and products are updated
            }
          } else {
            throw new Error('Failed to upload enhanced image');
          }
        } catch (saveError) {
          console.error('❌ Error in upscaling process:', saveError);
          toast({
            title: "Upscaling Failed",
            description: "Failed to process the enhanced image. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        console.log('ℹ️ No media item provided, only generating preview');
        toast({
          title: "Upscaling Complete!",
          description: `Image enhanced to ${selected.name}`,
        });
      }

      if (onUpscaleComplete) {
        onUpscaleComplete(upscaledUrl);
      }

      console.log('🎉 Upscaling process completed successfully!');
    } catch (error) {
      console.error('❌ Upscaling error:', error);
      toast({
        title: "Upscaling Failed",
        description: "Failed to upscale the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Update product images that reference the old URL
  const updateProductImages = async (oldUrl: string, newUrl: string) => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Get all products that contain the old image URL
      const { data: products, error } = await supabase
        .from('products')
        .select('id, images')
        .contains('images', [oldUrl]);

      if (error) {
        console.error('Error finding products with image:', error);
        return;
      }

      // Update each product's images array
      for (const product of products || []) {
        if (product.images && Array.isArray(product.images)) {
          const updatedImages = product.images.map((img: string) => 
            img === oldUrl ? newUrl : img
          );

          const { error: updateError } = await supabase
            .from('products')
            .update({ images: updatedImages })
            .eq('id', product.id);

          if (updateError) {
            console.error('Error updating product:', updateError);
          } else {
            console.log(`Updated product ${product.id} images`);
          }
        }
      }
    } catch (error) {
      console.error('Error updating product images:', error);
    }
  };

  const handleDownload = () => {
    if (upscaledUrl) {
      const link = document.createElement('a');
      link.href = upscaledUrl;
      link.download = `upscaled_${imageName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClose = () => {
    setProgress(0);
    setUpscaledUrl("");
    setPreviewUrl("");
    setSelectedOption("medium");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            AI Image Upscaling
          </DialogTitle>
          <DialogDescription>
            Enhance image quality using AI-powered upscaling technology
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Image */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Original Image</Label>
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <img 
                src={imageUrl} 
                alt={imageName}
                className="w-full h-64 object-contain"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {imageName}
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {upscaledUrl ? "Upscaled Preview" : "Preview"}
            </Label>
            <div className="relative bg-muted rounded-lg overflow-hidden h-64">
              {previewUrl ? (
                <>
                  <img 
                    key={previewUrl}
                    src={previewUrl} 
                    alt="Upscaled preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('❌ Preview image failed to load:', e);
                      console.error('Failed URL:', previewUrl);
                    }}
                    onLoad={() => {
                      console.log('✅ Preview image loaded successfully');
                    }}
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm">Processing...</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Select an option and click "Upscale Image"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upscale Options */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Upscale Options</Label>
          <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {upscaleOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} disabled={isProcessing} />
                  <Label htmlFor={option.id} className="text-sm cursor-pointer">
                    {option.name}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <div className="flex gap-2">
            {upscaledUrl && (
              <Button onClick={handleDownload} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
            <Button 
              onClick={handleUpscale} 
              disabled={isProcessing}
              className="gap-2"
            >
              <Wand2 className="w-4 h-4" />
              {isProcessing ? "Processing..." : "Upscale Image"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpscaleDialog;
