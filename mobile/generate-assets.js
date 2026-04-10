const fs = require('fs');
const path = require('path');

// Create a simple 1x1 pixel PNG (base64 encoded)
const transparentPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const assets = [
  'assets/icon.png',
  'assets/splash.png', 
  'assets/adaptive-icon.png',
  'assets/favicon.png'
];

assets.forEach(asset => {
  const filePath = path.join(__dirname, asset);
  const buffer = Buffer.from(transparentPixel, 'base64');
  
  try {
    fs.writeFileSync(filePath, buffer);
    console.log(`Created ${asset}`);
  } catch (error) {
    console.error(`Error creating ${asset}:`, error.message);
  }
});

console.log('Asset generation complete!');
