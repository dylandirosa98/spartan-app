import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storeApiKey, getApiKey, removeApiKey } from '@/lib/api/encryption';
import { twentyApi } from '@/lib/api/twenty';
import { APIConfig, TwentyCRMConfig, User, Permission } from '@/types';
import { authenticateUser } from '@/lib/demo-users';

interface AuthState {
  config: APIConfig;
  currentUser: User | null;
  setConfig: (twentyConfig: TwentyCRMConfig) => void;
  testConnection: () => Promise<boolean>;
  clearConfig: () => void;
  isConfigured: () => boolean;
  setUser: (user: User) => void;
  login: (email: string, password: string) => User | null;
  logout: () => void;
  getUserPermissions: () => Permission[];
  hasPermission: (permission: Permission) => boolean;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      config: {
        twentyCRM: {
          apiUrl: '',
          apiKey: '',
          workspaceId: '',
        },
        isConfigured: false,
        lastValidated: undefined,
      },
      currentUser: null,

      setConfig: (twentyConfig: TwentyCRMConfig) => {
        // Store API key securely
        storeApiKey(twentyConfig.apiKey);

        set({
          config: {
            twentyCRM: twentyConfig,
            isConfigured: true,
            lastValidated: new Date(),
          },
        });
      },

      testConnection: async () => {
        try {
          // Test connection by fetching leads
          await twentyApi.getLeads();

          set({
            config: {
              ...get().config,
              isConfigured: true,
              lastValidated: new Date(),
            },
          });

          return true;
        } catch (error) {
          console.error('Connection test failed:', error);

          set({
            config: {
              ...get().config,
              isConfigured: false,
            },
          });

          return false;
        }
      },

      clearConfig: () => {
        // Remove API key from localStorage
        removeApiKey();

        set({
          config: {
            twentyCRM: {
              apiUrl: '',
              apiKey: '',
              workspaceId: '',
            },
            isConfigured: false,
            lastValidated: undefined,
          },
        });
      },

      isConfigured: () => {
        const { config } = get();
        return config.isConfigured && !!getApiKey();
      },

      setUser: (user: User) => {
        set({ currentUser: user });
      },

      login: (email: string, password: string) => {
        const user = authenticateUser(email, password);
        if (user) {
          set({ currentUser: user });
        }
        return user;
      },

      logout: () => {
        set({ currentUser: null });
      },

      getUserPermissions: () => {
        const { currentUser } = get();
        return currentUser?.permissions || [];
      },

      hasPermission: (permission: Permission) => {
        const { currentUser } = get();
        return currentUser?.permissions.includes(permission) || false;
      },

      isAuthenticated: () => {
        const { currentUser } = get();
        return currentUser !== null;
      },
    }),
    {
      name: 'spartan-auth-storage',
      partialize: (state) => ({
        config: {
          ...state.config,
          twentyCRM: {
            ...state.config.twentyCRM,
            apiKey: '', // Don't persist API key in state (stored separately)
          },
        },
        currentUser: state.currentUser, // Persist user in localStorage
      }),
    }
  )
);
