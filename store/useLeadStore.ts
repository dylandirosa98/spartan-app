import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Lead, LeadFilters, CreateLead, UpdateLead } from '@/types';
import { db } from '@/lib/db';
import { twentyApi } from '@/lib/api/twenty';

interface LeadState {
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  filters: LeadFilters;
  searchQuery: string;

  // Actions
  fetchLeads: () => Promise<void>;
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

      fetchLeads: async () => {
        console.log('fetchLeads called - setting loading to true');
        set({ isLoading: true, error: null });

        try {
          // Fetch directly from Twenty CRM - no local caching
          console.log('About to call twentyApi.getLeads()');
          const crmLeads = await twentyApi.getLeads();
          console.log('CRM leads fetched:', crmLeads.length);
          console.log('CRM leads:', crmLeads);
          console.log('Sample lead:', crmLeads[0]);

          console.log('About to update store with', crmLeads.length, 'leads');
          set({ leads: crmLeads, isLoading: false });
          console.log('Store updated - checking state');

          // Verify the update
          const currentState = get();
          console.log('Current leads in store after update:', currentState.leads.length);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch leads from Twenty CRM';
          console.error('Error in fetchLeads:', errorMessage, error);
          set({ error: errorMessage, isLoading: false, leads: [] });
        }
      },

      addLead: async (leadData: CreateLead) => {
        set({ isLoading: true, error: null });

        try {
          // Create lead directly in Twenty CRM
          const newLead = await twentyApi.createLead(leadData);

          // Refresh leads from CRM to get the updated list
          const { fetchLeads } = get();
          await fetchLeads();

          set({ isLoading: false });
          return newLead;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add lead to Twenty CRM';
          set({ error: errorMessage, isLoading: false });
          return null;
        }
      },

      updateLead: async (id: string, leadData: UpdateLead) => {
        set({ isLoading: true, error: null });

        try {
          // Update lead directly in Twenty CRM
          await twentyApi.updateLead(id, leadData);

          // Refresh leads from CRM to get the updated list
          const { fetchLeads } = get();
          await fetchLeads();

          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update lead in Twenty CRM';
          set({ error: errorMessage, isLoading: false });
        }
      },

      deleteLead: async (id: string) => {
        set({ isLoading: true, error: null });

        try {
          // Delete from Twenty CRM
          await twentyApi.deleteLead(id);

          // Refresh leads from CRM to get the updated list
          const { fetchLeads } = get();
          await fetchLeads();

          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete lead from Twenty CRM';
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

        // Apply status filter
        if (filters.status && filters.status.length > 0) {
          filteredLeads = filteredLeads.filter((lead) =>
            filters.status!.includes(lead.status)
          );
        }

        // Apply source filter
        if (filters.source && filters.source.length > 0) {
          filteredLeads = filteredLeads.filter((lead) =>
            filters.source!.includes(lead.source)
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
