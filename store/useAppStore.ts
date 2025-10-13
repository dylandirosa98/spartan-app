import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Toast } from '@/types';
import { useLeadStore } from './useLeadStore';

interface AppStoreState extends AppState {
  notifications: Toast[];

  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  sync: () => Promise<void>;
  addNotification: (notification: Omit<Toast, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markNotificationAsRead: (id: string) => void;
  setSyncing: (isSyncing: boolean) => void;
  incrementSyncErrors: () => void;
  resetSyncErrors: () => void;
  setPendingChanges: (count: number) => void;
  setInstalled: (isInstalled: boolean) => void;
  setUpdateAvailable: (updateAvailable: boolean) => void;
}

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,
      lastSyncAt: undefined,
      syncErrors: 0,
      pendingChanges: 0,
      isInstalled: false,
      updateAvailable: false,
      notifications: [],

      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });

        // Auto-sync when coming back online
        if (isOnline && !get().isSyncing) {
          const { sync } = get();
          sync();
        }
      },

      sync: async () => {
        const { isOnline, isSyncing } = get();

        if (!isOnline || isSyncing) {
          return;
        }

        set({ isSyncing: true });

        try {
          // Sync leads with Twenty CRM
          const leadStore = useLeadStore.getState();
          await leadStore.syncWithCrm();

          set({
            lastSyncAt: new Date(),
            syncErrors: 0,
            isSyncing: false,
          });

          // Add success notification
          get().addNotification({
            type: 'success',
            title: 'Sync Complete',
            message: 'Successfully synced with Twenty CRM',
            duration: 3000,
          });
        } catch (error) {
          console.error('Sync failed:', error);

          set((state) => ({
            syncErrors: state.syncErrors + 1,
            isSyncing: false,
          }));

          // Add error notification
          get().addNotification({
            type: 'error',
            title: 'Sync Failed',
            message: error instanceof Error ? error.message : 'Failed to sync with Twenty CRM',
            duration: 5000,
          });
        }
      },

      addNotification: (notification: Omit<Toast, 'id'>) => {
        const newNotification: Toast = {
          id: crypto.randomUUID(),
          ...notification,
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-remove notification after duration (if specified)
        if (notification.duration) {
          setTimeout(() => {
            get().removeNotification(newNotification.id);
          }, notification.duration);
        }
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      markNotificationAsRead: (id: string) => {
        // Simply remove the notification when marked as read
        get().removeNotification(id);
      },

      setSyncing: (isSyncing: boolean) => {
        set({ isSyncing });
      },

      incrementSyncErrors: () => {
        set((state) => ({ syncErrors: state.syncErrors + 1 }));
      },

      resetSyncErrors: () => {
        set({ syncErrors: 0 });
      },

      setPendingChanges: (count: number) => {
        set({ pendingChanges: count });
      },

      setInstalled: (isInstalled: boolean) => {
        set({ isInstalled });
      },

      setUpdateAvailable: (updateAvailable: boolean) => {
        set({ updateAvailable });

        if (updateAvailable) {
          get().addNotification({
            type: 'info',
            title: 'Update Available',
            message: 'A new version of the app is available. Refresh to update.',
            action: {
              label: 'Refresh',
              onClick: () => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              },
            },
          });
        }
      },
    }),
    {
      name: 'spartan-app-storage',
      partialize: (state) => ({
        isInstalled: state.isInstalled,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

// Set up online/offline event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAppStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useAppStore.getState().setOnlineStatus(false);
  });
}

// Export a hook to get notification count
export const useNotificationCount = () => {
  const notifications = useAppStore((state) => state.notifications);
  return notifications.length;
};
