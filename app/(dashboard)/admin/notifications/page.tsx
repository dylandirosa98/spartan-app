'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, Construction } from 'lucide-react';

export default function AdminNotificationsPage() {
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
            <Bell className="h-8 w-8 text-[#C41E3A]" />
            Notifications & Communication
          </h1>
          <p className="text-gray-600 mt-1">System-wide communication and announcements</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Communication Center</CardTitle>
            <CardDescription>Coming soon - Notification and communication management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Construction className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Under Development</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Send announcements to companies, manage email templates, create in-app notifications, and track communication history.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
