// Simple script to generate PWA icons using canvas
// Run: node scripts/generate-icons.js
// Requires: npm install canvas (only needed for icon generation, not runtime)

const fs = require("fs");
const path = require("path");

// Generate a simple SVG icon that can be used as PWA icon
function generateSVGIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle"
        font-size="${size * 0.5}" font-family="sans-serif">⭐</text>
</svg>`;
}

const iconsDir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons (browsers support SVG favicons)
fs.writeFileSync(path.join(iconsDir, "icon-192.svg"), generateSVGIcon(192));
fs.writeFileSync(path.join(iconsDir, "icon-512.svg"), generateSVGIcon(512));

console.log("SVG icons generated in public/icons/");
console.log("Note: For PNG icons, convert the SVGs or use a real icon file.");
console.log("The app will work with the SVG favicon for development.");
