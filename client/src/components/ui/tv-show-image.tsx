/**
 * Enhanced TV Show Image Component
 * Provides optimized images with SEO metadata and fallback support
 */

import React, { useState } from 'react';
import { getImageProps, generateAltText, getFallbackImageUrl } from '@/lib/imageService';
import { cn } from '@/lib/utils';

interface TvShowImageProps {
  showId: number;
  showName: string;
  originalUrl?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  quality?: number;
}

export function TvShowImage({
  showId,
  showName,
  originalUrl,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  aspectRatio = 'portrait',
  quality = 85
}: TvShowImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const imageProps = getImageProps(showId, showName, originalUrl);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    
    console.log(`Image load error for ${showName} (ID: ${showId}):`, {
      currentSrc: img.src,
      originalUrl,
      hasError
    });
    
    // If we have database URL and current src is not database URL, try database URL
    if (originalUrl && img.src !== originalUrl && !hasError) {
      console.log(`Trying database URL for ${showName}: ${originalUrl}`);
      img.src = originalUrl;
      return;
    }
    
    // If database URL failed and we haven't tried generated URL, try that
    if (originalUrl && img.src === originalUrl && !hasError) {
      const generatedUrl = getOptimizedImageUrl(showId, showName);
      if (generatedUrl !== originalUrl) {
        console.log(`Trying generated URL for ${showName}: ${generatedUrl}`);
        img.src = generatedUrl;
        setHasError(true);
        return;
      }
    }

    // Final fallback image
    if (!img.src.includes('_fallback')) {
      const fallbackUrl = getFallbackImageUrl(showId, showName);
      console.log(`Using fallback for ${showName}: ${fallbackUrl}`);
      img.src = fallbackUrl;
      setHasError(true);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[2/3]',
    landscape: 'aspect-[16/9]'
  };

  return (
    <div className={cn('relative overflow-hidden bg-muted', aspectClasses[aspectRatio], className)}>
      <img
        src={imageProps.src}
        alt={imageProps.alt}
        width={imageProps.width}
        height={imageProps.height}
        loading={priority ? 'eager' : imageProps.loading}
        decoding={imageProps.decoding}
        sizes={sizes}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-200',
          !isLoaded && 'opacity-0',
          isLoaded && 'opacity-100'
        )}
      />
      
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/50 to-muted" />
      )}
      
      {/* SEO structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ImageObject',
            name: showName,
            description: generateAltText(showName),
            url: imageProps.src,
            width: imageProps.width,
            height: imageProps.height,
            encodingFormat: 'image/jpeg'
          })
        }}
      />
    </div>
  );
}

/**
 * TV Show Card Image with enhanced features
 */
interface TvShowCardImageProps extends TvShowImageProps {
  showUrl?: string;
  isInteractive?: boolean;
}

export function TvShowCardImage({
  showUrl,
  isInteractive = true,
  ...imageProps
}: TvShowCardImageProps) {
  const ImageComponent = (
    <TvShowImage
      {...imageProps}
      className={cn(
        'rounded-lg',
        isInteractive && 'transition-transform duration-200 hover:scale-105',
        imageProps.className
      )}
    />
  );

  if (showUrl && isInteractive) {
    return (
      <a 
        href={showUrl}
        className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
        aria-label={`View details for ${imageProps.showName}`}
      >
        {ImageComponent}
      </a>
    );
  }

  return ImageComponent;
}

/**
 * TV Show Hero Image for detail pages
 */
export function TvShowHeroImage(props: TvShowImageProps) {
  return (
    <TvShowImage
      {...props}
      priority={true}
      aspectRatio="landscape"
      sizes="100vw"
      className={cn('rounded-xl shadow-lg', props.className)}
    />
  );
}

/**
 * TV Show Thumbnail for lists
 */
export function TvShowThumbnail(props: TvShowImageProps) {
  return (
    <TvShowImage
      {...props}
      aspectRatio="square"
      sizes="(max-width: 768px) 25vw, 10vw"
      className={cn('rounded-md', props.className)}
    />
  );
}