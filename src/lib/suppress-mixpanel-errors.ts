/**
 * Suppress Mixpanel console errors when blocked by ad blockers
 * This should be called early in the app lifecycle
 */
export function suppressMixpanelErrors() {
  if (typeof window === 'undefined') return;

  // Only set up error suppression once
  if ((window as any).__mixpanelErrorSuppressed) return;
  (window as any).__mixpanelErrorSuppressed = true;

  // Override console.error to filter out Mixpanel errors
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = String(args[0] || '');
    const fullMessage = args.map(String).join(' ');
    
    // Filter out Mixpanel-related errors
    if (
      message.includes('Mixpanel error') ||
      message.includes('Bad HTTP status: 0') ||
      fullMessage.includes('api-js.mixpanel.com') ||
      fullMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
      fullMessage.includes('mixpanel.com/track') ||
      fullMessage.includes('mixpanel.com/engage') ||
      fullMessage.includes('intercept-console-error')
    ) {
      // Silently ignore - these are expected when ad blockers are active
      return;
    }
    // Call original console.error for other errors
    originalError.apply(console, args);
  };

  // Also suppress network errors in console for Mixpanel
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const fullMessage = args.map(String).join(' ');
    
    // Filter out Mixpanel warnings
    if (
      fullMessage.includes('Mixpanel') ||
      fullMessage.includes('mixpanel.com')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}
