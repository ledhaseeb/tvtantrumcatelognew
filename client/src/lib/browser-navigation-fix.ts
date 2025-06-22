/**
 * Browser Navigation Fix for Show Detail Pages
 * Prevents 404 errors when using browser back button from show details
 */

import { getSmartBackUrl, clearNavigationHistory } from './navigation-history';

let isHandlerSetup = false;
let currentSetLocation: ((path: string) => void) | null = null;

/**
 * Global browser navigation handler
 */
function handleBrowserNavigation(event: PopStateEvent) {
  const path = window.location.pathname;
  
  // Only handle navigation FROM show detail pages
  if (path.startsWith('/show/') && currentSetLocation) {
    // Get smart back URL
    const backUrl = getSmartBackUrl();
    
    if (backUrl) {
      // Prevent default browser behavior and use our smart navigation
      event.preventDefault();
      
      // Use pushState to update URL without triggering another popstate
      window.history.pushState(null, '', backUrl);
      
      // Navigate using wouter
      currentSetLocation(backUrl);
      
      console.log('Browser back intercepted, navigating to:', backUrl);
      return;
    }
  }
  
  // For other pages, let browser handle normally
}

/**
 * Setup global browser back handler
 */
export function setupGlobalBrowserBackHandler(setLocation: (path: string) => void) {
  currentSetLocation = setLocation;
  
  if (!isHandlerSetup) {
    window.addEventListener('popstate', handleBrowserNavigation, true);
    isHandlerSetup = true;
    console.log('Global browser back handler setup');
  }
}

/**
 * Cleanup global handler
 */
export function cleanupGlobalBrowserBackHandler() {
  if (isHandlerSetup) {
    window.removeEventListener('popstate', handleBrowserNavigation, true);
    currentSetLocation = null;
    isHandlerSetup = false;
    clearNavigationHistory();
    console.log('Global browser back handler cleaned up');
  }
}