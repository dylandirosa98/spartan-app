import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Lead, LeadFilters, CreateLead, UpdateLead } from '@/types';

interface LeadState {
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  filters: LeadFilters;
  searchQuery: string;
  companyId: string | null;
  salesRepFilter: string | null; // For mobile users - filter by sales rep

  // Actions
  setCompanyId: (companyId: string | null) => void;
  setSalesRepFilter: (salesRep: string | null) => void;
  fetchLeads: (salesRep?: string) => Promise<void>;
  addLead: (lead: CreateLead) => Promise<Lead | null>;
  updateLead: (id: string, lead: UpdateLead) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  setFilters: (filters: LeadFilters) => void;
  setSearchQuery: (query: string) => void;
  syncWithCrm: () => Promise<void>;
  getFilteredLeads: () => Lead[];
}

export const useLeadStore = create<LeadState>()(
  persist(
    (set, get) => ({
      leads: [],
      isLoading: false,
      error: null,
      filters: {},
      searchQuery: '',
      companyId: null,
      salesRepFilter: null,

      setCompanyId: (companyId: string | null) => {
        set({ companyId });
      },

      setSalesRepFilter: (salesRep: string | null) => {
        set({ salesRepFilter: salesRep });
      },

      fetchLeads: async (salesRep?: string) => {
        const { companyId, salesRepFilter } = get();

        if (!companyId) {
          console.log('[Lead Store] No company ID set, skipping fetch');
          set({ leads: [], isLoading: false });
          return;
        }

        // Use provided salesRep parameter or the stored filter
        const effectiveSalesRep = salesRep || salesRepFilter;

        console.log('[Lead Store] Fetching leads for company:', companyId, effectiveSalesRep ? `(salesRep: ${effectiveSalesRep})` : '');
        set({ isLoading: true, error: null });

        try {
          const url = effectiveSalesRep
            ? `/api/leads?company_id=${companyId}&salesRep=${encodeURIComponent(effectiveSalesRep)}`
            : `/api/leads?company_id=${companyId}`;

          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(`Failed to fetch leads: ${response.statusText}`);
          }

          const { leads } = await response.json();
          console.log('[Lead Store] Fetched', leads.length, 'leads', effectiveSalesRep ? `for sales rep: ${effectiveSalesRep}` : '');

          set({ leads, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch leads';
          console.error('[Lead Store] Error in fetchLeads:', errorMessage, error);
          set({ error: errorMessage, isLoading: false, leads: [] });
        }
      },

      addLead: async (leadData: CreateLead) => {
        const { companyId, fetchLeads } = get();

        if (!companyId) {
          set({ error: 'No company ID set' });
          return null;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...leadData, company_id: companyId }),
          });

          if (!response.ok) {
            throw new Error(`Failed to create lead: ${response.statusText}`);
          }

          const { lead } = await response.json();
          console.log('[Lead Store] Created lead:', lead.id);

          // Refresh leads
          await fetchLeads();

          set({ isLoading: false });
          return lead;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add lead';
          console.error('[Lead Store] Error in addLead:', errorMessage);
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },

      updateLead: async (id: string, leadData: UpdateLead) => {
        const { fetchLeads } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/leads', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...leadData, id }),
          });

          if (!response.ok) {
            throw new Error(`Failed to update lead: ${response.statusText}`);
          }

          console.log('[Lead Store] Updated lead:', id);

          // Refresh leads
          await fetchLeads();

          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update lead';
          console.error('[Lead Store] Error in updateLead:', errorMessage);
          set({ error: errorMessage, isLoading: false });
        }
      },

      deleteLead: async (id: string) => {
        const { fetchLeads } = get();
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`/api/leads?id=${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error(`Failed to delete lead: ${response.statusText}`);
          }

          console.log('[Lead Store] Deleted lead:', id);

          // Refresh leads
          await fetchLeads();

          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete lead';
          console.error('[Lead Store] Error in deleteLead:', errorMessage);
          set({ error: errorMessage, isLoading: false });
        }
      },

      setFilters: (filters: LeadFilters) => {
        set({ filters });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      syncWithCrm: async () => {
        const { fetchLeads } = get();
        await fetchLeads();
      },

      getFilteredLeads: () => {
        const { leads, filters, searchQuery } = get();

        let filteredLeads = [...leads];

        // Apply status filter - handle both exact match and case-insensitive match
        if (filters.status && filters.status.length > 0) {
          filteredLeads = filteredLeads.filter((lead) => {
            if (!lead.status) return false;
            // Direct match or case-insensitive match
            return filters.status!.some(filterStatus =>
              lead.status === filterStatus ||
              lead.status.toLowerCase() === filterStatus.toLowerCase()
            );
          });
        }

        // Apply source filter
        if (filters.source && filters.source.length > 0) {
          filteredLeads = filteredLeads.filter((lead) =>
            filters.source!.includes(lead.source as any)
          );
        }

        // Apply property type filter
        if (filters.propertyType) {
          filteredLeads = filteredLeads.filter(
            (lead) => lead.propertyType === filters.propertyType
          );
        }

        // Apply date range filter
        if (filters.dateFrom || filters.dateTo) {
          filteredLeads = filteredLeads.filter((lead) => {
            if (!lead.createdAt) return false;
            const createdDate = new Date(lead.createdAt);
            const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date(0);
            const toDate = filters.dateTo ? new Date(filters.dateTo) : new Date();
            return createdDate >= fromDate && createdDate <= toDate;
          });
        }

        // Apply assigned to filter
        if (filters.assignedTo) {
          filteredLeads = filteredLeads.filter(
            (lead) => lead.assignedTo === filters.assignedTo
          );
        }

        // Apply sync status filter
        if (filters.syncStatus && filters.syncStatus.length > 0) {
          filteredLeads = filteredLeads.filter(
            (lead) => lead.syncStatus && filters.syncStatus!.includes(lead.syncStatus)
          );
        }

        // Apply search query
        if (searchQuery || filters.search) {
          const query = (searchQuery || filters.search || '').toLowerCase();
          filteredLeads = filteredLeads.filter(
            (lead) =>
              lead.name.toLowerCase().includes(query) ||
              lead.email?.toLowerCase().includes(query) ||
              lead.phone?.includes(query) ||
              lead.address?.toLowerCase().includes(query) ||
              lead.city?.toLowerCase().includes(query) ||
              lead.notes?.toLowerCase().includes(query)
          );
        }

        return filteredLeads;
      },
    }),
    {
      name: 'spartan-lead-storage',
      // Don't persist leads - only persist filters and search
      partialize: (state) => ({
        filters: state.filters,
        searchQuery: state.searchQuery,
      }),
    }
  )
);
