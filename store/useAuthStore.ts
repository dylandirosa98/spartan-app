import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storeApiKey, getApiKey, removeApiKey } from '@/lib/api/encryption';
import { twentyApi } from '@/lib/api/twenty';
import { APIConfig, TwentyCRMConfig, User, Permission } from '@/types';
import { authenticateUser } from '@/lib/demo-users';

interface AuthState {
  config: APIConfig;
  currentUser: User | null;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setConfig: (twentyConfig: TwentyCRMConfig) => void;
  testConnection: () => Promise<boolean>;
  clearConfig: () => void;
  isConfigured: () => boolean;
  setUser: (user: User) => void;
  login: (email: string, password: string) => Promise<User | null>;
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
      _hasHydrated: true, // Default to true to prevent flickering

      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        });
      },

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

      login: async (email: string, password: string) => {
        const user = await authenticateUser(email, password);
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
        const { currentUser, _hasHydrated } = get();
        // If not hydrated yet, allow all permissions to prevent flickering
        if (!_hasHydrated) {
          return true;
        }
        return currentUser?.permissions.includes(permission) || false;
      },

      isAuthenticated: () => {
        const { currentUser, _hasHydrated } = get();
        // If not hydrated yet, return true to prevent redirect during hydration
        if (!_hasHydrated) {
          return true;
        }
        return currentUser !== null;
      },
    }),
    {
      name: 'spartan-auth-storage',
      storage: {
        getItem: (name) => {
          // Check if we're in browser environment
          if (typeof window === 'undefined') return null;

          const value = window.localStorage.getItem(name);
          if (value) {
            console.log('[Auth] Loaded from localStorage, currentUser:',
              value.includes('currentUser') ? 'found' : 'not found');
          }
          return value as any;
        },
        setItem: (name, value) => {
          // Check if we're in browser environment
          if (typeof window === 'undefined') return;

          console.log('[Auth] Saving to localStorage');
          window.localStorage.setItem(name, value as unknown as string);
        },
        removeItem: (name) => {
          // Check if we're in browser environment
          if (typeof window === 'undefined') return;

          console.log('[Auth] Removing from localStorage');
          window.localStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        config: {
          ...state.config,
          twentyCRM: {
            ...state.config.twentyCRM,
            apiKey: '', // Don't persist API key in state (stored separately)
          },
        },
        currentUser: state.currentUser, // Persist user
      } as any),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.log('[Auth] Error during hydration', error);
          } else {
            console.log('[Auth] Hydration finished, currentUser:', state?.currentUser?.email || 'null');
            state?.setHasHydrated(true);
          }
        };
      },
    }
  )
);
