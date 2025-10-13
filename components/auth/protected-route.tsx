'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { Permission } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication and optional permissions
 */
export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, hasPermission, currentUser } = useAuthStore();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Show nothing while checking authentication
  if (!isAuthenticated()) {
    return null;
  }

  // Check if user has required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-4">
                <ShieldAlert className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Access Denied
            </CardTitle>
            <CardDescription className="text-base">
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 text-sm">
              <p className="text-gray-600">
                Your current role: <span className="font-semibold text-gray-900 capitalize">{currentUser?.role}</span>
              </p>
              <p className="text-gray-600 mt-1">
                Required permission: <span className="font-semibold text-gray-900">{requiredPermission}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Go Back
              </Button>
              <Button
                className="flex-1 bg-[#C41E3A] hover:bg-[#A01829] text-white"
                onClick={() => router.push('/leads')}
              >
                Go to Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}
