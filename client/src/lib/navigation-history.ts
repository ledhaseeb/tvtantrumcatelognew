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
 * Perform smart back navigation
 * Uses browser history when possible, falls back to constructed URLs
 */
export function performSmartBack(): boolean {
  // Try browser's native back first (most efficient)
  if (canUseBrowserBack()) {
    window.history.back();
    return true;
  }
  
  // Fallback to constructed URL
  const backUrl = getSmartBackUrl();
  if (backUrl) {
    window.location.href = backUrl;
    return true;
  }
  
  // Default fallback
  window.location.href = '/';
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
  
  return referrer.includes(currentHost);
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
 * Hook to track navigation for components
 */
export function useNavigationTracking() {
  return {
    saveState: saveNavigationState,
    getBackUrl: getSmartBackUrl,
    performBack: performSmartBack,
    clearHistory: clearNavigationHistory
  };
}