'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smartphone, Construction } from 'lucide-react';

export default function AdminMobilePage() {
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
            <Smartphone className="h-8 w-8 text-[#C41E3A]" />
            Mobile App Management
          </h1>
          <p className="text-gray-600 mt-1">PWA and mobile application oversight</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mobile App Oversight</CardTitle>
            <CardDescription>Coming soon - Mobile app management and monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Construction className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Under Development</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Monitor mobile app usage, track PWA installations, manage push notifications, and oversee offline sync across all companies.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
