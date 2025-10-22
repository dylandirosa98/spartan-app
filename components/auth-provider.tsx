'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';

/**
 * Auth Provider Component
 * Handles auth state hydration only - NO route protection
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    console.log('[AuthProvider] Hydrating...');
    setIsHydrated(true);
  }, []);

  // Log user state changes
  useEffect(() => {
    if (isHydrated) {
      if (currentUser) {
        console.log('[AuthProvider] User found after hydration:', currentUser.email);
      } else {
        console.log('[AuthProvider] No user found after hydration');
      }
    }
  }, [currentUser, isHydrated]);

  // Show nothing until hydrated to avoid flash
  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}
