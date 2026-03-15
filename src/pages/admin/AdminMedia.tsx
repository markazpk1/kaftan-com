import { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, Grid, List, Trash2, ZoomIn, Crop, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { mediaService, type MediaItem } from "@/lib/mediaService";

const AdminMedia = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  // Viewer & Crop State
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState("");
  const [viewerImageName, setViewerImageName] = useState("");
  const [viewerProductId, setViewerProductId] = useState<string | undefined>();
  const [viewerImageIndex, setViewerImageIndex] = useState<number | undefined>();
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  
  const [isCropMode, setIsCropMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [cropData, setCropData] = useState({ x: 0, y: 0, width: 0, height: 0, active: false });
  
  // Refs for buttery-smooth drag calculations
  const dragState = useRef<{
    type: string | null;
    startX: number;
    startY: number;
    initialCrop: { x: number; y: number; width: number; height: number };
  }>({
    type: null,
    startX: 0,
    startY: 0,
    initialCrop: { x: 0, y: 0, width: 0, height: 0 }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch media
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const mediaData = await mediaService.getAllMedia();
        setMedia(mediaData);
      } catch (error) {
        toast({ title: "Error", description: "Failed to load media files", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [toast]);

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a file smaller than 10MB", variant: "destructive" });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 100);

      const url = await mediaService.uploadFile(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (url) {
        const mediaData = await mediaService.getAllMedia();
        setMedia(mediaData);
        toast({ title: "Upload successful", description: `${file.name} has been uploaded` });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast({ title: "Upload failed", description: "Failed to upload the file", variant: "destructive" });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (mediaItem: MediaItem) => {
    try {
      const success = await mediaService.deleteFile(mediaItem.url);
      if (success) {
        setMedia(media.filter(m => m.id !== mediaItem.id));
        toast({ title: "Deleted", description: `${mediaItem.name} has been deleted` });
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      toast({ title: "Delete failed", description: "Failed to delete the file", variant: "destructive" });
    }
  };

  const openImageViewer = async (url: string, name: string) => {
    setViewerImageUrl(url);
    setViewerImageName(name);
    setIsViewerOpen(true);
    cancelCrop();

    // Find the product and image index for this URL
    try {
      const { data: products, error } = await import("@/integrations/supabase/client").then(({ supabase }) =>
        supabase
          .from('products')
          .select('id, images')
          .not('images', 'is', null)
      );

      if (error) throw error;

      for (const product of products || []) {
        if (product.images && Array.isArray(product.images)) {
          const imageIndex = product.images.findIndex((image: string) => image === url);
          if (imageIndex !== -1) {
            setViewerProductId(product.id);
            setViewerImageIndex(imageIndex);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error finding product for image:', error);
    }
  };

  const closeImageViewer = () => {
    setIsViewerOpen(false);
    setViewerImageUrl("");
    setViewerImageName("");
    setViewerProductId(undefined);
    setViewerImageIndex(undefined);
    cancelCrop();
  };

  // --- TRADITIONAL CROP LOGIC ---

  const startCrop = () => {
    setIsCropMode(true);
    if (imageRef) {
      const rect = imageRef.getBoundingClientRect();
      const defaultWidth = rect.width * 0.6; // Box covers 60% of image initially
      const defaultHeight = rect.height * 0.6;
      setCropData({
        x: (rect.width - defaultWidth) / 2,
        y: (rect.height - defaultHeight) / 2,
        width: defaultWidth,
        height: defaultHeight,
        active: true
      });
    }
  };

  const cancelCrop = () => {
    setIsCropMode(false);
    setIsDragging(false);
    setCropData({ x: 0, y: 0, width: 0, height: 0, active: false });
  };

  // Start moving or resizing
  const startInteraction = (e: React.MouseEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragState.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...cropData }
    };
    setIsDragging(true);
  };

  // Global mouse listeners for smooth dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { type, startX, startY, initialCrop } = dragState.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const rect = imageRef?.getBoundingClientRect();
      
      if (!rect) return;

      let newCrop = { ...initialCrop };

      if (type === 'move') {
        newCrop.x = Math.max(0, Math.min(initialCrop.x + dx, rect.width - initialCrop.width));
        newCrop.y = Math.max(0, Math.min(initialCrop.y + dy, rect.height - initialCrop.height));
      } else {
        // Resize logic based on handles
        if (type.includes('e')) {
          newCrop.width = Math.max(40, Math.min(initialCrop.width + dx, rect.width - initialCrop.x));
        }
        if (type.includes('s')) {
          newCrop.height = Math.max(40, Math.min(initialCrop.height + dy, rect.height - initialCrop.y));
        }
        if (type.includes('w')) {
          const proposedWidth = initialCrop.width - dx;
          const proposedX = initialCrop.x + dx;
          if (proposedWidth > 40 && proposedX >= 0) {
            newCrop.width = proposedWidth;
            newCrop.x = proposedX;
          }
        }
        if (type.includes('n')) {
          const proposedHeight = initialCrop.height - dy;
          const proposedY = initialCrop.y + dy;
          if (proposedHeight > 40 && proposedY >= 0) {
            newCrop.height = proposedHeight;
            newCrop.y = proposedY;
          }
        }
      }

      setCropData(prev => ({ ...prev, ...newCrop }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragState.current.type = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, imageRef]);


  // Replace the image (Updates same file)
  const saveCroppedImage = async () => {
    if (!imageRef || !cropData.active || cropData.width === 0) {
      toast({ title: "Error", description: "Please crop an area first.", variant: "destructive" });
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const scaleX = imageRef.naturalWidth / imageRef.width;
      const scaleY = imageRef.naturalHeight / imageRef.height;

      // Use actual pixel dimensions for the cropped area to preserve quality
      const cropPixelWidth = cropData.width * scaleX;
      const cropPixelHeight = cropData.height * scaleY;

      canvas.width = cropPixelWidth;
      canvas.height = cropPixelHeight;

      ctx.drawImage(
        imageRef,
        cropData.x * scaleX,
        cropData.y * scaleY,
        cropPixelWidth,
        cropPixelHeight,
        0, 0,
        cropPixelWidth,
        cropPixelHeight
      );

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], viewerImageName, { type: 'image/png' });
          
          try {
            const newUrl = await mediaService.uploadFile(file);
            
            if (newUrl) {
              // Update the product's images array in the database
              if (viewerProductId !== undefined && viewerImageIndex !== undefined) {
                const { supabase } = await import("@/integrations/supabase/client");
                
                // First get the current product
                const { data: product, error: fetchError } = await supabase
                  .from('products')
                  .select('images')
                  .eq('id', viewerProductId)
                  .single();

                if (fetchError) throw fetchError;

                if (product.images && Array.isArray(product.images)) {
                  // Replace the old URL with the new URL
                  const updatedImages = [...product.images];
                  updatedImages[viewerImageIndex] = newUrl;

                  // Update the product
                  const { error: updateError } = await supabase
                    .from('products')
                    .update({ images: updatedImages })
                    .eq('id', viewerProductId);

                  if (updateError) throw updateError;
                }
              }

              // Delete old file if URL changed
              if (newUrl !== viewerImageUrl) {
                await mediaService.deleteFile(viewerImageUrl);
              }
              
              const mediaData = await mediaService.getAllMedia();
              setMedia(mediaData);
              toast({ title: "Success", description: "Image successfully updated" });
              closeImageViewer();
            } else {
              throw new Error("Upload failed");
            }
          } catch (uploadError) {
             toast({ title: "Update failed", description: "Failed to replace the image", variant: "destructive" });
          }
        }
      }, 'image/png');
    } catch (error) {
      toast({ title: "Crop failed", description: "Failed to process the image", variant: "destructive" });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground">Media Library</h1>
          <p className="font-body text-sm text-muted-foreground">{media.length} files</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-lg p-0.5">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-card shadow-sm" : ""}`}><Grid size={14} /></button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-card shadow-sm" : ""}`}><List size={14} /></button>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="font-body text-xs tracking-wider uppercase">
            <Upload size={14} className="mr-1" /> Upload
          </Button>
        </div>
      </div>

      {/* UPLOAD ZONE */}
      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center bg-card transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-body text-sm text-muted-foreground">Uploading...</p>
            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
          </div>
        ) : (
          <>
            <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-body text-sm text-muted-foreground">Drag & drop files here or click to upload</p>
            <p className="font-body text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB</p>
          </>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e.target.files)} disabled={uploading} />
      </div>

      {/* MEDIA GRID/LIST */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-body text-sm text-muted-foreground">Loading media...</p>
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="font-body text-sm text-muted-foreground">No media files found</p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {media.map(m => (
                <div key={m.id} className="group relative bg-card border border-border rounded-xl overflow-hidden">
                  <div className="relative group">
                    <img src={m.url} alt={m.name} className="w-full aspect-square object-cover cursor-pointer" onClick={(e) => { e.stopPropagation(); openImageViewer(m.url, m.name); }} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); openImageViewer(m.url, m.name); }} className="p-2 bg-white rounded-full hover:bg-gray-200 transition-colors shadow-lg border border-gray-200">
                          <ZoomIn size={16} className="text-gray-700" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(m); }} className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-lg border border-red-600">
                          <Trash2 size={16} className="text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="font-body text-xs text-foreground truncate">{m.name}</p>
                    <p className="font-body text-[10px] text-muted-foreground">{mediaService.formatFileSize(m.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">File</th>
                    <th className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Size</th>
                    <th className="text-right px-4 py-3 font-body text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {media.map(m => (
                    <tr key={m.id} className="border-b border-border hover:bg-secondary/20">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <img src={m.url} alt={m.name} className="w-10 h-10 rounded-lg object-cover cursor-pointer" onClick={() => openImageViewer(m.url, m.name)} />
                          <span className="font-body text-sm text-foreground">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 font-body text-sm text-muted-foreground">{mediaService.formatFileSize(m.size)}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => handleDelete(m)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* REFACTORED IMAGE VIEWER & CROP DIALOG */}
      <Dialog open={isViewerOpen} onOpenChange={closeImageViewer}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden flex flex-col items-center select-none">
          <DialogHeader className="p-4 pb-0 flex justify-between items-center w-full">
            <DialogTitle className="font-body text-sm">{viewerImageName}</DialogTitle>
            <div className="flex gap-2">
              {!isCropMode ? (
                <Button variant="outline" size="sm" onClick={startCrop} className="gap-2">
                  <Crop size={14} /> Crop
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={cancelCrop} className="gap-2">Cancel</Button>
                  <Button size="sm" onClick={saveCroppedImage} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Save size={14} /> Save
                  </Button>
                </>
              )}
            </div>
          </DialogHeader>

          {/* TRADITIONAL CROP UI */}
          <div className="relative w-full flex justify-center bg-black/5 p-4">
            {viewerImageUrl && (
              <div className="relative inline-block overflow-hidden touch-none select-none">
                <img 
                  ref={setImageRef}
                  src={viewerImageUrl} 
                  alt={viewerImageName} 
                  className="max-w-full h-auto max-h-[60vh] object-contain block"
                  crossOrigin="anonymous"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />

                {isCropMode && cropData.active && (
                  <div
                    className="absolute border border-white"
                    style={{
                      left: `${cropData.x}px`,
                      top: `${cropData.y}px`,
                      width: `${cropData.width}px`,
                      height: `${cropData.height}px`,
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)', // Dims everything OUTSIDE the box
                    }}
                  >
                    {/* The Rule of Thirds Grid Lines inside the box */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/3 left-0 right-0 border-t border-white/50" />
                      <div className="absolute top-2/3 left-0 right-0 border-t border-white/50" />
                      <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/50" />
                      <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/50" />
                    </div>

                    {/* Invisible Move Area in the center */}
                    <div 
                      className="absolute inset-0 cursor-move z-10" 
                      onMouseDown={(e) => startInteraction(e, 'move')} 
                    />

                    {/* 8 Visible Square Drag Handles (z-20 to sit above move area) */}
                    {/* Corners */}
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white cursor-nwse-resize z-20" onMouseDown={(e) => startInteraction(e, 'nw')} />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white cursor-nesw-resize z-20" onMouseDown={(e) => startInteraction(e, 'ne')} />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white cursor-nesw-resize z-20" onMouseDown={(e) => startInteraction(e, 'sw')} />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white cursor-nwse-resize z-20" onMouseDown={(e) => startInteraction(e, 'se')} />

                    {/* Edges (Top, Bottom, Left, Right) */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white cursor-ns-resize z-20" onMouseDown={(e) => startInteraction(e, 'n')} />
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white cursor-ns-resize z-20" onMouseDown={(e) => startInteraction(e, 's')} />
                    <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-white cursor-ew-resize z-20" onMouseDown={(e) => startInteraction(e, 'w')} />
                    <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-white cursor-ew-resize z-20" onMouseDown={(e) => startInteraction(e, 'e')} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 pt-0 flex justify-between items-center w-full">
            <DialogDescription className="font-body text-xs text-muted-foreground">
              {isCropMode 
                ? "Drag the box or use the 8 handles to frame your image."
                : "Click outside or press ESC to close"
              }
            </DialogDescription>
            <Button variant="outline" size="sm" onClick={closeImageViewer}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMedia;