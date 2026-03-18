// Manual Test for Upscaling Functionality
// Test this in browser console to debug the upscaling system

// Test 1: Check Cloudinary Service
const testCloudinaryService = async () => {
  console.log('=== Testing Cloudinary Service ===');
  
  // Test URL generation
  const testUrl = 'https://res.cloudinary.com/dainvbpyo/image/upload/sample';
  console.log('Test URL:', testUrl);
  
  // Check if it's detected as Cloudinary URL
  const isCloudinary = window.cloudinaryService?.isCloudinaryUrl(testUrl);
  console.log('Is Cloudinary URL:', isCloudinary);
  
  if (isCloudinary) {
    const publicId = window.cloudinaryService?.extractPublicIdFromUrl(testUrl);
    console.log('Extracted Public ID:', publicId);
    
    const upscaled = window.cloudinaryService?.getUpscaledImageUrl(publicId, {
      width: 1000,
      height: 1000,
      quality: 'auto',
      upscaleLevel: 2
    });
    console.log('Generated Upscaled URL:', upscaled);
  }
  
  // Test external URL
  const externalUrl = 'https://picsum.photos/200/300';
  const encodedUrl = encodeURIComponent(externalUrl);
  const fetchUrl = `https://res.cloudinary.com/dainvbpyo/image/fetch/q_auto,f_auto,w_1000,h_1000,c_auto/${encodedUrl}`;
  console.log('External fetch URL:', fetchUrl);
};

// Test 2: Check Media Service
const testMediaService = async () => {
  console.log('=== Testing Media Service ===');
  
  // Test file creation
  const testBlob = new Blob(['test'], { type: 'image/jpeg' });
  const testFile = new File([testBlob], 'test-upscale.jpg', { type: 'image/jpeg' });
  console.log('Created test file:', testFile);
  
  try {
    const uploadUrl = await window.mediaService?.uploadFile(testFile);
    console.log('Upload successful:', uploadUrl);
    
    if (uploadUrl) {
      try {
        const deleteResult = await window.mediaService?.deleteFile(uploadUrl);
        console.log('Delete result:', deleteResult);
      } catch (deleteError) {
        console.log('Delete error:', deleteError);
      }
    }
  } catch (uploadError) {
    console.log('Upload error:', uploadError);
  }
};

// Test 3: Database Connection Test
const testDatabaseConnection = async () => {
  console.log('=== Testing Database Connection ===');
  
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    console.log('Supabase client loaded');
    
    // Test products query
    const { data: products, error } = await supabase
      .from('products')
      .select('id, images')
      .limit(1);
    
    console.log('Products query result:', { products, error });
    console.log('First product images:', products?.[0]?.images);
    
    // Test media table query (if it exists)
    try {
      const { data: media, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .limit(1);
      
      console.log('Media table result:', { media, mediaError });
    } catch (mediaErr) {
      console.log('Media table might not exist:', mediaErr);
    }
    
  } catch (dbError) {
    console.log('Database connection error:', dbError);
  }
};

// Test 4: Complete Upscaling Flow Simulation
const testUpscalingFlow = async () => {
  console.log('=== Testing Complete Upscaling Flow ===');
  
  // Simulate the exact flow from UpscaleDialog
  const testImageUrl = 'https://res.cloudinary.com/dainvbpyo/image/upload/sample';
  const testMediaItem = {
    id: 'test-123',
    name: 'test-image.jpg',
    url: testImageUrl,
    size: 50000,
    type: 'image/jpeg',
    created_at: new Date().toISOString()
  };
  
  console.log('Test media item:', testMediaItem);
  
  // Test the exact steps from handleUpscale
  try {
    // Step 1: Generate upscaled URL
    const publicId = 'sample';
    const upscaledUrl = `https://res.cloudinary.com/dainvbpyo/image/upload/q_auto,f_auto,w_1000,h_1000,c_auto/sample`;
    console.log('Step 1 - Generated URL:', upscaledUrl);
    
    // Step 2: Download enhanced image
    console.log('Step 2 - Downloading enhanced image...');
    const response = await fetch(upscaledUrl);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('Step 2 - Downloaded blob size:', blob.size, 'type:', blob.type);
    
    // Step 3: Create file
    const file = new File([blob], `upscaled_${testMediaItem.name}`, { type: blob.type });
    console.log('Step 3 - Created file:', file);
    
    // Step 4: Upload file
    console.log('Step 4 - Uploading enhanced image...');
    const newUrl = await window.mediaService?.uploadFile(file);
    console.log('Step 4 - Uploaded to:', newUrl);
    
    if (newUrl) {
      // Step 5: Update products
      console.log('Step 5 - Updating products...');
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { data: products, error } = await supabase
        .from('products')
        .select('id, images')
        .contains('images', [testImageUrl]);
      
      console.log('Found products to update:', products);
      
      for (const product of products || []) {
        if (product.images && Array.isArray(product.images)) {
          const updatedImages = product.images.map((img: string) => 
            img === testImageUrl ? newUrl : img
          );
          
          console.log(`Updating product ${product.id}:`, { old: testImageUrl, new: newUrl });
          
          const { error: updateError } = await supabase
            .from('products')
            .update({ images: updatedImages })
            .eq('id', product.id);
          
          if (updateError) {
            console.error('Update error:', updateError);
          } else {
            console.log('Product updated successfully');
          }
        }
      }
      
      // Step 6: Delete old image
      console.log('Step 6 - Deleting old image...');
      try {
        const deleteResult = await window.mediaService?.deleteFile(testImageUrl);
        console.log('Delete result:', deleteResult);
      } catch (deleteError) {
        console.warn('Delete failed (but continuing):', deleteError);
      }
      
      console.log('✅ Upscaling test completed successfully!');
    } else {
      throw new Error('Upload failed in test');
    }
    
  } catch (error) {
    console.error('❌ Upscaling test failed:', error);
  }
};

// Run all tests
window.testUpscaling = {
  testCloudinaryService,
  testMediaService,
  testDatabaseConnection,
  testUpscalingFlow
};

console.log('Manual testing functions loaded. Run window.testUpscaling.testUpscalingFlow() to test the complete flow.');
