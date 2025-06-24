/**
 * Optimized Image Component
 * Automatically serves WebP when supported, with fallbacks
 */

import React, { useState } from 'react';
import { getOptimizedImageSources, OptimizedImageOptions } from '@/lib/image-optimization';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends OptimizedImageOptions {
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  showId,
  showName,
  size = 'medium',
  fallbackUrl,
  alt,
  className,
  loading = 'lazy',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const sources = getOptimizedImageSources({ showId, showName, size, fallbackUrl });
  
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  
  const handleError = () => {
    setHasError(true);
    onError?.();
  };
  
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <picture>
        {/* WebP source for modern browsers */}
        <source srcSet={sources.webp} type="image/webp" sizes={sources.sizes} />
        
        {/* Fallback for older browsers */}
        <img
          src={sources.fallback}
          alt={alt}
          loading={loading}
          sizes={sources.sizes}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-200',
            !isLoaded && !hasError && 'opacity-0',
            (isLoaded || hasError) && 'opacity-100'
          )}
        />
      </picture>
      
      {/* Loading state */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/50 to-muted" />
      )}
      
      {/* Error state - show name when image fails */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center p-2">
            <div className="text-sm font-medium line-clamp-2">{showName}</div>
          </div>
        </div>
      )}
    </div>
  );
}