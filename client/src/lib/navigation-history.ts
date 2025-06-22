/**
 * Smart Navigation History Manager
 * Handles back navigation to preserve user's browsing context
 * Optimized for viral traffic - minimal API calls
 */

interface NavigationState {
  path: string;
  filters?: any;
  timestamp: number;
  source: 'home' | 'browse' | 'search' | 'category';
}

const STORAGE_KEY = 'tv-tantrum-nav-history';
const MAX_HISTORY_AGE = 30 * 60 * 1000; // 30 minutes

/**
 * Save current navigation state before navigating to show details
 */
export function saveNavigationState(path: string, filters?: any, source?: string) {
  try {
    const state: NavigationState = {
      path,
      filters: filters || {},
      timestamp: Date.now(),
      source: determineSource(path, source)
    };
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save navigation state:', error);
  }
}

/**
 * Get the smart back navigation URL
 * Returns null if should use browser back button
 */
export function getSmartBackUrl(): string | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const state: NavigationState = JSON.parse(stored);
    
    // Check if state is too old
    if (Date.now() - state.timestamp > MAX_HISTORY_AGE) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    // If came from home page, go back to home
    if (state.source === 'home') {
      return '/';
    }
    
    // If came from browse with filters, reconstruct URL
    if (state.source === 'browse' && state.filters && Object.keys(state.filters).length > 0) {
      return constructBrowseUrl(state.filters);
    }
    
    // Default browse page
    if (state.source === 'browse') {
      return '/browse';
    }
    
    return state.path;
  } catch (error) {
    console.warn('Failed to get navigation state:', error);
    return null;
  }
}

/**
 * Perform smart back navigation with proper routing
 * Uses wouter navigation to avoid 404 errors
 */
export function performSmartBack(setLocation?: (path: string) => void): boolean {
  // Get the smart back URL first
  const backUrl = getSmartBackUrl();
  if (backUrl && setLocation) {
    // Use wouter navigation to avoid 404s
    setLocation(backUrl);
    return true;
  }
  
  // Fallback to window navigation
  if (backUrl) {
    window.location.href = backUrl;
    return true;
  }
  
  // Default fallback
  if (setLocation) {
    setLocation('/');
  } else {
    window.location.href = '/';
  }
  return false;
}

/**
 * Check if browser back is safe to use
 */
function canUseBrowserBack(): boolean {
  // Check if there's history to go back to
  if (window.history.length <= 1) return false;
  
  // Check referrer to ensure we came from our site
  const referrer = document.referrer;
  const currentHost = window.location.host;
  
  // Also check if we have saved navigation state
  const hasNavigationState = sessionStorage.getItem(STORAGE_KEY) !== null;
  
  return referrer.includes(currentHost) && hasNavigationState;
}

/**
 * Determine navigation source from path and context
 */
function determineSource(path: string, explicitSource?: string): 'home' | 'browse' | 'search' | 'category' {
  if (explicitSource) return explicitSource as any;
  
  if (path === '/') return 'home';
  if (path.startsWith('/browse')) return 'browse';
  if (path.includes('search')) return 'search';
  if (path.includes('category')) return 'category';
  
  return 'home';
}

/**
 * Construct browse URL with filters
 */
function constructBrowseUrl(filters: any): string {
  const params = new URLSearchParams();
  
  // Add each filter to URL params
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v.toString()));
      } else if (typeof value === 'object') {
        params.append(key, JSON.stringify(value));
      } else {
        params.append(key, value.toString());
      }
    }
  });
  
  const queryString = params.toString();
  return queryString ? `/browse?${queryString}` : '/browse';
}

/**
 * Clear navigation history (call when user navigates away from show details)
 */
export function clearNavigationHistory() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Silent fail - not critical
  }
}

/**
 * Setup browser back button handler to prevent 404s
 */
export function setupBrowserBackHandler(setLocation: (path: string) => void) {
  const handlePopState = (event: PopStateEvent) => {
    const currentPath = window.location.pathname;
    
    // If we're navigating away from a show detail page, handle it with smart navigation
    if (currentPath.startsWith('/show/')) {
      // Get where we should go based on saved navigation state
      const backUrl = getSmartBackUrl();
      if (backUrl) {
        // Prevent the default browser navigation
        event.preventDefault();
        window.history.pushState(null, '', backUrl);
        setLocation(backUrl);
        return;
      }
    }
    
    // For non-show pages or when no saved state, let browser handle normally
  };

  // Also handle beforeunload to save current state
  const handleBeforeUnload = () => {
    // Clear old navigation state when leaving the site
    if (!window.location.pathname.startsWith('/show/')) {
      clearNavigationHistory();
    }
  };

  window.addEventListener('popstate', handlePopState);
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('popstate', handlePopState);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

/**
 * Hook to track navigation for components
 */
export function useNavigationTracking() {
  return {
    saveState: saveNavigationState,
    getBackUrl: getSmartBackUrl,
    performBack: performSmartBack,
    clearHistory: clearNavigationHistory,
    setupBrowserHandler: setupBrowserBackHandler
  };
}