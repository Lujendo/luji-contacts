#!/usr/bin/env node

const fs = require('fs');

// Create a simple favicon.ico file (16x16 pixels)
// This is a basic ICO file format with a simple contact book icon

const icoHeader = Buffer.from([
  0x00, 0x00, // Reserved
  0x01, 0x00, // Type (1 = ICO)
  0x01, 0x00, // Number of images
]);

const icoDirectory = Buffer.from([
  0x10, // Width (16)
  0x10, // Height (16)
  0x00, // Color count (0 = no palette)
  0x00, // Reserved
  0x01, 0x00, // Color planes
  0x20, 0x00, // Bits per pixel (32)
  0x00, 0x04, 0x00, 0x00, // Size of image data (1024 bytes)
  0x16, 0x00, 0x00, 0x00, // Offset to image data
]);

// Create a 16x16 RGBA bitmap
const width = 16;
const height = 16;
const pixels = new Array(width * height * 4).fill(0);

// Helper function to set pixel
function setPixel(x, y, r, g, b, a = 255) {
  if (x >= 0 && x < width && y >= 0 && y < height) {
    const index = (y * width + x) * 4;
    pixels[index] = r;     // Red
    pixels[index + 1] = g; // Green
    pixels[index + 2] = b; // Blue
    pixels[index + 3] = a; // Alpha
  }
}

// Draw a simple contact book icon
// Background circle (blue)
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dx = x - 8;
    const dy = y - 8;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= 7) {
      setPixel(x, y, 37, 99, 235); // Blue background
    }
  }
}

// Book spine (white)
for (let y = 2; y < 14; y++) {
  setPixel(3, y, 255, 255, 255);
  setPixel(4, y, 255, 255, 255);
}

// Book pages (white)
for (let y = 3; y < 13; y++) {
  for (let x = 5; x < 13; x++) {
    setPixel(x, y, 255, 255, 255);
  }
}

// Person icon (blue)
// Head
setPixel(8, 6, 37, 99, 235);
setPixel(9, 6, 37, 99, 235);
setPixel(8, 7, 37, 99, 235);
setPixel(9, 7, 37, 99, 235);

// Body
for (let x = 7; x < 11; x++) {
  setPixel(x, 9, 37, 99, 235);
  setPixel(x, 10, 37, 99, 235);
}

// Convert to BMP format (bottom-up)
const bmpHeader = Buffer.from([
  0x28, 0x00, 0x00, 0x00, // Header size
  0x10, 0x00, 0x00, 0x00, // Width
  0x20, 0x00, 0x00, 0x00, // Height (32 for AND + XOR masks)
  0x01, 0x00, // Planes
  0x20, 0x00, // Bits per pixel
  0x00, 0x00, 0x00, 0x00, // Compression
  0x00, 0x04, 0x00, 0x00, // Image size
  0x00, 0x00, 0x00, 0x00, // X pixels per meter
  0x00, 0x00, 0x00, 0x00, // Y pixels per meter
  0x00, 0x00, 0x00, 0x00, // Colors used
  0x00, 0x00, 0x00, 0x00, // Important colors
]);

// Create XOR mask (color data) - bottom-up
const xorMask = Buffer.alloc(width * height * 4);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const srcIndex = (y * width + x) * 4;
    const dstIndex = ((height - 1 - y) * width + x) * 4;
    xorMask[dstIndex] = pixels[srcIndex + 2];     // Blue
    xorMask[dstIndex + 1] = pixels[srcIndex + 1]; // Green
    xorMask[dstIndex + 2] = pixels[srcIndex];     // Red
    xorMask[dstIndex + 3] = pixels[srcIndex + 3]; // Alpha
  }
}

// Create AND mask (transparency) - all opaque
const andMask = Buffer.alloc(width * height / 8);

// Combine all parts
const icoData = Buffer.concat([
  icoHeader,
  icoDirectory,
  bmpHeader,
  xorMask,
  andMask
]);

// Write favicon.ico
fs.writeFileSync('public/favicon.ico', icoData);
console.log('✅ Generated favicon.ico');

// Also create a simple HTML favicon reference
const faviconHTML = `
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon.svg">
<link rel="manifest" href="/site.webmanifest">
`;

console.log('📝 Add this to your HTML head:');
console.log(faviconHTML);

// Create a web manifest
const manifest = {
  "name": "Luji Contacts",
  "short_name": "Contacts",
  "description": "Modern contact management system",
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ],
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
};

fs.writeFileSync('public/site.webmanifest', JSON.stringify(manifest, null, 2));
console.log('✅ Generated site.webmanifest');

console.log('🎉 Favicon generation complete!');
