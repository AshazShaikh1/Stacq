/**
 * Feature Flags System
 * Simple environment-based feature flags
 */

const FEATURE_FLAGS: Record<string, boolean> = {
  'ranking/final-algo': process.env.NEXT_PUBLIC_FEATURE_RANKING_FINAL_ALGO === 'true',
};

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: string): boolean {
  return FEATURE_FLAGS[flag] || false;
}

/**
 * Get all feature flags
 */
export function getAllFeatureFlags(): Record<string, boolean> {
  return { ...FEATURE_FLAGS };
}

