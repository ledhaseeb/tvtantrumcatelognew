// Initialize Google AdSense
export const initAdSense = () => {
  const adsenseId = import.meta.env.VITE_GOOGLE_ADSENSE_ID;

  if (!adsenseId) {
    console.warn('Missing required Google AdSense key: VITE_GOOGLE_ADSENSE_ID');
    return;
  }

  // Check if AdSense script is already loaded to prevent duplicates
  const existingScript = document.querySelector(`script[src*="pagead2.googlesyndication.com"]`);
  if (existingScript) {
    console.log('AdSense script already loaded, skipping duplicate initialization');
    return;
  }

  // Add Google AdSense script to the head
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
};

// Push ads to AdSense queue
export const pushAd = () => {
  if (typeof window !== 'undefined' && window.adsbygoogle) {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }
};

// Declare global for TypeScript
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}