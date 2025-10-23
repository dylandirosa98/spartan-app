'use client';

import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useLeadStore } from '@/store/useLeadStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  format,
  parseISO,
  isToday as isDateToday,
  isTomorrow as isDateTomorrow,
  isThisWeek,
  isThisMonth,
  isBefore,
  startOfDay,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { Lead } from '@/types';

type FilterPeriod = 'week' | 'month';
type DateSection = 'today' | 'tomorrow' | 'thisWeek' | 'later';

export default function CalendarPage() {
  const { leads, updateLead, fetchLeads } = useLeadStore();
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('week');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [completingLeadId, setCompletingLeadId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Get leads with follow-ups scheduled
  const leadsWithFollowUps = useMemo(() => {
    return leads
      .filter((lead) => lead.nextFollowUp)
      .sort((a, b) => {
        const dateA = new Date(a.nextFollowUp!);
        const dateB = new Date(b.nextFollowUp!);
        return dateA.getTime() - dateB.getTime();
      });
  }, [leads]);

  // Filter leads based on selected period
  const filteredLeads = useMemo(() => {
    return leadsWithFollowUps.filter((lead) => {
      const followUpDate = parseISO(lead.nextFollowUp!);

      if (filterPeriod === 'week') {
        return isThisWeek(followUpDate, { weekStartsOn: 0 });
      } else {
        return isThisMonth(followUpDate);
      }
    });
  }, [leadsWithFollowUps, filterPeriod]);

  // Categorize leads into sections
  const categorizedLeads = useMemo(() => {
    const sections: Record<DateSection, Lead[]> = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
    };

    filteredLeads.forEach((lead) => {
      const followUpDate = parseISO(lead.nextFollowUp!);

      if (isDateToday(followUpDate)) {
        sections.today.push(lead);
      } else if (isDateTomorrow(followUpDate)) {
        sections.tomorrow.push(lead);
      } else if (isThisWeek(followUpDate, { weekStartsOn: 0 })) {
        sections.thisWeek.push(lead);
      } else {
        sections.later.push(lead);
      }
    });

    return sections;
  }, [filteredLeads]);

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      new: 'bg-blue-100 text-blue-800 border-blue-200',
      contacted: 'bg-purple-100 text-purple-800 border-purple-200',
      qualified: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      proposal_sent: 'bg-orange-100 text-orange-800 border-orange-200',
      won: 'bg-green-100 text-green-800 border-green-200',
      lost: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Check if a date is in the past
  const isPastDate = (dateStr: string) => {
    const followUpDate = startOfDay(parseISO(dateStr));
    const today = startOfDay(new Date());
    return isBefore(followUpDate, today);
  };

  // Handle lead click
  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  // Mark follow-up as complete
  const handleMarkComplete = async (lead: Lead, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    setCompletingLeadId(lead.id);

    try {
      await updateLead(lead.id, {
        id: lead.id,
        nextFollowUp: undefined, // Remove the follow-up date
        notes: lead.notes
          ? `${lead.notes}\n\nFollow-up completed on ${format(new Date(), 'MMM d, yyyy h:mm a')}`
          : `Follow-up completed on ${format(new Date(), 'MMM d, yyyy h:mm a')}`,
      });

      // Close dialog if this lead is currently selected
      if (selectedLead?.id === lead.id) {
        setIsDetailOpen(false);
        setSelectedLead(null);
      }
    } catch (error) {
      console.error('Failed to mark follow-up as complete:', error);
    } finally {
      setCompletingLeadId(null);
    }
  };

  // Format phone number
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Render lead card
  const renderLeadCard = (lead: Lead) => {
    const isOverdue = lead.nextFollowUp && isPastDate(lead.nextFollowUp);
    const isCompleting = completingLeadId === lead.id;

    return (
      <Card
        key={lead.id}
        className="cursor-pointer transition-all hover:shadow-md hover:border-[#C41E3A]/30"
        onClick={() => handleLeadClick(lead)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-gray-900 truncate">
                {lead.name}
              </CardTitle>
              {lead.nextFollowUp && (
                <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {isOverdue && <AlertCircle className="inline h-3 w-3 mr-1" />}
                  {format(parseISO(lead.nextFollowUp), 'h:mm a')}
                  {isOverdue && ' - Overdue'}
                </p>
              )}
            </div>
            <Badge
              variant="outline"
              className={`flex-shrink-0 ${getStatusColor(lead.status)}`}
            >
              {formatStatus(lead.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
            <span className="truncate">
              {lead.city}, {lead.state}
            </span>
          </div>

          {lead.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
              <span className="truncate">{formatPhone(lead.phone)}</span>
            </div>
          )}

          {lead.estimatedValue && (
            <div className="flex items-center text-sm font-medium text-[#C41E3A]">
              <DollarSign className="h-4 w-4 mr-1 flex-shrink-0" />
              <span>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                }).format(lead.estimatedValue)}
              </span>
            </div>
          )}

          <div className="pt-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 hover:border-green-300"
              onClick={(e) => handleMarkComplete(lead, e)}
              disabled={isCompleting}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isCompleting ? 'Completing...' : 'Mark Complete'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render section
  const renderSection = (title: string, leads: Lead[], icon: React.ReactNode) => {
    if (leads.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <Badge variant="secondary" className="ml-2">
            {leads.length}
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map(renderLeadCard)}
        </div>
      </div>
    );
  };

  const totalFollowUps = filteredLeads.length;
  const overdueCount = filteredLeads.filter((lead) => lead.nextFollowUp && isPastDate(lead.nextFollowUp)).length;
  const todayCount = categorizedLeads.today.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Follow-up Calendar
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              View and manage your scheduled follow-ups with leads
            </p>
          </div>

          {/* Filter Tabs */}
          <Tabs value={filterPeriod} onValueChange={(value) => setFilterPeriod(value as FilterPeriod)}>
            <TabsList>
              <TabsTrigger value="week" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                This Week
              </TabsTrigger>
              <TabsTrigger value="month" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                This Month
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#C41E3A]">
                {totalFollowUps}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {filterPeriod === 'week' ? 'This week' : 'This month'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {overdueCount}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Needs attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {todayCount}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Due today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar List View */}
        {totalFollowUps === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarIcon className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No follow-ups scheduled
              </h3>
              <p className="text-sm text-gray-600 text-center max-w-md">
                {filterPeriod === 'week'
                  ? 'There are no follow-ups scheduled for this week. Start by adding follow-up dates to your leads.'
                  : 'There are no follow-ups scheduled for this month. Start by adding follow-up dates to your leads.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Today Section */}
            {renderSection(
              'Today',
              categorizedLeads.today,
              <div className="h-8 w-8 rounded-lg bg-[#C41E3A] flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            )}

            {/* Tomorrow Section */}
            {renderSection(
              'Tomorrow',
              categorizedLeads.tomorrow,
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
            )}

            {/* This Week Section */}
            {renderSection(
              'This Week',
              categorizedLeads.thisWeek,
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
            )}

            {/* Later Section */}
            {filterPeriod === 'month' && renderSection(
              'Later This Month',
              categorizedLeads.later,
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-gray-600" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {selectedLead.name}
                </DialogTitle>
                <DialogDescription>
                  Lead details and contact information
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status and Follow-up */}
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline" className={getStatusColor(selectedLead.status)}>
                    {formatStatus(selectedLead.status)}
                  </Badge>
                  {selectedLead.propertyType && (
                    <Badge variant="outline">
                      {selectedLead.propertyType.charAt(0).toUpperCase() + selectedLead.propertyType.slice(1)}
                    </Badge>
                  )}
                  {selectedLead.nextFollowUp && (
                    <Badge className="bg-[#C41E3A] text-white border-[#C41E3A]">
                      <Clock className="h-3 w-3 mr-1" />
                      Follow-up: {format(parseISO(selectedLead.nextFollowUp), 'MMM d, yyyy h:mm a')}
                    </Badge>
                  )}
                </div>

                {/* Contact Information */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                      Contact Info
                    </h4>

                    {selectedLead.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-3 text-[#C41E3A]" />
                        <a href={`tel:${selectedLead.phone}`} className="text-blue-600 hover:underline">
                          {formatPhone(selectedLead.phone)}
                        </a>
                      </div>
                    )}

                    {selectedLead.email && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-3 text-[#C41E3A]" />
                        <a href={`mailto:${selectedLead.email}`} className="text-blue-600 hover:underline truncate">
                          {selectedLead.email}
                        </a>
                      </div>
                    )}

                    <div className="flex items-start text-sm">
                      <MapPin className="h-4 w-4 mr-3 mt-0.5 text-[#C41E3A]" />
                      <div>
                        <div>{selectedLead.address}</div>
                        <div className="text-gray-600">
                          {selectedLead.city}, {selectedLead.state} {selectedLead.zipCode}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                      Lead Details
                    </h4>

                    {selectedLead.estimatedValue && (
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 mr-3 text-[#C41E3A]" />
                        <span className="font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                          }).format(selectedLead.estimatedValue)}
                        </span>
                      </div>
                    )}

                    {selectedLead.createdAt && (
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="h-4 w-4 mr-3 text-[#C41E3A]" />
                        <span className="text-gray-600">
                          Created: {format(parseISO(selectedLead.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}

                    {selectedLead.roofType && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Roof Type:</span>{' '}
                        <span className="text-gray-600">{selectedLead.roofType}</span>
                      </div>
                    )}

                    {selectedLead.assignedTo && (
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-3 text-[#C41E3A]" />
                        <span className="text-gray-600">
                          Assigned to: {selectedLead.assignedTo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Source Information */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                    Source
                  </h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">
                      <span className="font-medium">Source:</span>{' '}
                      {selectedLead.source.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    {selectedLead.medium && (
                      <span className="text-gray-600">
                        <span className="font-medium">Medium:</span>{' '}
                        {selectedLead.medium.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedLead.notes && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                      Notes
                    </h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                      {selectedLead.notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="flex-1 bg-[#C41E3A] hover:bg-[#A01828]"
                      onClick={() => window.location.href = `tel:${selectedLead.phone}`}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Lead
                    </Button>
                    {selectedLead.email && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.location.href = `mailto:${selectedLead.email}`}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    )}
                  </div>
                  {selectedLead.nextFollowUp && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 hover:border-green-300"
                      onClick={() => handleMarkComplete(selectedLead)}
                      disabled={completingLeadId === selectedLead.id}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {completingLeadId === selectedLead.id ? 'Marking Complete...' : 'Mark Follow-up Complete'}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
