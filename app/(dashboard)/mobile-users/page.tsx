'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserPlus,
  Edit,
  Trash2,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface MobileUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'sales_rep' | 'canvasser' | 'office_manager' | 'project_manager';
  salesRep?: string | null;
  canvasser?: string | null;
  officeManager?: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface UserFormData {
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'manager' | 'sales_rep' | 'canvasser' | 'office_manager' | 'project_manager';
  workspaceId: string;
  twentyApiKey: string;
  salesRep?: string;
  canvasser?: string;
  selectedSalesReps?: string[];
  selectedCanvassers?: string[];
}

export default function MobileUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<MobileUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MobileUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    email: '',
    role: 'sales_rep',
    workspaceId: 'default',
    twentyApiKey: '',
    selectedSalesReps: [],
    selectedCanvassers: [],
  });

  // Load users
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/mobile-users');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle create user
  const handleCreateUser = async () => {
    try {
      // Validation
      if (!formData.username || !formData.password || !formData.email || !formData.role) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      setIsSaving(true);

      const response = await fetch('/api/mobile-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // If office manager, assign selected users
        if (formData.role === 'office_manager' && (formData.selectedSalesReps?.length || formData.selectedCanvassers?.length)) {
          const assignedUsers = [
            ...(formData.selectedSalesReps || []),
            ...(formData.selectedCanvassers || [])
          ];

          // Update each assigned user's officeManager field
          for (const userId of assignedUsers) {
            await fetch('/api/mobile-users', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: userId,
                officeManager: formData.username,
              }),
            });
          }
        }

        toast({
          title: 'Success',
          description: `User "${formData.username}" created successfully`,
        });

        // Reset form and close dialog
        setFormData({
          username: '',
          password: '',
          email: '',
          role: 'sales_rep',
          workspaceId: 'default',
          twentyApiKey: '',
          selectedSalesReps: [],
          selectedCanvassers: [],
        });
        setShowCreateDialog(false);

        // Reload users
        fetchUsers();
      } else {
        throw new Error(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setIsSaving(true);

      const response = await fetch('/api/mobile-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User "${formData.username}" updated successfully`,
        });

        setShowEditDialog(false);
        setSelectedUser(null);

        // Reload users
        fetchUsers();
      } else {
        throw new Error(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setIsSaving(true);

      const response = await fetch(`/api/mobile-users?id=${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User "${selectedUser.username}" deleted successfully`,
        });

        setShowDeleteDialog(false);
        setSelectedUser(null);

        // Reload users
        fetchUsers();
      } else {
        throw new Error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (user: MobileUser) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't pre-fill password for security
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
      twentyApiKey: '',
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (user: MobileUser) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-600 hover:bg-purple-700';
      case 'manager':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'sales_rep':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
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
              Manage user accounts for the Spartan CRM mobile application
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchUsers}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#C41E3A] hover:bg-[#A01828]">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Mobile App User</DialogTitle>
                  <DialogDescription>
                    Add a new user who can access the Spartan CRM mobile app
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
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
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="sales_rep">Sales Rep</SelectItem>
                        <SelectItem value="canvasser">Canvasser</SelectItem>
                        <SelectItem value="office_manager">Office Manager</SelectItem>
                        <SelectItem value="project_manager">Project Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Office Manager Assignments */}
                  {formData.role === 'office_manager' && (
                    <>
                      <div>
                        <Label>Assign Sales Reps</Label>
                        <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                          {users
                            .filter(u => u.role === 'sales_rep')
                            .map(user => (
                              <label key={user.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.selectedSalesReps?.includes(user.id)}
                                  onChange={(e) => {
                                    const selected = formData.selectedSalesReps || [];
                                    setFormData({
                                      ...formData,
                                      selectedSalesReps: e.target.checked
                                        ? [...selected, user.id]
                                        : selected.filter(id => id !== user.id)
                                    });
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">{user.username} ({user.email})</span>
                              </label>
                            ))}
                          {users.filter(u => u.role === 'sales_rep').length === 0 && (
                            <p className="text-sm text-gray-500">No sales reps available</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Assign Canvassers</Label>
                        <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                          {users
                            .filter(u => u.role === 'canvasser')
                            .map(user => (
                              <label key={user.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.selectedCanvassers?.includes(user.id)}
                                  onChange={(e) => {
                                    const selected = formData.selectedCanvassers || [];
                                    setFormData({
                                      ...formData,
                                      selectedCanvassers: e.target.checked
                                        ? [...selected, user.id]
                                        : selected.filter(id => id !== user.id)
                                    });
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">{user.username} ({user.email})</span>
                              </label>
                            ))}
                          {users.filter(u => u.role === 'canvasser').length === 0 && (
                            <p className="text-sm text-gray-500">No canvassers available</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="workspaceId">Workspace ID</Label>
                    <Input
                      id="workspaceId"
                      placeholder="default"
                      value={formData.workspaceId}
                      onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="twentyApiKey">Twenty CRM API Key</Label>
                    <Input
                      id="twentyApiKey"
                      placeholder="Optional - uses default if empty"
                      value={formData.twentyApiKey}
                      onChange={(e) => setFormData({ ...formData, twentyApiKey: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    disabled={isSaving}
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

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading users...' : `${users.length} mobile app ${users.length === 1 ? 'user' : 'users'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-[#C41E3A]" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users yet</h3>
                <p className="text-gray-600 mb-4">Create your first mobile app user to get started</p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-[#C41E3A] hover:bg-[#A01828]"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Workspace</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={`${getRoleBadgeColor(user.role)} capitalize`}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{user.workspaceId}</TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge className="bg-green-600 hover:bg-green-700">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="mr-1 h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(user)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                Update user information and credentials
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-password">New Password (leave empty to keep current)</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
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
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="sales_rep">Sales Rep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-workspaceId">Workspace ID</Label>
                <Input
                  id="edit-workspaceId"
                  value={formData.workspaceId}
                  onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSaving}>
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
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the user "{selectedUser?.username}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
