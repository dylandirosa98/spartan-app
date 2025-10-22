'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Legacy Leads Page - Redirects to company-specific URL
 * This page exists for backwards compatibility
 */
export default function LeadsRedirectPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  useEffect(() => {
    // Redirect to company-specific leads page
    if (currentUser?.company_id) {
      router.replace(`/company/${currentUser.company_id}/leads`);
    } else {
      // If no company_id, redirect to login
      router.replace('/login');
    }
  }, [currentUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirecting to your company leads...</p>
    </div>
  );
}
