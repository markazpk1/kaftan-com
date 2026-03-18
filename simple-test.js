// Simple Cloudinary URL Test
const CLOUDINARY_CLOUD_NAME = 'dainvbpyo';

console.log('=== TESTING CLOUDINARY API ===');

// Test URLs
const tests = [
  {
    name: 'Basic Sample Image',
    url: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/sample`
  },
  {
    name: 'Small Upscale (500x500)',
    url: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto,w_500,h_500,c_auto/sample`
  },
  {
    name: 'Medium Upscale (1000x1000)',
    url: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto,w_1000,h_1000,c_auto/sample`
  },
  {
    name: 'Large Upscale (1500x1500)',
    url: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto,w_1500,h_1500,c_auto/sample`
  },
  {
    name: 'Extra Large Upscale (2000x2000)',
    url: `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto,w_2000,h_2000,c_auto/sample`
  }
];

console.log('\nTest URLs (copy and paste these in your browser):\n');

tests.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}:`);
  console.log(`   ${test.url}`);
  console.log('');
});

console.log('=== INSTRUCTIONS ===');
console.log('1. Copy each URL above and paste it in your browser');
console.log('2. Each should show a sample image with different sizes');
console.log('3. If images load, the Cloudinary API is working correctly');
console.log('4. The upscale transformations are applied via URL parameters:');
console.log('   - q_auto: Auto quality optimization');
console.log('   - f_auto: Auto format selection (WebP, AVIF, etc.)');
console.log('   - w_XXXX, h_XXXX: Width and height dimensions');
console.log('   - c_auto: Smart cropping/gravity');
