/**
 * Utility functions for image optimization and caching
 */

/**
 * Convert Google Drive webContentLink to use our image proxy for better caching
 * This helps reduce Vercel Image Cache Writes by serving images through our proxy
 */
export function optimizeImageUrl(originalUrl: string, width?: number, quality?: number): string {
  // If it's not a Google Drive URL, return as-is
  if (!originalUrl || !originalUrl.includes('drive.google.com')) {
    return originalUrl;
  }

  // Build proxy URL with optimization parameters
  const params = new URLSearchParams({
    url: originalUrl,
  });

  if (width) {
    params.set('w', width.toString());
  }

  if (quality) {
    params.set('q', quality.toString());
  }

  return `/api/image-proxy?${params.toString()}`;
}

/**
 * Generate responsive image sizes for Next.js Image component
 */
export function getResponsiveSizes(type: 'gallery' | 'hero' | 'thumbnail'): string {
  switch (type) {
    case 'hero':
      return '100vw';
    case 'gallery':
      return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';
    case 'thumbnail':
      return '(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw';
    default:
      return '100vw';
  }
}

/**
 * Extract Google Drive file ID from various URL formats
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null;

  // Handle different Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Create a stable cache key for images to improve cache hit rates
 */
export function createImageCacheKey(url: string, width?: number, quality?: number): string {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) {
    return url;
  }

  const params = [fileId];
  if (width) params.push(`w${width}`);
  if (quality) params.push(`q${quality}`);

  return params.join('-');
}
