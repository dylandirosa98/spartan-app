'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Building2, Eye, EyeOff } from 'lucide-react';
import type { Company, CreateCompany } from '@/types';

export default function AdminManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, logout } = useAuthStore();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({});

  // Form state
  const [formData, setFormData] = useState<CreateCompany>({
    name: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    twentyApiUrl: 'https://crm.thespartanexteriors.com/rest',
    twentyApiKey: '',
    isActive: true,
  });

  // Check authentication - only master_admin can access
  useEffect(() => {
    if (!user || user.role !== 'master_admin') {
      router.push('/login');
    }
  }, [user, router]);

  // Fetch companies
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/companies');
      const data = await response.json();

      if (response.ok) {
        setCompanies(data.companies || []);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch companies',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/companies';
      const method = editingCompany ? 'PUT' : 'POST';
      const body = editingCompany
        ? { ...formData, id: editingCompany.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: editingCompany ? 'Company Updated' : 'Company Created',
          description: data.message,
        });

        setIsDialogOpen(false);
        resetForm();
        fetchCompanies();
      } else {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: 'Error',
        description: 'Failed to save company',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      logo: company.logo,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      address: company.address,
      city: company.city,
      state: company.state,
      zipCode: company.zipCode,
      twentyApiUrl: company.twentyApiUrl,
      twentyApiKey: company.twentyApiKey,
      supabaseUrl: company.supabaseUrl,
      supabaseKey: company.supabaseKey,
      isActive: company.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) {
      return;
    }

    try {
      const response = await fetch(`/api/companies?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Company Deleted',
          description: data.message,
        });
        fetchCompanies();
      } else {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete company',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      twentyApiUrl: 'https://crm.thespartanexteriors.com/rest',
      twentyApiKey: '',
      isActive: true,
    });
    setEditingCompany(null);
  };

  const toggleApiKeyVisibility = (companyId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [companyId]: !prev[companyId],
    }));
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-8 w-8 text-[#C41E3A]" />
              Arisys Admin Panel
            </h1>
            <p className="text-gray-600 mt-1">Multi-Company Management System</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-[#C41E3A] hover:bg-[#A01829]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCompany ? 'Edit Company' : 'Add New Company'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCompany
                      ? 'Update company information and credentials'
                      : 'Add a new roofing company to the system'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Company Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Contact Phone *</Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        maxLength={2}
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code *</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twentyApiUrl">Twenty CRM API URL *</Label>
                    <Input
                      id="twentyApiUrl"
                      value={formData.twentyApiUrl}
                      onChange={(e) => setFormData({ ...formData, twentyApiUrl: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twentyApiKey">Twenty CRM API Key *</Label>
                    <Input
                      id="twentyApiKey"
                      type="password"
                      value={formData.twentyApiKey}
                      onChange={(e) => setFormData({ ...formData, twentyApiKey: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supabaseUrl">Supabase URL (Optional)</Label>
                    <Input
                      id="supabaseUrl"
                      value={formData.supabaseUrl || ''}
                      onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supabaseKey">Supabase Key (Optional)</Label>
                    <Input
                      id="supabaseKey"
                      type="password"
                      value={formData.supabaseKey || ''}
                      onChange={(e) => setFormData({ ...formData, supabaseKey: e.target.value })}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-[#C41E3A] hover:bg-[#A01829]">
                      {editingCompany ? 'Update Company' : 'Create Company'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Companies</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading companies...</div>
            ) : companies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No companies found. Add your first company to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Twenty CRM</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{company.contactEmail}</div>
                          <div className="text-gray-500">{company.contactPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{company.city}, {company.state}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm flex items-center gap-2">
                          <span className="font-mono text-xs">
                            {showApiKeys[company.id]
                              ? company.twentyApiKey
                              : '••••••••••••'}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleApiKeyVisibility(company.id)}
                          >
                            {showApiKeys[company.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            company.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(company)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(company.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
