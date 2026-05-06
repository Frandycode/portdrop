'use client';

import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

export function SessionPageTracker() {
  const posthog = usePostHog();
  useEffect(() => {
    posthog?.capture('session_page_opened');
  }, [posthog]);
  return null;
}
