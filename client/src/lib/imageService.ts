/**
 * Centralized Image Service
 * Handles all TV show image operations with SEO optimization and fallback support
 */

export interface ImageMetadata {
  url: string;
  alt: string;
  width: number;
  height: number;
  format: string;
}

export interface ShowImage {
  id: number;
  name: string;
  imageUrl: string;
  altText: string;
  isOptimized: boolean;
}

/**
 * Image configuration constants
 */
export const IMAGE_CONFIG = {
  OPTIMAL_WIDTH: 400,
  OPTIMAL_HEIGHT: 600,
  FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
  BASE_PATH: '/images/tv-shows/'
} as const;

/**
 * Generate SEO-optimized alt text for TV show images
 */
export function generateAltText(showName: string, additionalContext?: string): string {
  const baseName = showName.trim();
  const context = additionalContext ? ` - ${additionalContext}` : '';
  return `${baseName} TV show poster${context}`;
}

/**
 * Get optimized image URL for a TV show
 */
export function getOptimizedImageUrl(showId: number, showName: string): string {
  const sanitizedName = showName.replace(/[^a-zA-Z0-9]/g, '_');
  return `${IMAGE_CONFIG.BASE_PATH}show-${showId}-${sanitizedName}.jpg`;
}

/**
 * Get fallback image URL
 */
export function getFallbackImageUrl(showId: number, showName: string): string {
  const sanitizedName = showName.replace(/[^a-zA-Z0-9]/g, '_');
  return `${IMAGE_CONFIG.BASE_PATH}show-${showId}-${sanitizedName}_fallback.jpg`;
}

/**
 * Check if an image URL exists
 */
export async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get the best available image URL with fallback logic
 */
export async function getBestImageUrl(showId: number, showName: string, originalUrl?: string): Promise<string> {
  // First try the optimized image
  const optimizedUrl = getOptimizedImageUrl(showId, showName);
  if (await checkImageExists(optimizedUrl)) {
    return optimizedUrl;
  }

  // Then try the original URL if provided
  if (originalUrl && await checkImageExists(originalUrl)) {
    return originalUrl;
  }

  // Finally, use fallback
  return getFallbackImageUrl(showId, showName);
}

/**
 * Create complete image metadata for a TV show
 */
export async function createImageMetadata(
  showId: number, 
  showName: string, 
  originalUrl?: string
): Promise<ImageMetadata> {
  const imageUrl = await getBestImageUrl(showId, showName, originalUrl);
  
  return {
    url: imageUrl,
    alt: generateAltText(showName),
    width: IMAGE_CONFIG.OPTIMAL_WIDTH,
    height: IMAGE_CONFIG.OPTIMAL_HEIGHT,
    format: 'jpeg'
  };
}

/**
 * Image component props generator
 */
export function getImageProps(showId: number, showName: string, originalUrl?: string) {
  return {
    src: getOptimizedImageUrl(showId, showName),
    alt: generateAltText(showName),
    width: IMAGE_CONFIG.OPTIMAL_WIDTH,
    height: IMAGE_CONFIG.OPTIMAL_HEIGHT,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (originalUrl && img.src !== originalUrl) {
        img.src = originalUrl;
      } else {
        img.src = getFallbackImageUrl(showId, showName);
      }
    }
  };
}

/**
 * Preload critical images
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Batch preload multiple images
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map(url => preloadImage(url).catch(() => {})); // Ignore individual failures
  await Promise.all(promises);
}