// Simple Node.js script to create placeholder icons
// Run with: node create-icons.js
// Requires: canvas package (npm install canvas)

const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Simple SVG template for each size
function createIconSVG(size) {
  const fontSize = Math.floor(size * 0.5625); // 72/128 ratio
  const radius = Math.floor(size * 0.1875); // 24/128 ratio
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#14E1D9"/>
  <text x="${size/2}" y="${size * 0.6875}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#071017" text-anchor="middle" dominant-baseline="middle">S</text>
</svg>`;
}

// Create SVG files (can be converted to PNG later)
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const svg = createIconSVG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
  console.log(`Created icon-${size}.svg`);
});

console.log('\n✅ Icon SVGs created!');
console.log('📝 Note: Convert these to PNG format using:');
console.log('   - Online converter: https://convertio.co/svg-png/');
console.log('   - ImageMagick: magick convert icon-16.svg icon-16.png');
console.log('   - Or use the generate-icons.html file in a browser');

