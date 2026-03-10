#!/bin/bash
# Generate simple PWA icons from the SVG favicon
# Requires: rsvg-convert (librsvg) or Inkscape
# Alternatively, use any online SVG-to-PNG converter

ICONS_DIR="$(dirname "$0")/../public/icons"
SVG_FILE="$(dirname "$0")/../public/favicon.svg"

mkdir -p "$ICONS_DIR"

if command -v rsvg-convert &> /dev/null; then
  rsvg-convert -w 192 -h 192 "$SVG_FILE" > "$ICONS_DIR/icon-192.png"
  rsvg-convert -w 512 -h 512 "$SVG_FILE" > "$ICONS_DIR/icon-512.png"
  echo "Icons generated successfully!"
elif command -v sips &> /dev/null; then
  # macOS fallback - convert SVG to PNG isn't directly supported by sips
  echo "Please install librsvg: brew install librsvg"
  echo "Then run this script again."
  echo "Or convert public/favicon.svg to PNG manually at 192x192 and 512x512"
else
  echo "No SVG converter found."
  echo "Please convert public/favicon.svg to PNG manually:"
  echo "  - public/icons/icon-192.png (192x192)"
  echo "  - public/icons/icon-512.png (512x512)"
fi
