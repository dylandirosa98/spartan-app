'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Save, X } from 'lucide-react';
import { useLeadEnums } from '@/hooks/use-lead-enums';

interface TwentyLead {
  id: string;
  name: string;
  email: { primaryEmail: string; additionalEmails: any } | null;
  phone: { primaryPhoneNumber: string; additionalPhones: any } | null;
  city: string | null;
  adress: string | null; // Note: Twenty has a typo in their schema
  zipCode: string | null;
  status: string | null;
  source: string | null;
  medium: string | null;
  salesRep: string | null;
  estValue: { amountMicros: number; currencyCode: string } | null;
  notes: string | null;
  aiSummary: string | null;
  appointmentTime: string | null;
  rawUtmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  gclid: string | null;
  fbclid: string | null;
  wbraid: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy: any;
  position: number;
  callPage: any;
}

interface LeadInfoViewProps {
  leadId: string;
  onEdit?: () => void;
}

export function LeadInfoView({ leadId, onEdit: _onEdit }: LeadInfoViewProps) {
  const params = useParams();
  const companyId = params.company_id as string;
  const { toast } = useToast();
  const { enums, isLoading: enumsLoading } = useLeadEnums();

  const [lead, setLead] = useState<TwentyLead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLeadFromTwenty();
  }, [leadId, companyId]);

  const fetchLeadFromTwenty = async () => {
    if (!leadId || !companyId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/leads/${leadId}/twenty?companyId=${companyId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch lead from Twenty CRM');
      }

      const data = await response.json();
      setLead(data.lead);
    } catch (error) {
      console.error('[Lead Info] Error fetching lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lead information from Twenty CRM',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (field: string, currentValue: any) => {
    setEditingField(field);
    setEditValues({ [field]: currentValue });
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValues({});
  };

  const saveField = async (field: string) => {
    if (!lead) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/twenty/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          updates: { [field]: editValues[field] },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }

      toast({
        title: 'Updated',
        description: `${field} has been updated successfully`,
      });

      // Refresh data
      await fetchLeadFromTwenty();
      setEditingField(null);
      setEditValues({});
    } catch (error) {
      console.error('[Lead Info] Error updating lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to update field',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Format estimated value from micros to dollars
  const formatEstimatedValue = (estValue: TwentyLead['estValue']) => {
    if (!estValue || !estValue.amountMicros) return '—';
    const dollars = estValue.amountMicros / 1000000;
    return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Editable field component
  const EditableField = ({
    label,
    field,
    value,
    type = 'text',
    options,
    multiline = false,
  }: {
    label: string;
    field: string;
    value: any;
    type?: 'text' | 'email' | 'select' | 'number' | 'datetime-local';
    options?: { value: string; label: string }[];
    multiline?: boolean;
  }) => {
    const isEditing = editingField === field;
    const displayValue = value || '—';

    return (
      <div className="group relative">
        <Label className="text-xs text-gray-500 uppercase">{label}</Label>
        <div className="flex items-center gap-2 mt-1">
          {isEditing ? (
            <>
              {multiline ? (
                <Textarea
                  value={editValues[field] || ''}
                  onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                  className="flex-1"
                  rows={3}
                  autoFocus
                />
              ) : type === 'select' && options ? (
                <Select
                  value={editValues[field] || ''}
                  onValueChange={(val) => setEditValues({ ...editValues, [field]: val })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={type}
                  value={editValues[field] || ''}
                  onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                  className="flex-1"
                  autoFocus
                />
              )}
              <button
                onClick={() => saveField(field)}
                disabled={isSaving}
                className="p-2 text-green-600 hover:bg-green-50 rounded"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={cancelEditing}
                disabled={isSaving}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <p className="flex-1 text-sm">{displayValue}</p>
              <button
                onClick={() => startEditing(field, value)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-[#C41E3A] rounded transition-opacity"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  if (isLoading || enumsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {[...Array(12)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!lead || !enums) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Unable to load lead information</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Lead Information */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <EditableField
          label="Name"
          field="name"
          value={lead.name}
        />

        <EditableField
          label="Email"
          field="email"
          value={lead.email?.primaryEmail}
          type="email"
        />

        <EditableField
          label="Phone"
          field="phone"
          value={lead.phone?.primaryPhoneNumber}
        />

        <EditableField
          label="City"
          field="city"
          value={lead.city}
        />

        <EditableField
          label="Address"
          field="adress"
          value={lead.adress}
        />

        <EditableField
          label="Zip Code"
          field="zipCode"
          value={lead.zipCode}
        />

        <EditableField
          label="Status"
          field="status"
          value={lead.status}
          type="select"
          options={enums.status}
        />

        <EditableField
          label="Source"
          field="source"
          value={lead.source}
          type="select"
          options={enums.source}
        />

        <EditableField
          label="Medium"
          field="medium"
          value={lead.medium}
          type="select"
          options={enums.medium}
        />

        <EditableField
          label="Sales Rep"
          field="salesRep"
          value={lead.salesRep}
          type="select"
          options={enums.salesRep}
        />

        <div className="group relative">
          <Label className="text-xs text-gray-500 uppercase">Estimated Value</Label>
          <div className="flex items-center gap-2 mt-1">
            {editingField === 'estValue' ? (
              <>
                <Input
                  type="number"
                  value={editValues.estValue || ''}
                  onChange={(e) => setEditValues({ ...editValues, estValue: e.target.value })}
                  className="flex-1"
                  placeholder="10000"
                  autoFocus
                />
                <button
                  onClick={() => saveField('estValue')}
                  disabled={isSaving}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={isSaving}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <p className="flex-1 text-sm font-semibold text-green-600">
                  {formatEstimatedValue(lead.estValue)}
                </p>
                <button
                  onClick={() => startEditing('estValue', lead.estValue?.amountMicros ? lead.estValue.amountMicros / 1000000 : '')}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-[#C41E3A] rounded transition-opacity"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        </div>

        <EditableField
          label="Appointment Time"
          field="appointmentTime"
          value={lead.appointmentTime ? new Date(lead.appointmentTime).toISOString().slice(0, 16) : ''}
          type="datetime-local"
        />
      </div>

      {/* UTM Parameters Section */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Tracking Parameters</h4>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <EditableField
            label="UTM Source"
            field="rawUtmSource"
            value={lead.rawUtmSource}
          />

          <EditableField
            label="UTM Medium"
            field="utmMedium"
            value={lead.utmMedium}
          />

          <EditableField
            label="UTM Campaign"
            field="utmCampaign"
            value={lead.utmCampaign}
          />

          <EditableField
            label="UTM Content"
            field="utmContent"
            value={lead.utmContent}
          />

          <EditableField
            label="UTM Term"
            field="utmTerm"
            value={lead.utmTerm}
          />

          <EditableField
            label="GCLID"
            field="gclid"
            value={lead.gclid}
          />

          <EditableField
            label="FBCLID"
            field="fbclid"
            value={lead.fbclid}
          />

          <EditableField
            label="WBRAID"
            field="wbraid"
            value={lead.wbraid}
          />
        </div>
      </div>

      {/* AI Summary & Notes */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Information</h4>
        <div className="space-y-4">
          <EditableField
            label="AI Summary"
            field="aiSummary"
            value={lead.aiSummary}
            multiline
          />

          <EditableField
            label="Notes"
            field="notes"
            value={lead.notes}
            multiline
          />
        </div>
      </div>

      {/* Metadata - Read Only */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Record Information</h4>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <Label className="text-xs text-gray-500 uppercase">Created At</Label>
            <p className="mt-1 text-sm">
              {new Date(lead.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            <Label className="text-xs text-gray-500 uppercase">Updated At</Label>
            <p className="mt-1 text-sm">
              {new Date(lead.updatedAt).toLocaleString()}
            </p>
          </div>

          {lead.createdBy && (
            <div>
              <Label className="text-xs text-gray-500 uppercase">Created By</Label>
              <p className="mt-1 text-sm">
                {lead.createdBy.name || lead.createdBy.source || '—'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
