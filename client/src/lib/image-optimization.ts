/**
 * Image Optimization Service
 * Provides optimized images based on device and context
 */

export interface OptimizedImageOptions {
  showId: number;
  showName: string;
  size?: 'thumbnail' | 'medium' | 'large' | 'original';
  fallbackUrl?: string;
}

export interface ImageSources {
  webp: string;
  fallback: string;
  sizes: string;
}

/**
 * Get optimized image sources for different formats and sizes
 */
export function getOptimizedImageSources(options: OptimizedImageOptions): ImageSources {
  const { showId, showName, size = 'medium', fallbackUrl } = options;
  
  // Generate sanitized name for file paths
  const sanitizedName = showName.replace(/[^a-zA-Z0-9]/g, '_');
  
  // WebP optimized path
  const webpPath = `/images/optimized/show-${showId}-${sanitizedName}-${size}.webp`;
  
  // Fallback to original JPG if WebP not available
  const fallbackPath = fallbackUrl || `/images/tv-shows/show-${showId}-${sanitizedName}.jpg`;
  
  // Responsive sizes for different viewports
  const responsiveSizes = {
    thumbnail: '(max-width: 640px) 150px, 200px',
    medium: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px',
    large: '(max-width: 768px) 100vw, 600px',
    original: '100vw'
  };
  
  return {
    webp: webpPath,
    fallback: fallbackPath,
    sizes: responsiveSizes[size]
  };
}

/**
 * Check if WebP is supported by the browser
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Get the best image URL based on browser support and context
 */
export async function getBestImageUrl(options: OptimizedImageOptions): Promise<string> {
  const sources = getOptimizedImageSources(options);
  
  // Check if WebP is supported
  const webpSupported = await supportsWebP();
  
  if (webpSupported) {
    // Try WebP first
    try {
      const response = await fetch(sources.webp, { method: 'HEAD' });
      if (response.ok) {
        return sources.webp;
      }
    } catch {
      // WebP not available, fall back
    }
  }
  
  // Use fallback
  return sources.fallback;
}

/**
 * Preload critical images for better performance
 */
export function preloadOptimizedImage(options: OptimizedImageOptions): void {
  const sources = getOptimizedImageSources(options);
  
  // Create preload link for WebP
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = sources.webp;
  link.type = 'image/webp';
  
  // Add fallback for non-WebP browsers
  const linkFallback = document.createElement('link');
  linkFallback.rel = 'preload';
  linkFallback.as = 'image';
  linkFallback.href = sources.fallback;
  linkFallback.type = 'image/jpeg';
  
  document.head.appendChild(link);
  document.head.appendChild(linkFallback);
}

/**
 * Context-aware size selection
 */
export function getContextualSize(context: 'homepage' | 'browse' | 'detail' | 'thumbnail'): OptimizedImageOptions['size'] {
  switch (context) {
    case 'homepage':
      return 'medium';
    case 'browse':
      return 'medium';
    case 'detail':
      return 'large';
    case 'thumbnail':
      return 'thumbnail';
    default:
      return 'medium';
  }
}