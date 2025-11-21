'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Lead, CreateLead, LeadSource, LeadMedium, LeadStatus, PropertyType } from '@/types';
import { useLeadStore } from '@/store/useLeadStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/hooks/use-toast';
import { DEMO_USERS } from '@/lib/demo-users';
import { NotesTimeline } from './notes-timeline';
import { TasksTimeline } from './tasks-timeline';
import { LeadInfoView } from './lead-info-view';
import { FilesView } from './files-view';

// Form validation schema - relaxed for leads from Twenty CRM
const leadFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().max(2, 'Use 2-letter state code').optional().or(z.literal('')),
  zipCode: z.string().optional().or(z.literal('')),
  source: z.enum(['google_ads', 'google_lsa', 'facebook_ads', 'canvass', 'referral', 'website', 'twenty_crm']),
  medium: z.enum(['cpc', 'lsas', 'social_ads', 'canvass', 'referral', 'organic']),
  status: z.enum(['NEW', 'CONTACTED', 'SCHEDULED', 'INSPECTION_INSURANCE', 'PROPOSAL_SENT', 'CONTRACT_SIGNED', 'LOST', 'JOB_SCHEDULED', 'JOB_COMPLETED', 'INVOICE_SENT', 'PAST_DUE_30_DAYS', 'PAID', 'PAID_30_DAYS']),
  propertyType: z.enum(['residential', 'commercial']).optional(),
  notes: z.string().max(5000, 'Notes are too long').optional(),
  estimatedValue: z.string().optional(),
  roofType: z.string().max(100, 'Roof type is too long').optional(),
  nextFollowUp: z.string().optional(),
  assignedTo: z.string().optional(),
  canvasser: z.string().optional(),
  officeManager: z.string().optional(),
  demo: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  mode?: 'create' | 'edit';
}

