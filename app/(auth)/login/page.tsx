'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, LogIn, Mail, Lock } from 'lucide-react';

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

/**
 * Validation schema for the login form
 */
const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Login Page Component
 * Handles user authentication with mock credentials
 */
export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuthStore();
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: LoginFormData) => {
    try {
      const user = login(data.email, data.password);

      if (!user) {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${user.name}!`,
      });

      // Redirect to leads page
      setTimeout(() => {
        router.push('/leads');
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Quick login function for demo purposes
   */
  const quickLogin = (email: string) => {
    setValue('email', email);
    setValue('password', 'password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-6">
            <img
              src="/spartan-logo.svg"
              alt="Spartan Exteriors"
              className="h-20 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to Spartan CRM
          </CardTitle>
          <CardDescription className="text-base">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@spartanexteriors.com"
                  {...register('email')}
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...register('password')}
                  className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Demo Credentials Section */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
              <button
                type="button"
                onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                className="w-full flex items-center justify-between text-sm font-medium text-blue-900 dark:text-blue-100"
              >
                <span>Demo Credentials</span>
                <span className="text-xs">{showDemoCredentials ? '▼' : '▶'}</span>
              </button>

              {showDemoCredentials && (
                <div className="mt-3 space-y-2 text-xs text-blue-800 dark:text-blue-200">
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-blue-900 rounded">
                    <div>
                      <p className="font-semibold">Owner Account</p>
                      <p className="text-blue-600 dark:text-blue-300">owner@spartanexteriors.com</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => quickLogin('owner@spartanexteriors.com')}
                      className="text-xs"
                    >
                      Use
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-blue-900 rounded">
                    <div>
                      <p className="font-semibold">Manager Account</p>
                      <p className="text-blue-600 dark:text-blue-300">manager@spartanexteriors.com</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => quickLogin('manager@spartanexteriors.com')}
                      className="text-xs"
                    >
                      Use
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-blue-900 rounded">
                    <div>
                      <p className="font-semibold">Salesperson Account</p>
                      <p className="text-blue-600 dark:text-blue-300">sales@spartanexteriors.com</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => quickLogin('sales@spartanexteriors.com')}
                      className="text-xs"
                    >
                      Use
                    </Button>
                  </div>
                  <p className="text-center text-blue-700 dark:text-blue-300 mt-2">
                    Password for all accounts: <span className="font-mono font-semibold">password</span>
                  </p>
                </div>
              )}
            </div>
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
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              This is a demo application. Use the credentials above to test different user roles.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
