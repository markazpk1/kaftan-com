// Test Cloudinary API manually
const CLOUDINARY_CLOUD_NAME = 'dainvbpyo';
const CLOUDINARY_API_KEY = '548957641943123';

// Test 1: Test if we can generate an upscaled URL directly
function testUpscaleUrl() {
  const testPublicId = 'sample'; // Cloudinary provides sample images
  const upscaleUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto,w_1000,h_1000,c_auto/${testPublicId}`;
  
  console.log('Testing upscale URL generation:');
  console.log('URL:', upscaleUrl);
  console.log('Open this URL in browser to test:', upscaleUrl);
  
  return upscaleUrl;
}

// Test 2: Test basic Cloudinary connectivity
function testCloudinaryConnectivity() {
  const testUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/sample`;
  console.log('Testing basic connectivity:');
  console.log('URL:', testUrl);
  return testUrl;
}

// Test 3: Test upload endpoint (without actually uploading)
function testUploadEndpoint() {
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  console.log('Testing upload endpoint:');
  console.log('URL:', uploadUrl);
  console.log('API Key:', CLOUDINARY_API_KEY);
  return uploadUrl;
}

// Run all tests
console.log('=== CLOUDINARY API TESTS ===');
console.log('Cloud Name:', CLOUDINARY_CLOUD_NAME);
console.log('API Key:', CLOUDINARY_API_KEY);
console.log('');

testCloudinaryConnectivity();
console.log('');
testUpscaleUrl();
console.log('');
testUploadEndpoint();

console.log('\n=== MANUAL TEST INSTRUCTIONS ===');
console.log('1. Open the basic connectivity URL in browser');
console.log('2. Open the upscale URL in browser');
console.log('3. Both should show Cloudinary sample images');
console.log('4. If images load, API is working');