export function LeadDialog({ open, onOpenChange, lead, mode = 'create' }: LeadDialogProps) {
  const { addLead, updateLead } = useLeadStore();
  const { currentUser } = useAuthStore();
  const { toast } = useToast();
  const [canvassers, setCanvassers] = useState<string[]>([]);
  const [officeManagers, setOfficeManagers] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      source: 'website',
      medium: 'organic',
      status: 'NEW',
      propertyType: 'residential',
      notes: '',
      estimatedValue: '',
      roofType: '',
      nextFollowUp: '',
      assignedTo: 'unassigned',
      canvasser: '',
      officeManager: '',
      demo: '',
    },
  });

  // Watch select values
  const source = watch('source');
  const medium = watch('medium');
  const status = watch('status');
  const propertyType = watch('propertyType');
  const assignedTo = watch('assignedTo');
  const canvasser = watch('canvasser');
  const officeManager = watch('officeManager');
  const demo = watch('demo');

  // Fetch canvassers from Twenty CRM
  useEffect(() => {
    const fetchCanvassers = async () => {
      if (!currentUser?.company_id) return;

      try {
        const response = await fetch(`/api/canvassers?companyId=${currentUser.company_id}`);
        const data = await response.json();
        if (data.canvassers) {
          setCanvassers(data.canvassers);
        }
      } catch (error) {
        console.error('Failed to fetch canvassers:', error);
      }
    };

    fetchCanvassers();
  }, [currentUser?.company_id]);

  // Fetch office managers from Twenty CRM
  useEffect(() => {
    const fetchOfficeManagers = async () => {
      if (!currentUser?.company_id) return;

      try {
        const response = await fetch(`/api/office-managers?companyId=${currentUser.company_id}`);
        const data = await response.json();
        if (data.officeManagers) {
          setOfficeManagers(data.officeManagers);
        }
      } catch (error) {
        console.error('Failed to fetch office managers:', error);
      }
    };

    fetchOfficeManagers();
  }, [currentUser?.company_id]);

  // Populate form when editing
  useEffect(() => {
    if (lead && mode === 'edit') {
      reset({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        address: lead.address || '',
        city: lead.city || '',
        state: lead.state || '',
        zipCode: lead.zipCode || '',
        source: (lead.source as LeadSource) || 'twenty_crm',
        medium: (lead.medium as LeadMedium) || 'organic',
        status: (lead.status as LeadStatus) || 'NEW',
        propertyType: lead.propertyType as PropertyType | undefined,
        notes: lead.notes || '',
        estimatedValue: lead.estimatedValue?.toString() || '',
        roofType: lead.roofType || '',
        nextFollowUp: lead.nextFollowUp
          ? new Date(lead.nextFollowUp).toISOString().slice(0, 16)
          : '',
        assignedTo: lead.assignedTo || 'unassigned',
        canvasser: lead.canvasser || '',
        officeManager: lead.officeManager || '',
        demo: lead.demo || '',
      });
    } else if (!open) {
      // Reset form with default assignment for salespeople
      reset({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        source: 'website',
        medium: 'organic',
        status: 'NEW',
        propertyType: 'residential',
        notes: '',
        estimatedValue: '',
        roofType: '',
        nextFollowUp: '',
        assignedTo: currentUser?.role === 'salesperson' ? currentUser.id : 'unassigned',
        canvasser: '',
        officeManager: '',
        demo: '',
      });
    }
  }, [lead, mode, open, reset, currentUser]);

  const onSubmit = async (data: LeadFormData) => {
    try {
      const leadData: CreateLead = {
        name: data.name,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        zipCode: data.zipCode || undefined,
        source: data.source,
        medium: data.medium,
        status: data.status,
        propertyType: data.propertyType,
        notes: data.notes || undefined,
        estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : undefined,
        roofType: data.roofType || undefined,
        nextFollowUp: data.nextFollowUp ? new Date(data.nextFollowUp).toISOString() : undefined,
        assignedTo: data.assignedTo && data.assignedTo !== 'unassigned' ? data.assignedTo : undefined,
        canvasser: data.canvasser || undefined,
        officeManager: data.officeManager || undefined,
        demo: data.demo || undefined,
      };

      if (mode === 'edit' && lead) {
        await updateLead(lead.id, { ...leadData, id: lead.id });
        toast({
          title: 'Lead updated',
          description: 'Lead has been successfully updated.',
        });
      } else {
        await addLead(leadData);
        toast({
          title: 'Lead created',
          description: 'New lead has been successfully created.',
        });
      }

      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save lead',
        variant: 'destructive',
      });
    }
  };

  // Render form content
  const renderLeadForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#C41E3A]">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="(555) 123-4567"
                  {...register('phone')}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#C41E3A]">Address</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">
                  Street Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  {...register('address')}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="Columbus"
                    {...register('city')}
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    placeholder="OH"
                    maxLength={2}
                    {...register('state')}
                    className={errors.state ? 'border-red-500' : ''}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-500">{errors.state.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">
                    ZIP Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="zipCode"
                    placeholder="43215"
                    {...register('zipCode')}
                    className={errors.zipCode ? 'border-red-500' : ''}
                  />
                  {errors.zipCode && (
                    <p className="text-sm text-red-500">{errors.zipCode.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#C41E3A]">Lead Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">
                  Source <span className="text-red-500">*</span>
                </Label>
                <Select value={source} onValueChange={(value) => setValue('source', value as LeadSource)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google_ads">Google Ads</SelectItem>
                    <SelectItem value="google_lsa">Google LSA</SelectItem>
                    <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                    <SelectItem value="canvass">Canvass</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="twenty_crm">Twenty CRM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medium">
                  Medium <span className="text-red-500">*</span>
                </Label>
                <Select value={medium} onValueChange={(value) => setValue('medium', value as LeadMedium)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select medium" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpc">CPC</SelectItem>
                    <SelectItem value="lsas">LSAs</SelectItem>
                    <SelectItem value="social_ads">Social Ads</SelectItem>
                    <SelectItem value="canvass">Canvass</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="organic">Organic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select value={status} onValueChange={(value) => setValue('status', value as LeadStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
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

              {lead?.stage && (
                <div className="space-y-2">
                  <Label htmlFor="stage">Twenty CRM Stage</Label>
                  <Input
                    id="stage"
                    value={lead.stage}
                    disabled
                    className="bg-gray-50 text-gray-600"
                  />
                  <p className="text-xs text-gray-500">
                    This stage is synced from Twenty CRM and cannot be edited here.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select value={propertyType} onValueChange={(value) => setValue('propertyType', value as PropertyType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Select
                  value={assignedTo}
                  onValueChange={(value) => setValue('assignedTo', value)}
                  disabled={currentUser?.role === 'salesperson'}
                >
                  <SelectTrigger className={currentUser?.role === 'salesperson' ? 'bg-gray-100' : ''}>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {DEMO_USERS.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentUser?.role === 'salesperson' && (
                  <p className="text-xs text-gray-500">Salespeople can only assign leads to themselves</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="canvasser">Canvasser</Label>
                <Select
                  value={canvasser}
                  onValueChange={(value) => setValue('canvasser', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select canvasser" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {canvassers.map((canvasserName) => (
                      <SelectItem key={canvasserName} value={canvasserName}>
                        {canvasserName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="officeManager">Office Manager</Label>
                <Select
                  value={officeManager}
                  onValueChange={(value) => setValue('officeManager', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select office manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {officeManagers.map((managerName) => (
                      <SelectItem key={managerName} value={managerName}>
                        {managerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo">Demo</Label>
                <Select
                  value={demo}
                  onValueChange={(value) => setValue('demo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select demo status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not Set</SelectItem>
                    <SelectItem value="YES">Yes</SelectItem>
                    <SelectItem value="NO">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roofType">Roof Type</Label>
                <Input
                  id="roofType"
                  placeholder="Asphalt shingle"
                  {...register('roofType')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  step="0.01"
                  placeholder="15000"
                  {...register('estimatedValue')}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nextFollowUp">Next Follow-Up</Label>
                <Input
                  id="nextFollowUp"
                  type="datetime-local"
                  {...register('nextFollowUp')}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  rows={4}
                  placeholder="Additional notes about this lead..."
                  {...register('notes')}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {errors.notes && (
                  <p className="text-sm text-red-500">{errors.notes.message}</p>
                )}
              </div>
            </div>
          </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#C41E3A] hover:bg-[#A01830]"
        >
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Lead' : 'Create Lead'}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? lead?.name || 'Edit Lead' : 'New Lead'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'View and update lead information and notes' : 'Add a new lead to your pipeline'}
          </DialogDescription>
        </DialogHeader>

        {/* Use tabs only in edit mode to show lead details and notes */}
        {mode === 'edit' && lead ? (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            {/* Info Tab - Fetches live data from Twenty CRM */}
            <TabsContent value="info" className="mt-4">
              {lead.twentyId ? (
                <LeadInfoView
                  leadId={lead.twentyId}
                  onEdit={() => {
                    // Open Twenty CRM in new tab
                    const twentyUrl = `https://crm.thespartanexteriors.com/object/lead/${lead.twentyId}`;
                    window.open(twentyUrl, '_blank');
                  }}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Lead information is only available for leads synced with Twenty CRM.</p>
                  <p className="text-sm mt-2">This lead does not have a Twenty CRM ID.</p>
                </div>
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="mt-4">
              {lead.twentyId ? (
                <NotesTimeline leadId={lead.twentyId} leadName={lead.name} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Notes are only available for leads synced with Twenty CRM.</p>
                  <p className="text-sm mt-2">This lead does not have a Twenty CRM ID.</p>
                </div>
              )}
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="mt-4">
              {lead.twentyId ? (
                <TasksTimeline leadId={lead.twentyId} leadName={lead.name} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Tasks are only available for leads synced with Twenty CRM.</p>
                  <p className="text-sm mt-2">This lead does not have a Twenty CRM ID.</p>
                </div>
              )}
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="mt-4">
              {lead.twentyId ? (
                <FilesView leadId={lead.twentyId} leadName={lead.name} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Files are only available for leads synced with Twenty CRM.</p>
                  <p className="text-sm mt-2">This lead does not have a Twenty CRM ID.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          renderLeadForm()
        )}
      </DialogContent>
    </Dialog>
  );
}
