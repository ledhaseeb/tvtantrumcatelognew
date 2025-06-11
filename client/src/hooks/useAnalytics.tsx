import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trackPageView } from '../lib/analytics';
import { scrollToTop } from '../lib/scroll-utils';

export const useAnalytics = () => {
  const [location] = useLocation();
  const prevLocationRef = useRef<string>(location);
  
  useEffect(() => {
    if (location !== prevLocationRef.current) {
      // Track page view
      trackPageView(location);
      
      // Scroll to top on route change
      scrollToTop('smooth');
      
      prevLocationRef.current = location;
    }
  }, [location]);
};