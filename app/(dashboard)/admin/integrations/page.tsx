'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plug, Construction } from 'lucide-react';

export default function AdminIntegrationsPage() {
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
            <Plug className="h-8 w-8 text-[#C41E3A]" />
            API & Integrations
          </h1>
          <p className="text-gray-600 mt-1">Monitor API health and integration status</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Health Monitoring</CardTitle>
            <CardDescription>Coming soon - Real-time API and integration monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Construction className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Under Development</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Monitor Twenty CRM API connections, track API usage, error rates, and integration health across all companies.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
