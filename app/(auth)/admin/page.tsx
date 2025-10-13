'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Shield } from 'lucide-react';

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

// Admin credentials - in production, this should be in a secure backend
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'spartan2024';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loginAttempts, setLoginAttempts] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Simple authentication check
      if (data.username === ADMIN_USERNAME && data.password === ADMIN_PASSWORD) {
        // Set admin session
        sessionStorage.setItem('admin_authenticated', 'true');
        sessionStorage.setItem('admin_login_time', new Date().toISOString());

        toast({
          title: 'Login Successful',
          description: 'Welcome to the Admin Management Panel',
        });

        // Redirect to management panel
        router.push('/admin/management');
      } else {
        setLoginAttempts(prev => prev + 1);

        toast({
          title: 'Login Failed',
          description: 'Invalid username or password',
          variant: 'destructive',
        });

        // Lock out after 5 failed attempts
        if (loginAttempts >= 4) {
          toast({
            title: 'Account Locked',
            description: 'Too many failed login attempts. Please try again later.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred during login',
        variant: 'destructive',
      });
    }
  };

  const isLocked = loginAttempts >= 5;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-700">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-[#C41E3A] rounded-full">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Admin Management Panel
          </CardTitle>
          <CardDescription className="text-base">
            Secure login for system administrators
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter admin username"
                {...register('username')}
                className={errors.username ? 'border-red-500' : ''}
                disabled={isLocked}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
                disabled={isLocked}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {loginAttempts > 0 && !isLocked && (
              <div className="text-sm text-amber-600">
                {5 - loginAttempts} login attempts remaining
              </div>
            )}

            {isLocked && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                Account temporarily locked due to too many failed login attempts
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-[#C41E3A] hover:bg-[#A01829] text-white"
              disabled={isSubmitting || isLocked}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Login to Admin Panel'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
