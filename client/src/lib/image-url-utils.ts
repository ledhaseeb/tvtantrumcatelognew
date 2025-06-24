/**
 * Image URL utilities for handling special characters in show names
 */

// Function to normalize show names for image URLs
// This matches the actual filename pattern used in the image files
export function normalizeShowNameForImage(showName: string): string {
  return showName
    .replace(/[,]/g, '_') // Commas become underscores
    .replace(/[&]/g, '___') // Ampersands become triple underscores  
    .replace(/[^\w\s]/g, '_') // Other special chars become underscores
    .replace(/\s+/g, '_') // Spaces become underscores
    .replace(/_+/g, '_') // Multiple underscores become single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

// Generate optimized image URL with proper fallback
export function getOptimizedImageUrl(showId: number, showName: string, size: 'thumbnail' | 'medium' | 'large' | 'original' = 'medium'): string {
  const normalizedName = normalizeShowNameForImage(showName);
  return `/images/optimized/show-${showId}-${normalizedName}-${size}.webp`;
}

// Generate fallback JPG URL
export function getFallbackImageUrl(showId: number, showName: string): string {
  const normalizedName = normalizeShowNameForImage(showName);
  return `/images/tv-shows/show-${showId}-${normalizedName}.jpg`;
}

// Special handling for known problematic shows
const SPECIAL_FILENAME_MAP: Record<number, string> = {
  58: 'Cowboy_Jack',
  82: 'Ernst__Bobbie_en_de_rest',
  99: 'Gullah__Gullah_Island', 
  154: 'Moon_and_Me',
  199: 'Reading_rainbow',
  279: 'Tinga_Tales',
  295: 'Wishenpoof'
};

// Get the correct filename for special cases
export function getCorrectFilename(showId: number, showName: string): string {
  if (SPECIAL_FILENAME_MAP[showId]) {
    return SPECIAL_FILENAME_MAP[showId];
  }
  return normalizeShowNameForImage(showName);
}