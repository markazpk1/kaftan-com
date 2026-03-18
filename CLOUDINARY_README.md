# Cloudinary Image Upscaling Integration

This document explains how to use the Cloudinary image upscaling feature that has been integrated into the admin media page.

## Features

- **AI-Powered Upscaling**: Enhance image quality using Cloudinary's advanced image processing
- **Multiple Size Options**: Choose from Small (500x500) to Extra Large (2000x2000)
- **Smart Resizing**: Uses auto-gravity for intelligent cropping and resizing
- **Format Optimization**: Automatically converts to optimal formats (WebP, AVIF, etc.)
- **Quality Enhancement**: Auto-quality adjustment for best results

## Setup

### 1. Environment Variables

Add the Cloudinary credentials to your `.env` file:

```env
VITE_CLOUDINARY_CLOUD_NAME=dainvbpyo
VITE_CLOUDINARY_API_KEY=548957641943123
VITE_CLOUDINARY_API_SECRET=0Ejvzrf2UJBartKE_5tvk5rpquY
VITE_CLOUDINARY_URL=cloudinary://548957641943123:0Ejvzrf2UJBartKE_5tvk5rpquY@dainvbpyo
```

### 2. Cloudinary Dashboard Setup

1. Go to your Cloudinary dashboard
2. Create an upload preset named `ml_default` (or update the name in the code)
3. Enable the following features in your upload preset:
   - Auto-format conversion
   - Auto-quality optimization
   - Smart cropping

## Usage

### In Admin Media Page

1. Navigate to the Admin Media page
2. Hover over any image
3. Click the blue wand icon (✨) to open the upscaling dialog
4. Select your desired upscale size:
   - Small (500x500)
   - Medium (1000x1000)
   - Large (1500x1500)
   - Extra Large (2000x2000)
5. Click "Upscale Image" to process
6. Download the upscaled image when complete

### Programmatic Usage

```typescript
import { cloudinaryService } from '@/lib/cloudinaryService';

// Get upscaled URL
const upscaledUrl = cloudinaryService.getUpscaledImageUrl('public_id', {
  width: 1000,
  height: 1000,
  quality: 'auto'
});

// Upload image to Cloudinary
const publicId = await cloudinaryService.uploadImage(file);

// Check if URL is from Cloudinary
const isCloudinary = cloudinaryService.isCloudinaryUrl(imageUrl);
```

## API Reference

### cloudinaryService.getUpscaledImageUrl()

Generates an upscaled image URL using Cloudinary transformations.

**Parameters:**
- `publicId` (string): The Cloudinary public ID or image URL
- `options` (UpscaleOptions): Configuration options
  - `width` (number): Target width (default: 1000)
  - `height` (number): Target height (default: 1000)
  - `quality` (string): Quality setting ('auto', 'good', 'best', 'eco')
  - `upscaleLevel` (number): Upscale enhancement level

**Returns:** String - The transformed image URL

### cloudinaryService.uploadImage()

Uploads an image to Cloudinary and returns the public ID.

**Parameters:**
- `file` (File): The image file to upload

**Returns:** Promise<string> - The public ID of the uploaded image

### cloudinaryService.isCloudinaryUrl()

Checks if a URL is from your Cloudinary account.

**Parameters:**
- `url` (string): The URL to check

**Returns:** Boolean - True if it's a Cloudinary URL

## File Structure

```
src/
├── lib/
│   └── cloudinaryService.ts     # Cloudinary API service
├── components/
│   └── UpscaleDialog.tsx         # Upscale UI component
└── pages/admin/
    └── AdminMedia.tsx            # Updated with upscale functionality
```

## Security Notes

- Cloudinary credentials are stored in environment variables
- API keys are not exposed to the client-side build
- Upload preset should be configured with appropriate restrictions

## Troubleshooting

### Common Issues

1. **Upload fails**: Check your upload preset configuration in Cloudinary dashboard
2. **API errors**: Verify environment variables are correctly set
3. **CORS issues**: Ensure your Cloudinary account allows your domain

### Error Messages

- "Upload preset not found": Create the upload preset in Cloudinary dashboard
- "Invalid credentials": Check your API keys and cloud name
- "File too large": Increase upload limits or compress images

## Advanced Features

### Custom Transformations

You can extend the cloudinary service to add more Cloudinary transformations:

```typescript
// Example: Add watermark
const image = cld
  .image(publicId)
  .resize(auto().width(1000))
  .overlay(
    source(
      image('watermark_logo')
        .resize(scale(50))
    )
  );
```

### Batch Processing

For processing multiple images, you can use the service in a loop:

```typescript
const urls = await Promise.all(
  files.map(file => cloudinaryService.uploadImage(file))
);
```

## Support

For issues with:
- Cloudinary API: Check Cloudinary documentation
- Integration: Review the code in `cloudinaryService.ts`
- UI issues: Check `UpscaleDialog.tsx` component

## Cloudinary Resources

- [Documentation](https://cloudinary.com/documentation)
- [Transformation Reference](https://cloudinary.com/documentation/transformation_reference)
- [Upload Presets](https://cloudinary.com/documentation/upload_presets)
