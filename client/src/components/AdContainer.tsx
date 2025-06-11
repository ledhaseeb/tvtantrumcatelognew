import React, { useEffect, useRef } from 'react';
import { pushAd } from '../lib/adsense';

interface AdContainerProps {
  size: 'banner' | 'rectangle' | 'leaderboard' | 'mobile-banner' | 'large-rectangle' | 'skyscraper';
  className?: string;
  label?: string;
}

const AdContainer: React.FC<AdContainerProps> = ({ size, className = '', label = 'Advertisement' }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const adsenseId = import.meta.env.VITE_GOOGLE_ADSENSE_ID;
  
  const sizeClasses = {
    banner: 'w-full h-24 md:h-32',
    rectangle: 'w-full max-w-sm h-64',
    leaderboard: 'w-full h-24',
    'mobile-banner': 'w-full h-16',
    'large-rectangle': 'w-full max-w-sm h-72',
    'skyscraper': 'w-40 h-96'
  };

  const adSizes = {
    banner: { width: 728, height: 90 },
    rectangle: { width: 300, height: 250 },
    leaderboard: { width: 728, height: 90 },
    'mobile-banner': { width: 320, height: 50 },
    'large-rectangle': { width: 300, height: 250 },
    'skyscraper': { width: 160, height: 600 }
  };

  useEffect(() => {
    if (adsenseId && adRef.current) {
      // Check if container has width before pushing ad
      const containerWidth = adRef.current.offsetWidth;
      if (containerWidth > 0) {
        try {
          pushAd();
        } catch (error) {
          console.error('AdSense error:', error);
        }
      }
    }
  }, [adsenseId]);

  // Show placeholder if no AdSense ID is configured
  if (!adsenseId) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center`}>
        <div className="text-center p-2">
          <div className="text-xs text-gray-500 font-medium">{label}</div>
          <div className="text-xs text-gray-400 mt-1">Ready for ads</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adsenseId}
        data-ad-slot="auto"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdContainer;