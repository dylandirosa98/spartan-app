'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store';
import { TwentyCRMConfig } from '@/types';

/**
 * Validation schema for the setup form
 */
const setupSchema = z.object({
  apiUrl: z
    .string()
    .url('Please enter a valid URL')
    .min(1, 'API URL is required'),
  apiKey: z
    .string()
    .min(10, 'API key must be at least 10 characters'),
});

type SetupFormData = z.infer<typeof setupSchema>;

/**
 * Setup Page Component
 * Handles initial authentication and API configuration for Twenty CRM
 * ADMIN ONLY - Regular users should not access this page
 */
export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setConfig, currentUser } = useAuthStore();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(
    null
  );

  // Check if user is master_admin - only they can access this page
  useEffect(() => {
    if (!currentUser) {
      // No user logged in, redirect to login
      router.push('/login');
      return;
    }

    if (currentUser.role !== 'master_admin') {
      // Non-admin user trying to access setup page
      toast({
        title: 'Access Denied',
        description: 'Only system administrators can access this page. API configuration is managed by your admin.',
        variant: 'destructive',
      });
      router.push('/leads');
    }
  }, [currentUser, router, toast]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      apiUrl: 'https://crm.thespartanexteriors.com/rest',
      apiKey: '',
    },
  });

  const apiUrl = watch('apiUrl');
  const apiKey = watch('apiKey');

  /**
   * Test the Twenty CRM API connection
   */
  const handleTestConnection = async () => {
    if (!apiUrl || !apiKey) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both API URL and API key',
        variant: 'destructive',
      });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      // Test connection by making a simple API call
      await axios.get(`${apiUrl}/leads`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      setTestResult('success');
      toast({
        title: 'Connection Successful',
        description: 'Successfully connected to Twenty CRM',
      });
    } catch (error) {
      setTestResult('error');

      let errorMessage = 'Failed to connect to Twenty CRM';

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = 'Invalid API key. Please check your credentials.';
        } else if (error.response?.status === 403) {
          errorMessage = 'Access denied. Check your API permissions.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Invalid API URL. Please check the endpoint.';
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Connection timeout. Please check your network.';
        } else if (error.code === 'ERR_NETWORK') {
          errorMessage = 'Network error. Please check your connection.';
        }
      }

      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  /**
   * Save configuration and redirect to main app
   */
  const onSubmit = async (data: SetupFormData) => {
    try {
      console.log('Saving configuration...', { apiUrl: data.apiUrl, hasKey: !!data.apiKey });

      // Create configuration object
      const config: TwentyCRMConfig = {
        apiUrl: data.apiUrl,
        apiKey: data.apiKey,
      };

      // Save configuration to store (which handles encryption)
      setConfig(config);

      // Wait a bit to ensure localStorage is written
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify it was saved
      const savedKey = localStorage.getItem('twenty_api_key');
      console.log('API key saved to localStorage:', !!savedKey);

      toast({
        title: 'Configuration Saved',
        description: 'Your Twenty CRM connection has been configured successfully',
      });

      // Redirect to admin dashboard
      setTimeout(() => {
        console.log('Redirecting to /admin/dashboard');
        router.push('/admin/dashboard');
      }, 800);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save configuration. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-lg">
              <img
                src="/arisys-logo.png"
                alt="Arisys"
                className="h-16 w-auto"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to Arisys
          </CardTitle>
          <CardDescription className="text-base">
            Configure your Twenty CRM connection to get started
          </CardDescription>
          <div className="mt-4 flex items-center gap-2 justify-center text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 p-2 rounded-lg">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-xs font-medium">Admin Only - API Configuration</span>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">API URL</Label>
              <Input
                id="apiUrl"
                type="url"
                placeholder="https://crm.thespartanexteriors.com/rest"
                {...register('apiUrl')}
                className={errors.apiUrl ? 'border-red-500' : ''}
              />
              {errors.apiUrl && (
                <p className="text-sm text-red-500">{errors.apiUrl.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The REST API endpoint for your Twenty CRM instance
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your Twenty CRM API key"
                {...register('apiKey')}
                className={errors.apiKey ? 'border-red-500' : ''}
              />
              {errors.apiKey && (
                <p className="text-sm text-red-500">{errors.apiKey.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your API key will be stored securely and encrypted
              </p>
            </div>

            {testResult && (
              <div
                className={`flex items-center gap-2 p-3 rounded-md ${
                  testResult === 'success'
                    ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                }`}
              >
                {testResult === 'success' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      Connection verified successfully
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      Connection test failed
                    </span>
                  </>
                )}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleTestConnection}
              disabled={isTestingConnection || !apiUrl || !apiKey}
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-[#C41E3A] hover:bg-[#A01829] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Configuration...
                </>
              ) : (
                'Save and Continue'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to connect this application to your Twenty
              CRM instance
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
