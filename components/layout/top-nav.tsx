'use client';

import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import { Loader2, Wifi, WifiOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function TopNav() {
  const router = useRouter();
  const { isOnline, isSyncing } = useAppStore((state) => ({
    isOnline: state.isOnline,
    isSyncing: state.isSyncing,
  }));
  const { currentUser } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b bg-white">
      <div className="flex h-full items-center justify-between px-4">
        {/* Logo/Title */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-3 py-2 rounded-md">
            <img
              src="https://ik.imagekit.io/de9yylqdb/spartan-systems_123-removebg-preview.png?updatedAt=1761771143456"
              alt="Spartan Systems"
              className="h-8 w-auto"
            />
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          {/* Back to Admin (if master_admin) */}
          {currentUser?.role === 'master_admin' && (
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-[#C41E3A]/10 hover:text-[#C41E3A] hover:border-[#C41E3A]/30"
              onClick={() => router.push('/admin/dashboard')}
            >
              <Shield className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to Admin</span>
            </Button>
          )}
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
