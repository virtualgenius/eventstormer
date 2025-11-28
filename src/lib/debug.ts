/**
 * Debug logging utility with feature flag support.
 *
 * Debug mode can be enabled via:
 * 1. localStorage: localStorage.setItem('debug', 'true')
 * 2. URL parameter: ?debug=true
 * 3. Window flag: window.EVENTSTORMER_DEBUG = true
 */

declare global {
  interface Window {
    EVENTSTORMER_DEBUG?: boolean;
  }
}

// Cache the debug state to avoid expensive checks on every call
let debugEnabledCache: boolean | null = null;

const checkDebugEnabled = (): boolean => {
  // Check localStorage
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    if (localStorage.getItem('debug') === 'true') {
      return true;
    }
  }

  // Check URL parameter
  if (typeof window !== 'undefined' && typeof URLSearchParams !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'true') {
      return true;
    }
  }

  // Check window flag
  if (typeof window !== 'undefined' && window.EVENTSTORMER_DEBUG === true) {
    return true;
  }

  return false;
};

export const isDebugEnabled = (): boolean => {
  if (debugEnabledCache === null) {
    debugEnabledCache = checkDebugEnabled();
  }
  return debugEnabledCache;
};

export const debugLog = (prefix: string, message: string, ...args: any[]): void => {
  if (isDebugEnabled()) {
    console.log(`[${prefix}] ${message}`, ...args);
  }
};
