'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLeadStore } from '@/store/useLeadStore';
import { useAuthStore } from '@/store/useAuthStore';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LeadDialog } from '@/components/leads/lead-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  UserCheck,
} from 'lucide-react';
import { Lead, LeadStatus, LeadSource } from '@/types';
import { useParams } from 'next/navigation';

export default function LeadsPage() {
  const params = useParams();
  const companyId = params.company_id as string;

  const {
    leads,
    isLoading,
    error,
    filters,
    searchQuery,
    fetchLeads,
    setFilters,
    setSearchQuery,
    getFilteredLeads,
    setCompanyId,
  } = useLeadStore();

  const { currentUser } = useAuthStore();

  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  // Set company ID from URL and fetch leads on mount
  useEffect(() => {
    if (companyId) {
      console.log('[Leads Page] Setting company ID from URL:', companyId);
      setCompanyId(companyId);
      fetchLeads();
    }
  }, [companyId, setCompanyId, fetchLeads]);

  // Get filtered leads with role-based filtering
  const filteredLeads = useMemo(() => {
    console.log('Total leads in store:', leads.length);
    console.log('All leads:', leads);
    console.log('Current filters:', filters);
    console.log('Search query:', searchQuery);

    let baseFilteredLeads = getFilteredLeads();
    console.log('After getFilteredLeads:', baseFilteredLeads.length);

    // Apply role-based filtering
    if (currentUser?.role === 'salesperson') {
      // Salespeople only see their assigned leads
      baseFilteredLeads = baseFilteredLeads.filter(
        (lead) => lead.assignedTo === currentUser.id
      );
      console.log('After role filtering (salesperson):', baseFilteredLeads.length);
    }
    // Owners and managers see all leads

    console.log('Final filtered leads:', baseFilteredLeads.length);
    return baseFilteredLeads;
  }, [getFilteredLeads, currentUser, leads, filters, searchQuery]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, setSearchQuery]);

  // Get status badge variant and color
  const getStatusBadge = (status: LeadStatus) => {
    const statusConfig: Record<
      LeadStatus,
      { label: string; className: string }
    > = {
      new: { label: 'New', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      contacted: { label: 'Contacted', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      qualified: { label: 'Qualified', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      quoted: { label: 'Quoted', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      proposal_sent: { label: 'Proposal Sent', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      won: { label: 'Won', className: 'bg-green-100 text-green-800 border-green-200' },
      lost: { label: 'Lost', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    };

    const config = statusConfig[status] || { label: status || 'Unknown', className: 'bg-gray-100 text-gray-800 border-gray-200' };
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Get source label
  const getSourceLabel = (source: LeadSource | string) => {
    const sourceLabels: Record<string, string> = {
      google_ads: 'Google Ads',
      google_lsa: 'Google LSA',
      facebook_ads: 'Facebook Ads',
      canvass: 'Canvass',
      referral: 'Referral',
      website: 'Website',
      twenty_crm: 'Twenty CRM',
    };
    return sourceLabels[source] || source || 'Unknown';
  };

  // Get sync status icon
  const getSyncStatusIcon = (lead: Lead) => {
    if (!lead.syncStatus) return null;

    const iconConfig = {
      synced: { icon: CheckCircle2, className: 'text-green-600', label: 'Synced' },
      pending: { icon: Clock, className: 'text-yellow-600', label: 'Pending sync' },
      error: { icon: AlertCircle, className: 'text-red-600', label: 'Sync error' },
    };

    const config = iconConfig[lead.syncStatus];
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-1 text-xs" title={config.label}>
        <Icon className={`h-3 w-3 ${config.className}`} />
      </div>
    );
  };

  // Format phone number
  const formatPhone = (phone: string | undefined | null) => {
    if (!phone || typeof phone !== 'string') return phone || '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handle lead click
  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDialogMode('edit');
    setIsNewLeadOpen(true);
  };

  // Handle new lead
  const handleNewLead = () => {
    setSelectedLead(null);
    setDialogMode('create');
    setIsNewLeadOpen(true);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setLocalSearchQuery('');
    setSearchQuery('');
  };

  const hasActiveFilters =
    filters.status?.length ||
    filters.source?.length ||
    filters.dateFrom ||
    filters.dateTo ||
    searchQuery;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
              {currentUser?.role === 'salesperson' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <UserCheck className="h-3 w-3 mr-1" />
                  My Leads Only
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              {currentUser?.role === 'salesperson'
                ? 'Your assigned roofing leads'
                : 'Manage and track your roofing leads'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLeads()}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleNewLead}
              className="gap-2 bg-[#C41E3A] hover:bg-[#A01828]"
            >
              <Plus className="h-4 w-4" />
              New Lead
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search leads by name, email, phone, address..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 sm:w-auto"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs bg-[#C41E3A]">
                  !
                </Badge>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={filters.status?.[0] || 'all'}
                      onValueChange={(value) => {
                        if (value === 'all') {
                          setFilters({ ...filters, status: undefined });
                        } else {
                          setFilters({ ...filters, status: [value as LeadStatus] });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="quoted">Quoted</SelectItem>
                        <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select
                      value={filters.source?.[0] || 'all'}
                      onValueChange={(value) => {
                        if (value === 'all') {
                          setFilters({ ...filters, source: undefined });
                        } else {
                          setFilters({ ...filters, source: [value as LeadSource] });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sources</SelectItem>
                        <SelectItem value="google_ads">Google Ads</SelectItem>
                        <SelectItem value="google_lsa">Google LSA</SelectItem>
                        <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                        <SelectItem value="canvass">Canvass</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date From</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom || ''}
                      onChange={(e) =>
                        setFilters({ ...filters, dateFrom: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date To</Label>
                    <Input
                      type="date"
                      value={filters.dateTo || ''}
                      onChange={(e) =>
                        setFilters({ ...filters, dateTo: e.target.value })
                      }
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Bar */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredLeads.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#C41E3A]/10 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-[#C41E3A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredLeads.filter((l) => l.status === 'new').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Qualified</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredLeads.filter((l) => l.status === 'qualified').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Won</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredLeads.filter((l) => l.status === 'won').length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && leads.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-gray-100 p-4 mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {hasActiveFilters ? 'No leads found' : 'No leads yet'}
              </h3>
              <p className="text-gray-600 text-center max-w-md mb-6">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search query to find what you\'re looking for.'
                  : 'Get started by creating your first lead or syncing with your CRM.'}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button
                  onClick={handleNewLead}
                  className="bg-[#C41E3A] hover:bg-[#A01828]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Lead
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Leads Grid */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLeads.map((lead) => (
              <Card
                key={lead.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-[#C41E3A]/30"
                onClick={() => handleLeadClick(lead)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {lead.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {getSourceLabel(lead.source)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 ml-2">
                      <div className="flex items-center gap-1.5">
                        {getSyncStatusIcon(lead)}
                        {getStatusBadge(lead.status)}
                      </div>
                      {lead.stage && (
                        <Badge variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                          {lead.stage}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{formatPhone(lead.phone)}</span>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">
                      {lead.city}, {lead.state}
                    </span>
                  </div>
                  {lead.estimatedValue && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-[#C41E3A]">
                        {formatCurrency(lead.estimatedValue)}
                      </span>
                    </div>
                  )}
                  {lead.nextFollowUp && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs">
                        Follow up:{' '}
                        {new Date(lead.nextFollowUp).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {lead.propertyType && (
                    <div className="pt-2">
                      <Badge variant="secondary" className="text-xs">
                        {lead.propertyType === 'residential'
                          ? 'Residential'
                          : 'Commercial'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>

      {/* Lead Dialog for Create/Edit */}
      <LeadDialog
        open={isNewLeadOpen}
        onOpenChange={setIsNewLeadOpen}
        lead={selectedLead}
        mode={dialogMode}
      />
    </DashboardLayout>
  );
}
