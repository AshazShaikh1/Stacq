/**
 * Generate a data URL for a placeholder image
 * This avoids external dependencies and DNS issues
 */
export function generatePlaceholderImage(
  width: number = 400,
  height: number = 300,
  text: string = 'Card',
  bgColor: string = 'e5e7eb',
  textColor: string = '6b7280'
): string {
  // Escape text for use in SVG
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#${bgColor}"/><text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500" fill="#${textColor}" text-anchor="middle" dominant-baseline="middle">${escapedText}</text></svg>`;

  // Use encodeURIComponent for URL-safe encoding (works in both browser and Node.js)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

