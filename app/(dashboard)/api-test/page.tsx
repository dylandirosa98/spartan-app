'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { twentyApi } from '@/lib/api/twenty';
import { getApiKey } from '@/lib/api/encryption';

export default function ApiTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testEndpoint = async (endpoint: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('No API key found');
      }

      const response = await fetch(`https://crm.thespartanexteriors.com/rest${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const endpoints = [
    { name: 'Metadata - All Objects', path: '/metadata/objects' },
    { name: 'People', path: '/people' },
    { name: 'Companies', path: '/companies' },
    { name: 'Opportunities', path: '/opportunities' },
    { name: 'Leads (Custom)', path: '/leads' },
    { name: 'Objects/Leads', path: '/objects/leads' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Twenty CRM API Test</h1>
          <p className="text-gray-600 mt-1">Test different endpoints to find your leads</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {endpoints.map((endpoint) => (
                <Button
                  key={endpoint.path}
                  onClick={() => testEndpoint(endpoint.path)}
                  disabled={loading}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-start"
                >
                  <span className="font-semibold">{endpoint.name}</span>
                  <span className="text-xs text-gray-500">{endpoint.path}</span>
                </Button>
              ))}
            </div>

            <div className="pt-4">
              <p className="text-sm text-gray-600 mb-2">
                API Key: {getApiKey() ? `${getApiKey()!.substring(0, 20)}...` : 'Not configured'}
              </p>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <p>Loading...</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-red-900 mb-2">Error</h3>
              <pre className="text-sm text-red-800 overflow-auto">{error}</pre>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>
                Response: {result.status} {result.statusText}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto bg-gray-50 p-4 rounded max-h-96">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
