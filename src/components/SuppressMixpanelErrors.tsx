'use client';

import { useEffect } from 'react';
import { suppressMixpanelErrors } from '@/lib/suppress-mixpanel-errors';

/**
 * Client component to suppress Mixpanel console errors
 * Runs early in the app lifecycle to catch errors from Mixpanel initialization
 */
export function SuppressMixpanelErrors() {
  useEffect(() => {
    // Suppress Mixpanel errors immediately on client mount
    suppressMixpanelErrors();
  }, []);

  return null;
}
