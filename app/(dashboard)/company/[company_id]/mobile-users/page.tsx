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
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserFormData {
  username: string;
  password: string;
  email: string;
  salesRep: string;
  role: string;
}

interface MobileUser {
  id: string;
  username: string;
  email: string;
  role: string;
  sales_rep: string;
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function MobileUsersPage() {
  const params = useParams();
  const companyId = params.company_id as string;
  const { toast } = useToast();

  const [salesReps, setSalesReps] = useState<string[]>([]);
  const [users, setUsers] = useState<MobileUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingSalesReps, setIsFetchingSalesReps] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MobileUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    email: '',
    salesRep: '',
    role: 'sales_rep',
  });

  const [editFormData, setEditFormData] = useState<UserFormData>({
    username: '',
    password: '',
    email: '',
    salesRep: '',
    role: 'sales_rep',
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

  // Fetch mobile users
  const fetchUsers = async () => {
    try {
      setIsFetchingUsers(true);
      const response = await fetch('/api/mobile-users');

      if (!response.ok) {
        throw new Error('Failed to fetch mobile users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      console.log('[Mobile Users] Fetched users:', data.users);
    } catch (error) {
      console.error('[Mobile Users] Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mobile users',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingUsers(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchSalesReps();
      fetchUsers();
      setIsLoading(false);
    }
  }, [companyId]);

  // Handle create user
  const handleCreateUser = async () => {
    try {
      // Validation
      if (!formData.username || !formData.password || !formData.email || !formData.salesRep || !formData.role) {
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
          role: 'sales_rep',
        });
        setShowCreateDialog(false);

        // Refresh users list
        fetchUsers();
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

  // Handle open edit dialog
  const handleOpenEditDialog = (user: MobileUser) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username,
      password: '', // Don't populate password for security
      email: user.email,
      salesRep: user.sales_rep,
      role: user.role,
    });
    setShowEditDialog(true);
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      // Validation
      if (!editFormData.username || !editFormData.email) {
        toast({
          title: 'Validation Error',
          description: 'Username and email are required',
          variant: 'destructive',
        });
        return;
      }

      // Email validation
      if (!editFormData.email.includes('@')) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid email address',
          variant: 'destructive',
        });
        return;
      }

      // Password validation (if provided)
      if (editFormData.password && editFormData.password.length < 8) {
        toast({
          title: 'Validation Error',
          description: 'Password must be at least 8 characters',
          variant: 'destructive',
        });
        return;
      }

      setIsSaving(true);

      const updatePayload: any = {
        id: selectedUser.id,
        username: editFormData.username,
        email: editFormData.email,
      };

      // Only include password if it was changed
      if (editFormData.password) {
        updatePayload.password = editFormData.password;
      }

      const response = await fetch('/api/mobile-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: editFormData.password
            ? `User "${editFormData.username}" updated successfully. They will be logged out.`
            : `User "${editFormData.username}" updated successfully`,
        });

        // Close dialog and refresh
        setShowEditDialog(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        throw new Error(data.error || data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('[Mobile Users] Error updating user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle open delete dialog
  const handleOpenDeleteDialog = (user: MobileUser) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/mobile-users?id=${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User "${selectedUser.username}" deleted successfully`,
        });

        // Close dialog and refresh
        setShowDeleteDialog(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        throw new Error(data.error || data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('[Mobile Users] Error deleting user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
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
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales_rep">Sales Rep</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Currently only Sales Rep role is available
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

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Users</CardTitle>
            <CardDescription>
              {isFetchingUsers
                ? 'Loading mobile users...'
                : `${users.length} mobile ${users.length === 1 ? 'user' : 'users'} registered`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingUsers ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-[#C41E3A]" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-2">No mobile users registered yet</p>
                <p className="text-sm text-gray-500">
                  Click "Add User" above to create a mobile app account
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-3 font-semibold text-gray-900">Username</th>
                      <th className="pb-3 font-semibold text-gray-900">Email</th>
                      <th className="pb-3 font-semibold text-gray-900">Sales Rep</th>
                      <th className="pb-3 font-semibold text-gray-900">Role</th>
                      <th className="pb-3 font-semibold text-gray-900">Status</th>
                      <th className="pb-3 font-semibold text-gray-900">Created</th>
                      <th className="pb-3 font-semibold text-gray-900 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{user.username}</span>
                          </div>
                        </td>
                        <td className="py-4 text-gray-600">{user.email}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-[#C41E3A]" />
                            <span className="font-medium text-gray-900">{user.sales_rep}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {user.role === 'sales_rep' ? 'Sales Rep' : user.role}
                          </span>
                        </td>
                        <td className="py-4">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1 text-sm text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              Active
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Inactive</span>
                          )}
                        </td>
                        <td className="py-4 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenDeleteDialog(user)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information. Leave password blank to keep current password.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">Username *</Label>
                <Input
                  id="edit-username"
                  placeholder="e.g., jimmy_mobile"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="user@example.com"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-password">New Password (optional)</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Leave blank to keep current"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
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
                {editFormData.password && (
                  <p className="text-xs text-orange-600 mt-1">
                    Changing password will force logout the user from mobile app
                  </p>
                )}
              </div>
              <div>
                <Label>Role</Label>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {editFormData.role === 'sales_rep' ? 'Sales Rep' : editFormData.role}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Role cannot be changed
                </p>
              </div>
              <div>
                <Label>Sales Rep (from Twenty CRM)</Label>
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                  <UserCheck className="h-5 w-5 text-[#C41E3A]" />
                  <span className="font-medium">{editFormData.salesRep}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Sales rep cannot be changed
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedUser(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={isSaving}
                className="bg-[#C41E3A] hover:bg-[#A01828]"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update User'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the user &quot;{selectedUser?.username}&quot; and remove their access to the mobile app.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedUser(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
