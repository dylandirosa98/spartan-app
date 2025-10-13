'use client';

import { useAppStore } from '@/store/useAppStore';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TopNav() {
  const { isOnline, isSyncing } = useAppStore((state) => ({
    isOnline: state.isOnline,
    isSyncing: state.isSyncing,
  }));

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b bg-white">
      <div className="flex h-full items-center justify-between px-4">
        {/* Logo/Title */}
        <div className="flex items-center gap-3">
          <img
            src="/spartan-logo.svg"
            alt="Spartan Exteriors"
            className="h-10 w-auto"
          />
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          {/* Sync Status */}
          {isSyncing && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="hidden sm:inline">Syncing...</span>
            </div>
          )}

          {/* Online/Offline Indicator */}
          <div
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium',
              isOnline
                ? 'bg-success/10 text-success'
                : 'bg-error/10 text-error'
            )}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
