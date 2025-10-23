'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  UserPlus,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';

interface UserFormData {
  username: string;
  password: string;
  email: string;
  salesRep: string;
}

export default function MobileUsersPage() {
  const params = useParams();
  const companyId = params.company_id as string;
  const { toast } = useToast();

  const [salesReps, setSalesReps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingSalesReps, setIsFetchingSalesReps] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    email: '',
    salesRep: '',
  });

  // Fetch sales reps from Twenty CRM
  const fetchSalesReps = async () => {
    if (!companyId) return;

    try {
      setIsFetchingSalesReps(true);
      const response = await fetch(`/api/sales-reps?companyId=${companyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch sales reps');
      }

      const data = await response.json();
      setSalesReps(data.salesReps || []);
      console.log('[Mobile Users] Fetched sales reps:', data.salesReps);
    } catch (error) {
      console.error('[Mobile Users] Error fetching sales reps:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sales rep options from Twenty CRM',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingSalesReps(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchSalesReps();
      setIsLoading(false);
    }
  }, [companyId]);

  // Handle create user
  const handleCreateUser = async () => {
    try {
      // Validation
      if (!formData.username || !formData.password || !formData.email || !formData.salesRep) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      // Email validation
      if (!formData.email.includes('@')) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        });
        return;
      }

      // Password validation
      if (formData.password.length < 8) {
        toast({
          title: 'Validation Error',
          description: 'Password must be at least 8 characters',
          variant: 'destructive',
        });
        return;
      }

      setIsSaving(true);

      const response = await fetch('/api/mobile-users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          companyId: companyId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User "${formData.username}" created successfully for sales rep "${formData.salesRep}"`,
        });

        // Reset form and close dialog
        setFormData({
          username: '',
          password: '',
          email: '',
          salesRep: '',
        });
        setShowCreateDialog(false);
      } else {
        throw new Error(data.error || data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('[Mobile Users] Error creating user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-[#C41E3A]" />
              Mobile App Users
            </h1>
            <p className="text-gray-600 mt-1">
              Create mobile app accounts for your sales reps. Each account is linked to a sales rep from Twenty CRM.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                fetchSalesReps();
              }}
              disabled={isLoading || isFetchingSalesReps}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${(isLoading || isFetchingSalesReps) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button
                  className="bg-[#C41E3A] hover:bg-[#A01828]"
                  onClick={() => {
                    // Refresh sales reps when opening dialog
                    if (salesReps.length === 0) {
                      fetchSalesReps();
                    }
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Mobile App User</DialogTitle>
                  <DialogDescription>
                    Create an account for a sales rep. They will be able to login with their username and see only their assigned leads.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="salesRep">Sales Rep (from Twenty CRM) *</Label>
                    <Select
                      value={formData.salesRep}
                      onValueChange={(value) => setFormData({ ...formData, salesRep: value })}
                      disabled={isFetchingSalesReps}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isFetchingSalesReps ? "Loading..." : "Select sales rep"} />
                      </SelectTrigger>
                      <SelectContent>
                        {salesReps.length === 0 ? (
                          <SelectItem value="no-reps" disabled>
                            No sales reps found in Twenty CRM
                          </SelectItem>
                        ) : (
                          salesReps.map((rep) => (
                            <SelectItem key={rep} value={rep}>
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4" />
                                {rep}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      This user will only see leads assigned to this sales rep
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      placeholder="e.g., jimmy_mobile"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used to login to the mobile app
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimum 8 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    disabled={isSaving || isFetchingSalesReps || salesReps.length === 0}
                    className="bg-[#C41E3A] hover:bg-[#A01828]"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create User'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  How Mobile User Accounts Work
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Each mobile user is linked to a sales rep from Twenty CRM</li>
                  <li>Users login with their username (not email)</li>
                  <li>Each user only sees leads assigned to their sales rep</li>
                  <li>Only one account allowed per sales rep</li>
                  <li>To add more users, first add the sales rep in Twenty CRM</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Sales Reps */}
        <Card>
          <CardHeader>
            <CardTitle>Available Sales Reps</CardTitle>
            <CardDescription>
              {isFetchingSalesReps
                ? 'Loading sales reps from Twenty CRM...'
                : `${salesReps.length} sales ${salesReps.length === 1 ? 'rep' : 'reps'} available`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingSalesReps ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-[#C41E3A]" />
              </div>
            ) : salesReps.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-2">No sales reps found in Twenty CRM</p>
                <p className="text-sm text-gray-500">
                  Add sales rep options in Twenty CRM first, then refresh this page
                </p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {salesReps.map((rep) => (
                  <div
                    key={rep}
                    className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50"
                  >
                    <UserCheck className="h-5 w-5 text-[#C41E3A]" />
                    <span className="font-medium">{rep}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users List - TODO: Implement GET endpoint */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Users</CardTitle>
            <CardDescription>
              Mobile app user accounts (listing coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              User listing feature coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
