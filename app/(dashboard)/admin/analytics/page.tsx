'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Construction } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'master_admin') {
      router.push('/login');
    }
  }, [currentUser, router]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-[#C41E3A]" />
            System Analytics
          </h1>
          <p className="text-gray-600 mt-1">Platform-wide analytics and reporting</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analytics & Reporting</CardTitle>
            <CardDescription>Coming soon - Comprehensive analytics dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Construction className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Under Development</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                View platform-wide analytics including user engagement, lead conversion rates, company performance metrics, and custom reports.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
