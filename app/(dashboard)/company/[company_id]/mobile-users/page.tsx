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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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

interface SalesRepFormData {
  username: string;
  password: string;
  email: string;
  salesRep: string;
}

interface CanvasserFormData {
  username: string;
  password: string;
  email: string;
  canvasser: string;
}

interface BasicUserFormData {
  username: string;
  password: string;
  email: string;
}

interface OfficeManagerFormData {
  username: string;
  password: string;
  email: string;
  officeManager: string; // Twenty CRM office manager enum value
  selectedSalesReps: string[];
  selectedCanvassers: string[];
  selectedProjectManagers: string[];
}

interface ProjectManagerFormData {
  username: string;
  password: string;
  email: string;
  projectManager: string; // Twenty CRM project manager enum value
}

interface MobileUser {
  id: string;
  username: string;
  email: string;
  role: string;
  sales_rep: string | null;
  canvasser: string | null;
  office_manager: string | null;
  project_manager: string | null;
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Helper function to format role names
const formatRoleName = (role: string): string => {
  const roleMap: Record<string, string> = {
    sales_rep: 'Sales Rep',
    canvasser: 'Canvasser',
    office_manager: 'Office Manager',
    project_manager: 'Project Manager',
  };
  return roleMap[role] || role;
};

export default function MobileUsersPage() {
  const params = useParams();
  const companyId = params.company_id as string;
  const { toast } = useToast();

  const [salesReps, setSalesReps] = useState<string[]>([]);
  const [canvassers, setCanvassers] = useState<string[]>([]);
  const [officeManagers, setOfficeManagers] = useState<string[]>([]);
  const [projectManagers, setProjectManagers] = useState<string[]>([]);
  const [users, setUsers] = useState<MobileUser[]>([]);
  const [isFetchingSalesReps, setIsFetchingSalesReps] = useState(false);
  const [isFetchingCanvassers, setIsFetchingCanvassers] = useState(false);
  const [isFetchingOfficeManagers, setIsFetchingOfficeManagers] = useState(false);
  const [isFetchingProjectManagers, setIsFetchingProjectManagers] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('sales_rep');

  // Separate dialogs for each role
  const [showSalesRepDialog, setShowSalesRepDialog] = useState(false);
  const [showCanvasserDialog, setShowCanvasserDialog] = useState(false);
  const [showOfficeManagerDialog, setShowOfficeManagerDialog] = useState(false);
  const [showProjectManagerDialog, setShowProjectManagerDialog] = useState(false);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MobileUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Separate form states for each role
  const [salesRepFormData, setSalesRepFormData] = useState<SalesRepFormData>({
    username: '',
    password: '',
    email: '',
    salesRep: '',
  });

  const [canvasserFormData, setCanvasserFormData] = useState<CanvasserFormData>({
    username: '',
    password: '',
    email: '',
    canvasser: '',
  });

  const [officeManagerFormData, setOfficeManagerFormData] = useState<OfficeManagerFormData>({
    username: '',
    password: '',
    email: '',
    officeManager: '',
    selectedSalesReps: [],
    selectedCanvassers: [],
    selectedProjectManagers: [],
  });

  const [projectManagerFormData, setProjectManagerFormData] = useState<ProjectManagerFormData>({
    username: '',
    password: '',
    email: '',
    projectManager: '',
  });

  const [editFormData, setEditFormData] = useState<any>({
    username: '',
    password: '',
    email: '',
    salesRep: '',
    canvasser: '',
    officeManager: '',
    role: 'sales_rep',
    selectedSalesReps: [],
    selectedCanvassers: [],
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

  // Fetch canvassers from Twenty CRM
  const fetchCanvassers = async () => {
    if (!companyId) return;

    try {
      setIsFetchingCanvassers(true);
      const response = await fetch(`/api/canvassers?companyId=${companyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch canvassers');
      }

      const data = await response.json();
      setCanvassers(data.canvassers || []);
      console.log('[Mobile Users] Fetched canvassers:', data.canvassers);
    } catch (error) {
      console.error('[Mobile Users] Error fetching canvassers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load canvasser options from Twenty CRM',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingCanvassers(false);
    }
  };

  // Fetch office managers from Twenty CRM
  const fetchOfficeManagers = async () => {
    if (!companyId) return;

    try {
      setIsFetchingOfficeManagers(true);
      const response = await fetch(`/api/office-managers?companyId=${companyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch office managers');
      }

      const data = await response.json();
      setOfficeManagers(data.officeManagers || []);
      console.log('[Mobile Users] Fetched office managers:', data.officeManagers);
    } catch (error) {
      console.error('[Mobile Users] Error fetching office managers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load office manager options from Twenty CRM',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingOfficeManagers(false);
    }
  };

  // Fetch project managers from Twenty CRM
  const fetchProjectManagers = async () => {
    if (!companyId) return;

    try {
      setIsFetchingProjectManagers(true);
      const response = await fetch(`/api/project-managers?companyId=${companyId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch project managers');
      }

      const data = await response.json();
      setProjectManagers(data.projectManagers || []);
      console.log('[Mobile Users] Fetched project managers:', data.projectManagers);
    } catch (error) {
      console.error('[Mobile Users] Error fetching project managers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project manager options from Twenty CRM',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingProjectManagers(false);
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
      fetchCanvassers();
      fetchOfficeManagers();
      fetchProjectManagers();
      fetchUsers();
    }
  }, [companyId]);

  // Generic handler to create user with any role
  const createUserWithRole = async (
    role: string,
    formData: SalesRepFormData | CanvasserFormData | OfficeManagerFormData | BasicUserFormData,
    resetForm: () => void,
    closeDialog: () => void
  ) => {
    try {
      // Validation
      if (!formData.username || !formData.password || !formData.email) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      // Sales rep specific validation
      if (role === 'sales_rep' && !(formData as SalesRepFormData).salesRep) {
        toast({
          title: 'Validation Error',
          description: 'Please select a sales rep',
          variant: 'destructive',
        });
        return;
      }

      // Office manager specific validation
      if (role === 'office_manager' && !(formData as OfficeManagerFormData).officeManager) {
        toast({
          title: 'Validation Error',
          description: 'Please select an office manager',
          variant: 'destructive',
        });
        return;
      }

      // Project manager specific validation
      if (role === 'project_manager' && !(formData as ProjectManagerFormData).projectManager) {
        toast({
          title: 'Validation Error',
          description: 'Please select a project manager',
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

      const payload: any = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        role: role,
        companyId: companyId,
      };

      // Only include salesRep for sales_rep role
      if (role === 'sales_rep') {
        payload.salesRep = (formData as SalesRepFormData).salesRep;
      }

      // Only include canvasser for canvasser role (optional)
      if (role === 'canvasser') {
        const canvasserValue = (formData as CanvasserFormData).canvasser;
        if (canvasserValue) {
          payload.canvasser = canvasserValue;
        }
      }

      // Only include officeManager for office_manager role
      if (role === 'office_manager') {
        payload.officeManager = (formData as OfficeManagerFormData).officeManager;
      }

      // Only include projectManager for project_manager role
      if (role === 'project_manager') {
        payload.projectManager = (formData as ProjectManagerFormData).projectManager;
      }

      const response = await fetch('/api/mobile-users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // If office manager, assign selected users
        if (role === 'office_manager') {
          const officeManagerData = formData as OfficeManagerFormData;
          const assignedUsers = [
            ...(officeManagerData.selectedSalesReps || []),
            ...(officeManagerData.selectedCanvassers || []),
            ...(officeManagerData.selectedProjectManagers || [])
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
          description: `${formatRoleName(role)} user "${formData.username}" created successfully`,
        });

        // Reset form and close dialog
        resetForm();
        closeDialog();

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

  // Role-specific handlers
  const handleCreateSalesRep = () => {
    createUserWithRole(
      'sales_rep',
      salesRepFormData,
      () => setSalesRepFormData({ username: '', password: '', email: '', salesRep: '' }),
      () => setShowSalesRepDialog(false)
    );
  };

  const handleCreateCanvasser = () => {
    createUserWithRole(
      'canvasser',
      canvasserFormData,
      () => setCanvasserFormData({ username: '', password: '', email: '', canvasser: '' }),
      () => setShowCanvasserDialog(false)
    );
  };

  const handleCreateOfficeManager = () => {
    createUserWithRole(
      'office_manager',
      officeManagerFormData,
      () => setOfficeManagerFormData({ username: '', password: '', email: '', officeManager: '', selectedSalesReps: [], selectedCanvassers: [], selectedProjectManagers: [] }),
      () => setShowOfficeManagerDialog(false)
    );
  };

  const handleCreateProjectManager = () => {
    createUserWithRole(
      'project_manager',
      projectManagerFormData,
      () => setProjectManagerFormData({ username: '', password: '', email: '', projectManager: '' }),
      () => setShowProjectManagerDialog(false)
    );
  };

  // Handle open edit dialog
  const handleOpenEditDialog = (user: MobileUser) => {
    setSelectedUser(user);

    // Pre-populate assigned users if this is an office manager
    const assignedSalesReps = user.role === 'office_manager'
      ? users.filter(u => u.role === 'sales_rep' && u.office_manager === user.username).map(u => u.id)
      : [];
    const assignedCanvassers = user.role === 'office_manager'
      ? users.filter(u => u.role === 'canvasser' && u.office_manager === user.username).map(u => u.id)
      : [];
    const assignedProjectManagers = user.role === 'office_manager'
      ? users.filter(u => u.role === 'project_manager' && u.office_manager === user.username).map(u => u.id)
      : [];

    setEditFormData({
      username: user.username,
      password: '', // Don't populate password for security
      email: user.email,
      salesRep: user.sales_rep || '',
      canvasser: user.canvasser || '',
      officeManager: user.office_manager || '',
      role: user.role,
      selectedSalesReps: assignedSalesReps,
      selectedCanvassers: assignedCanvassers,
      selectedProjectManagers: assignedProjectManagers,
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

      // Include role-specific fields
      if (editFormData.role === 'sales_rep') {
        updatePayload.salesRep = editFormData.salesRep;
      }

      if (editFormData.role === 'canvasser') {
        updatePayload.canvasser = editFormData.canvasser || null;
      }

      if (editFormData.role === 'office_manager') {
        updatePayload.officeManager = editFormData.officeManager;
      }

      const response = await fetch('/api/mobile-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (response.ok) {
        // If office manager, update assignments
        if (editFormData.role === 'office_manager') {
          const currentlyAssigned = users.filter(u => u.office_manager === selectedUser.username).map(u => u.id);
          const newlySelected = [
            ...(editFormData.selectedSalesReps || []),
            ...(editFormData.selectedCanvassers || []),
            ...(editFormData.selectedProjectManagers || [])
          ];

          // Clear users who are no longer assigned
          const toUnassign = currentlyAssigned.filter((id: string) => !newlySelected.includes(id));
          for (const userId of toUnassign) {
            await fetch('/api/mobile-users', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: userId,
                officeManager: null,
              }),
            });
          }

          // Assign newly selected users
          for (const userId of newlySelected) {
            await fetch('/api/mobile-users', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: userId,
                officeManager: editFormData.username,
              }),
            });
          }
        }

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

  // Filter users by role
  const getUsersByRole = (role: string) => {
    return users.filter((user) => user.role === role);
  };

  // Get available (unassigned) sales reps
  const getAvailableSalesReps = () => {
    const assignedSalesReps = users
      .filter((user) => user.role === 'sales_rep' && user.sales_rep)
      .map((user) => user.sales_rep);

    return salesReps.filter((salesRep) => !assignedSalesReps.includes(salesRep));
  };

  // Get available (unassigned) canvassers
  const getAvailableCanvassers = () => {
    const assignedCanvassers = users
      .filter((user) => user.role === 'canvasser' && user.canvasser)
      .map((user) => user.canvasser);

    return canvassers.filter((canvasser) => !assignedCanvassers.includes(canvasser));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-[#C41E3A]" />
            Mobile App Users
          </h1>
          <p className="text-gray-600 mt-1">
            Manage mobile app accounts for different user roles.
          </p>
        </div>

        {/* Tabs for each role */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales_rep">
              Sales Reps ({getUsersByRole('sales_rep').length})
            </TabsTrigger>
            <TabsTrigger value="canvasser">
              Canvassers ({getUsersByRole('canvasser').length})
            </TabsTrigger>
            <TabsTrigger value="office_manager">
              Office Managers ({getUsersByRole('office_manager').length})
            </TabsTrigger>
            <TabsTrigger value="project_manager">
              Project Managers ({getUsersByRole('project_manager').length})
            </TabsTrigger>
          </TabsList>

          {/* Sales Rep Tab */}
          <TabsContent value="sales_rep" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={fetchSalesReps}
                disabled={isFetchingSalesReps}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isFetchingSalesReps ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={showSalesRepDialog} onOpenChange={setShowSalesRepDialog}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-[#C41E3A] hover:bg-[#A01828]"
                    onClick={() => {
                      if (salesReps.length === 0) {
                        fetchSalesReps();
                      }
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Sales Rep
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Sales Rep User</DialogTitle>
                    <DialogDescription>
                      Create a mobile account for a sales rep from Twenty CRM.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="salesRep">Sales Rep (from Twenty CRM) *</Label>
                      <Select
                        value={salesRepFormData.salesRep}
                        onValueChange={(value) => setSalesRepFormData({ ...salesRepFormData, salesRep: value })}
                        disabled={isFetchingSalesReps}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isFetchingSalesReps ? "Loading..." : "Select sales rep"} />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableSalesReps().length === 0 ? (
                            <SelectItem value="no-reps" disabled>
                              {salesReps.length === 0 ? 'No sales reps found in Twenty CRM' : 'All sales reps are assigned'}
                            </SelectItem>
                          ) : (
                            getAvailableSalesReps().map((rep) => (
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
                    </div>
                    <div>
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        placeholder="e.g., jimmy_mobile"
                        value={salesRepFormData.username}
                        onChange={(e) => setSalesRepFormData({ ...salesRepFormData, username: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimum 8 characters"
                          value={salesRepFormData.password}
                          onChange={(e) => setSalesRepFormData({ ...salesRepFormData, password: e.target.value })}
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
                        value={salesRepFormData.email}
                        onChange={(e) => setSalesRepFormData({ ...salesRepFormData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowSalesRepDialog(false)} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateSalesRep}
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

            {/* Info Card for Sales Reps */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">
                      Sales Rep Accounts
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Each account is linked to a sales rep from Twenty CRM</li>
                      <li>Users only see leads assigned to their sales rep</li>
                      <li>Only one account allowed per sales rep</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales Reps Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Rep Users</CardTitle>
                <CardDescription>
                  {isFetchingUsers
                    ? 'Loading users...'
                    : `${getUsersByRole('sales_rep').length} sales rep ${getUsersByRole('sales_rep').length === 1 ? 'user' : 'users'}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isFetchingUsers ? (
                  <div className="flex justify-center items-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#C41E3A]" />
                  </div>
                ) : getUsersByRole('sales_rep').length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">No sales rep users yet</p>
                    <p className="text-sm text-gray-500">
                      Click "Add Sales Rep" above to create an account
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
                          <th className="pb-3 font-semibold text-gray-900">Status</th>
                          <th className="pb-3 font-semibold text-gray-900">Created</th>
                          <th className="pb-3 font-semibold text-gray-900 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {getUsersByRole('sales_rep').map((user) => (
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
          </TabsContent>

          {/* Canvasser Tab */}
          <TabsContent value="canvasser" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showCanvasserDialog} onOpenChange={setShowCanvasserDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#C41E3A] hover:bg-[#A01828]">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Canvasser
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Canvasser User</DialogTitle>
                    <DialogDescription>
                      Create a mobile account for a canvasser.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="canvasser-username">Username *</Label>
                      <Input
                        id="canvasser-username"
                        placeholder="e.g., john_canvasser"
                        value={canvasserFormData.username}
                        onChange={(e) => setCanvasserFormData({ ...canvasserFormData, username: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="canvasser-password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="canvasser-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimum 8 characters"
                          value={canvasserFormData.password}
                          onChange={(e) => setCanvasserFormData({ ...canvasserFormData, password: e.target.value })}
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
                      <Label htmlFor="canvasser-email">Email *</Label>
                      <Input
                        id="canvasser-email"
                        type="email"
                        placeholder="user@example.com"
                        value={canvasserFormData.email}
                        onChange={(e) => setCanvasserFormData({ ...canvasserFormData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="canvasser-select">Canvasser (Optional)</Label>
                      <Select
                        value={canvasserFormData.canvasser}
                        onValueChange={(value) => setCanvasserFormData({ ...canvasserFormData, canvasser: value })}
                        disabled={isFetchingCanvassers}
                      >
                        <SelectTrigger id="canvasser-select">
                          <SelectValue placeholder={isFetchingCanvassers ? 'Loading canvassers...' : 'Select a canvasser (optional)'} />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableCanvassers().length === 0 ? (
                            <SelectItem value="no-canvassers" disabled>
                              {canvassers.length === 0 ? 'No canvassers found in Twenty CRM' : 'All canvassers are assigned'}
                            </SelectItem>
                          ) : (
                            getAvailableCanvassers().map((canvasser) => (
                              <SelectItem key={canvasser} value={canvasser}>
                                {canvasser}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        You can assign a canvasser now or later
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCanvasserDialog(false)} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateCanvasser}
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

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">
                      Canvasser Accounts
                    </p>
                    <p className="text-sm text-blue-800">
                      Mobile accounts for canvassing staff.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Canvasser Users</CardTitle>
                <CardDescription>
                  {isFetchingUsers
                    ? 'Loading users...'
                    : `${getUsersByRole('canvasser').length} canvasser ${getUsersByRole('canvasser').length === 1 ? 'user' : 'users'}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isFetchingUsers ? (
                  <div className="flex justify-center items-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#C41E3A]" />
                  </div>
                ) : getUsersByRole('canvasser').length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">No canvasser users yet</p>
                    <p className="text-sm text-gray-500">
                      Click "Add Canvasser" above to create an account
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left">
                          <th className="pb-3 font-semibold text-gray-900">Username</th>
                          <th className="pb-3 font-semibold text-gray-900">Email</th>
                          <th className="pb-3 font-semibold text-gray-900">Status</th>
                          <th className="pb-3 font-semibold text-gray-900">Created</th>
                          <th className="pb-3 font-semibold text-gray-900 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {getUsersByRole('canvasser').map((user) => (
                          <tr key={user.id}>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{user.username}</span>
                              </div>
                            </td>
                            <td className="py-4 text-gray-600">{user.email}</td>
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
          </TabsContent>

          {/* Office Manager Tab */}
          <TabsContent value="office_manager" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showOfficeManagerDialog} onOpenChange={setShowOfficeManagerDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#C41E3A] hover:bg-[#A01828]">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Office Manager
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Office Manager User</DialogTitle>
                    <DialogDescription>
                      Create a mobile account for an office manager.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="office-username">Username *</Label>
                      <Input
                        id="office-username"
                        placeholder="e.g., jane_office"
                        value={officeManagerFormData.username}
                        onChange={(e) => setOfficeManagerFormData({ ...officeManagerFormData, username: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="office-password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="office-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimum 8 characters"
                          value={officeManagerFormData.password}
                          onChange={(e) => setOfficeManagerFormData({ ...officeManagerFormData, password: e.target.value })}
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
                      <Label htmlFor="office-email">Email *</Label>
                      <Input
                        id="office-email"
                        type="email"
                        placeholder="user@example.com"
                        value={officeManagerFormData.email}
                        onChange={(e) => setOfficeManagerFormData({ ...officeManagerFormData, email: e.target.value })}
                      />
                    </div>

                    {/* Office Manager Assignment */}
                    <div>
                      <Label htmlFor="office-manager-select">Office Manager Assignment *</Label>
                      <Select
                        value={officeManagerFormData.officeManager}
                        onValueChange={(value) => setOfficeManagerFormData({ ...officeManagerFormData, officeManager: value })}
                        disabled={isFetchingOfficeManagers}
                      >
                        <SelectTrigger id="office-manager-select">
                          <SelectValue placeholder={isFetchingOfficeManagers ? "Loading..." : "Select office manager"} />
                        </SelectTrigger>
                        <SelectContent>
                          {officeManagers.length === 0 && !isFetchingOfficeManagers && (
                            <div className="px-2 py-1.5 text-sm text-gray-500">
                              No office managers available in Twenty CRM
                            </div>
                          )}
                          {officeManagers.map((om) => (
                            <SelectItem key={om} value={om}>
                              {om}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        This office manager will only see leads with this value in Twenty CRM
                      </p>
                    </div>

                    {/* Assignment Fields */}
                    <div>
                      <Label>Assign Sales Reps</Label>
                      <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                        {getUsersByRole('sales_rep').map(user => (
                          <label key={user.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={officeManagerFormData.selectedSalesReps?.includes(user.id)}
                              onChange={(e) => {
                                const selected = officeManagerFormData.selectedSalesReps || [];
                                setOfficeManagerFormData({
                                  ...officeManagerFormData,
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
                        {getUsersByRole('sales_rep').length === 0 && (
                          <p className="text-sm text-gray-500">No sales reps available</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Assign Canvassers</Label>
                      <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                        {getUsersByRole('canvasser').map(user => (
                          <label key={user.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={officeManagerFormData.selectedCanvassers?.includes(user.id)}
                              onChange={(e) => {
                                const selected = officeManagerFormData.selectedCanvassers || [];
                                setOfficeManagerFormData({
                                  ...officeManagerFormData,
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
                        {getUsersByRole('canvasser').length === 0 && (
                          <p className="text-sm text-gray-500">No canvassers available</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Assign Project Managers</Label>
                      <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                        {getUsersByRole('project_manager').map(user => (
                          <label key={user.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={officeManagerFormData.selectedProjectManagers?.includes(user.id)}
                              onChange={(e) => {
                                const selected = officeManagerFormData.selectedProjectManagers || [];
                                setOfficeManagerFormData({
                                  ...officeManagerFormData,
                                  selectedProjectManagers: e.target.checked
                                    ? [...selected, user.id]
                                    : selected.filter(id => id !== user.id)
                                });
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{user.username} ({user.email})</span>
                          </label>
                        ))}
                        {getUsersByRole('project_manager').length === 0 && (
                          <p className="text-sm text-gray-500">No project managers available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowOfficeManagerDialog(false)} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateOfficeManager}
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

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">
                      Office Manager Accounts
                    </p>
                    <p className="text-sm text-blue-800">
                      Mobile accounts for office management staff.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Office Manager Users</CardTitle>
                <CardDescription>
                  {isFetchingUsers
                    ? 'Loading users...'
                    : `${getUsersByRole('office_manager').length} office manager ${getUsersByRole('office_manager').length === 1 ? 'user' : 'users'}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isFetchingUsers ? (
                  <div className="flex justify-center items-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#C41E3A]" />
                  </div>
                ) : getUsersByRole('office_manager').length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">No office manager users yet</p>
                    <p className="text-sm text-gray-500">
                      Click "Add Office Manager" above to create an account
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left">
                          <th className="pb-3 font-semibold text-gray-900">Username</th>
                          <th className="pb-3 font-semibold text-gray-900">Email</th>
                          <th className="pb-3 font-semibold text-gray-900">Status</th>
                          <th className="pb-3 font-semibold text-gray-900">Created</th>
                          <th className="pb-3 font-semibold text-gray-900 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {getUsersByRole('office_manager').map((user) => (
                          <tr key={user.id}>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{user.username}</span>
                              </div>
                            </td>
                            <td className="py-4 text-gray-600">{user.email}</td>
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
          </TabsContent>

          {/* Project Manager Tab */}
          <TabsContent value="project_manager" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showProjectManagerDialog} onOpenChange={setShowProjectManagerDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#C41E3A] hover:bg-[#A01828]">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Project Manager
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Project Manager User</DialogTitle>
                    <DialogDescription>
                      Create a mobile account for a project manager from Twenty CRM.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="projectManager">Project Manager (from Twenty CRM) *</Label>
                      <Select
                        value={projectManagerFormData.projectManager}
                        onValueChange={(value) => setProjectManagerFormData({ ...projectManagerFormData, projectManager: value })}
                        disabled={isFetchingProjectManagers}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isFetchingProjectManagers ? "Loading..." : "Select project manager"} />
                        </SelectTrigger>
                        <SelectContent>
                          {projectManagers.length === 0 ? (
                            <SelectItem value="no-pms" disabled>
                              {isFetchingProjectManagers ? 'Loading...' : 'No project managers found in Twenty CRM'}
                            </SelectItem>
                          ) : (
                            projectManagers.map((pm) => (
                              <SelectItem key={pm} value={pm}>
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4" />
                                  {pm}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="project-username">Username *</Label>
                      <Input
                        id="project-username"
                        placeholder="e.g., mike_project"
                        value={projectManagerFormData.username}
                        onChange={(e) => setProjectManagerFormData({ ...projectManagerFormData, username: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="project-password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="project-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimum 8 characters"
                          value={projectManagerFormData.password}
                          onChange={(e) => setProjectManagerFormData({ ...projectManagerFormData, password: e.target.value })}
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
                      <Label htmlFor="project-email">Email *</Label>
                      <Input
                        id="project-email"
                        type="email"
                        placeholder="user@example.com"
                        value={projectManagerFormData.email}
                        onChange={(e) => setProjectManagerFormData({ ...projectManagerFormData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowProjectManagerDialog(false)} disabled={isSaving}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProjectManager}
                      disabled={isSaving || isFetchingProjectManagers || projectManagers.length === 0}
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

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">
                      Project Manager Accounts
                    </p>
                    <p className="text-sm text-blue-800">
                      Mobile accounts for project management staff.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Manager Users</CardTitle>
                <CardDescription>
                  {isFetchingUsers
                    ? 'Loading users...'
                    : `${getUsersByRole('project_manager').length} project manager ${getUsersByRole('project_manager').length === 1 ? 'user' : 'users'}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isFetchingUsers ? (
                  <div className="flex justify-center items-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#C41E3A]" />
                  </div>
                ) : getUsersByRole('project_manager').length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">No project manager users yet</p>
                    <p className="text-sm text-gray-500">
                      Click "Add Project Manager" above to create an account
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left">
                          <th className="pb-3 font-semibold text-gray-900">Username</th>
                          <th className="pb-3 font-semibold text-gray-900">Email</th>
                          <th className="pb-3 font-semibold text-gray-900">Status</th>
                          <th className="pb-3 font-semibold text-gray-900">Created</th>
                          <th className="pb-3 font-semibold text-gray-900 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {getUsersByRole('project_manager').map((user) => (
                          <tr key={user.id}>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{user.username}</span>
                              </div>
                            </td>
                            <td className="py-4 text-gray-600">{user.email}</td>
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
          </TabsContent>
        </Tabs>

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
                    {formatRoleName(editFormData.role)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Role cannot be changed
                </p>
              </div>
              {/* Role-specific field */}
              {editFormData.role === 'sales_rep' && (
                <div>
                  <Label htmlFor="edit-sales-rep">Sales Rep *</Label>
                  <Select
                    value={editFormData.salesRep}
                    onValueChange={(value) => setEditFormData({ ...editFormData, salesRep: value })}
                    disabled={isFetchingSalesReps}
                  >
                    <SelectTrigger id="edit-sales-rep">
                      <SelectValue placeholder={isFetchingSalesReps ? 'Loading...' : 'Select sales rep'} />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Include current value even if already assigned */}
                      {editFormData.salesRep && (
                        <SelectItem key={editFormData.salesRep} value={editFormData.salesRep}>
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            {editFormData.salesRep} (Current)
                          </div>
                        </SelectItem>
                      )}
                      {/* Show available options */}
                      {getAvailableSalesReps()
                        .filter(rep => rep !== editFormData.salesRep)
                        .map((rep) => (
                          <SelectItem key={rep} value={rep}>
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              {rep}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editFormData.role === 'canvasser' && (
                <div>
                  <Label htmlFor="edit-canvasser">Canvasser (Optional)</Label>
                  <Select
                    value={editFormData.canvasser || 'NONE'}
                    onValueChange={(value) => setEditFormData({ ...editFormData, canvasser: value === 'NONE' ? '' : value })}
                    disabled={isFetchingCanvassers}
                  >
                    <SelectTrigger id="edit-canvasser">
                      <SelectValue placeholder={isFetchingCanvassers ? 'Loading...' : 'Select a canvasser (optional)'} />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Option to clear assignment */}
                      <SelectItem value="NONE">None (Unassigned)</SelectItem>

                      {/* Include current value even if already assigned */}
                      {editFormData.canvasser && (
                        <SelectItem key={editFormData.canvasser} value={editFormData.canvasser}>
                          {editFormData.canvasser} (Current)
                        </SelectItem>
                      )}

                      {/* Show available options */}
                      {getAvailableCanvassers()
                        .filter(canvasser => canvasser !== editFormData.canvasser)
                        .map((canvasser) => (
                          <SelectItem key={canvasser} value={canvasser}>
                            {canvasser}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    You can change the assigned canvasser or leave unassigned
                  </p>
                </div>
              )}

              {/* Office Manager Assignment Fields */}
              {editFormData.role === 'office_manager' && selectedUser && (
                <>
                  {/* Office Manager Assignment */}
                  <div>
                    <Label htmlFor="edit-office-manager">Office Manager Assignment *</Label>
                    <Select
                      value={editFormData.officeManager || ''}
                      onValueChange={(value) => setEditFormData({ ...editFormData, officeManager: value })}
                      disabled={isFetchingOfficeManagers}
                    >
                      <SelectTrigger id="edit-office-manager">
                        <SelectValue placeholder={isFetchingOfficeManagers ? "Loading..." : "Select office manager"} />
                      </SelectTrigger>
                      <SelectContent>
                        {officeManagers.length === 0 && !isFetchingOfficeManagers && (
                          <div className="px-2 py-1.5 text-sm text-gray-500">
                            No office managers available in Twenty CRM
                          </div>
                        )}
                        {officeManagers.map((om) => (
                          <SelectItem key={om} value={om}>
                            {om}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      This office manager will only see leads with this value in Twenty CRM
                    </p>
                  </div>

                  <div>
                    <Label>Assign Sales Reps</Label>
                    <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                      {getUsersByRole('sales_rep').map(user => (
                        <label key={user.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editFormData.selectedSalesReps?.includes(user.id) || false}
                            onChange={(e) => {
                              // Handle assignment change
                              const newAssignments = e.target.checked
                                ? [...(editFormData.selectedSalesReps || []), user.id]
                                : (editFormData.selectedSalesReps || []).filter((id: string) => id !== user.id);
                              setEditFormData({
                                ...editFormData,
                                selectedSalesReps: newAssignments
                              });
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{user.username} ({user.email})</span>
                        </label>
                      ))}
                      {getUsersByRole('sales_rep').length === 0 && (
                        <p className="text-sm text-gray-500">No sales reps available</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Assign Canvassers</Label>
                    <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                      {getUsersByRole('canvasser').map(user => (
                        <label key={user.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editFormData.selectedCanvassers?.includes(user.id) || false}
                            onChange={(e) => {
                              // Handle assignment change
                              const newAssignments = e.target.checked
                                ? [...(editFormData.selectedCanvassers || []), user.id]
                                : (editFormData.selectedCanvassers || []).filter((id: string) => id !== user.id);
                              setEditFormData({
                                ...editFormData,
                                selectedCanvassers: newAssignments
                              });
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{user.username} ({user.email})</span>
                        </label>
                      ))}
                      {getUsersByRole('canvasser').length === 0 && (
                        <p className="text-sm text-gray-500">No canvassers available</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Assign Project Managers</Label>
                    <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                      {getUsersByRole('project_manager').map(user => (
                        <label key={user.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editFormData.selectedProjectManagers?.includes(user.id) || false}
                            onChange={(e) => {
                              // Handle assignment change
                              const newAssignments = e.target.checked
                                ? [...(editFormData.selectedProjectManagers || []), user.id]
                                : (editFormData.selectedProjectManagers || []).filter((id: string) => id !== user.id);
                              setEditFormData({
                                ...editFormData,
                                selectedProjectManagers: newAssignments
                              });
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{user.username} ({user.email})</span>
                        </label>
                      ))}
                      {getUsersByRole('project_manager').length === 0 && (
                        <p className="text-sm text-gray-500">No project managers available</p>
                      )}
                    </div>
                  </div>
                </>
              )}
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
